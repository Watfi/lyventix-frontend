import { create } from 'zustand';
import productService from '../services/productService';
import saleService from '../services/saleService';
import branchService from '../services/branchService';
import tableService from '../services/tableService';

const usePOSStore = create((set, get) => ({
  cart: [],
  products: [],
  tables: [],
  selectedTable: null,
  branchId: null,
  isRestaurant: false,
  loading: false,
  error: null,

  // Per-table order storage: { [tableId]: { cart: [], saleId: null } }
  tableOrders: {},

  // Initialization: load branch and tables
  initPOS: async (businessId, userBranchId) => {
    if (!businessId) return;
    set({ loading: true, error: null });
    try {
      let branchId = userBranchId;
      if (!branchId) {
        const branchRes = await branchService.getBranches(businessId);
        const branches = branchRes.data.content || branchRes.data || [];
        if (branches.length > 0) branchId = branches[0].id;
      }
      if (branchId) {
        set({ branchId });
        const tableRes = await tableService.getTables(branchId);
        const tables = tableRes.data || [];
        set({ tables, isRestaurant: tables.length > 0, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ error: 'Error al inicializar POS', loading: false });
    }
  },

  // Select table and restore its saved cart
  selectTable: (table) => {
    const { selectedTable, cart, tableOrders } = get();

    // Save current table's cart before switching
    if (selectedTable) {
      set({
        tableOrders: {
          ...tableOrders,
          [selectedTable.id]: {
            ...tableOrders[selectedTable.id],
            cart: [...cart],
          },
        },
      });
    }

    if (!table) {
      set({ selectedTable: null, cart: [] });
      return;
    }

    // Restore the new table's cart
    const savedOrder = get().tableOrders[table.id];
    set({
      selectedTable: table,
      cart: savedOrder?.cart || [],
    });
  },

  // Search products from backend
  searchProducts: async (query, businessId) => {
    if (!businessId) return;
    set({ loading: true, error: null });
    try {
      const response = await productService.getProducts(businessId, { search: query, size: 20 });
      const data = response.data;
      const products = data.content || data || [];
      set({ products, loading: false });
    } catch (error) {
      set({ error: 'Error al buscar productos', loading: false });
    }
  },

  // Cart Management
  addToCart: (product) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      set({ cart: cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) { get().removeFromCart(productId); return; }
    set({ cart: get().cart.map(item => item.id === productId ? { ...item, quantity } : item) });
  },

  updateItemOverride: (productId, overrides) => {
    set({
      cart: get().cart.map(item => {
        if (item.id !== productId) return item;
        return {
          ...item,
          ...(overrides.customName !== undefined && { customName: overrides.customName }),
          ...(overrides.customPrice !== undefined && { salePrice: overrides.customPrice }),
        };
      })
    });
  },

  clearCart: () => set({ cart: [] }),

  // Clear a specific table's saved order
  clearTableOrder: (tableId) => {
    const { tableOrders } = get();
    const updated = { ...tableOrders };
    delete updated[tableId];
    set({ tableOrders: updated });
  },

  getTotals: () => {
    const { cart } = get();
    const subtotal = cart.reduce((acc, item) => acc + (Number(item.salePrice) * item.quantity), 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  },

  processSale: async (businessId, saleData) => {
    set({ loading: true, error: null });
    try {
      const { cart, branchId, selectedTable, tableOrders } = get();
      const { total } = get().getTotals();
      const status = saleData.status || 'COMPLETED';

      // Check if there's an existing pending sale for this table
      const existingSaleId = saleData.saleId || (selectedTable ? tableOrders[selectedTable.id]?.saleId : null);

      const payload = {
        branchId: branchId || saleData.branchId,
        customerId: saleData.customerId || null,
        tableId: (selectedTable && !selectedTable.isDelivery) ? selectedTable.id : null,
        status,
        paymentMethod: saleData.paymentMethod || 'CASH',
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity, unitPrice: item.salePrice, discount: 0 })),
        discountAmount: saleData.discountAmount || 0,
        amountPaid: status === 'COMPLETED' ? total : 0,
        notes: saleData.notes || null,
      };

      let response;
      if (existingSaleId) {
        response = await saleService.updateSale(businessId, existingSaleId, payload);
      } else {
        response = await saleService.createSale(businessId, payload);
      }

      // Update table status
      if (selectedTable && status === 'PENDING') {
        tableService.updateStatus(selectedTable.id, 'OCCUPIED').catch(() => {});
        // Save the saleId for this table so we can update it later
        set({
          tableOrders: {
            ...get().tableOrders,
            [selectedTable.id]: { cart: [...cart], saleId: response.data.id },
          },
        });
      } else if (selectedTable && status === 'COMPLETED') {
        tableService.updateStatus(selectedTable.id, 'AVAILABLE').catch(() => {});
        // Clear table order
        get().clearTableOrder(selectedTable.id);
      }

      set({ cart: [], selectedTable: null, loading: false, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al procesar la venta';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  cancelSale: async (businessId, saleId, tableId) => {
    set({ loading: true, error: null });
    try {
      await saleService.cancelSale(businessId, saleId);
      if (tableId) {
        tableService.updateStatus(tableId, 'AVAILABLE').catch(() => {});
        get().clearTableOrder(tableId);
      }
      set({ cart: [], loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cancelar la venta';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },
}));

export default usePOSStore;
