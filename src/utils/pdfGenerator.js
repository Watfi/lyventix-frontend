import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR = [59, 130, 246]; // blue-500
const DARK_COLOR = [30, 41, 59]; // slate-800
const GRAY_COLOR = [100, 116, 139]; // slate-500
const LIGHT_BG = [248, 250, 252]; // slate-50

const fmt = (val) => {
  if (val == null) return '$0';
  return '$' + Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 });
};

const addHeader = (doc, title, businessName, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName || 'Lyventix', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - 14, 10, { align: 'right' });
  doc.text(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), pageWidth - 14, 16, { align: 'right' });

  // Title
  doc.setTextColor(...DARK_COLOR);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_COLOR);
    doc.text(subtitle, 14, 47);
  }

  // Line
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, 50, pageWidth - 14, 50);

  return 55;
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_COLOR);
    doc.text(`Generado por Lyventix | Pagina ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
};

// ══════════════════════════════════════════════════════
// 1. REPORTE DE VENTAS
// ══════════════════════════════════════════════════════
export const generateSalesReport = (sales, dashboard, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Reporte de Ventas', businessName, `Total: ${dashboard?.salesCount || 0} ventas registradas`);

  // Summary cards
  const cards = [
    { label: 'Ventas Totales', value: fmt(dashboard?.totalSales) },
    { label: 'Ticket Promedio', value: fmt(dashboard?.averageTicket) },
    { label: 'Total Transacciones', value: String(dashboard?.salesCount || 0) },
  ];
  const cardWidth = 55;
  cards.forEach((card, i) => {
    const x = 14 + i * (cardWidth + 8);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, cardWidth, 22, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_COLOR);
    doc.text(card.label, x + 4, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 4, y + 17);
    doc.setFont('helvetica', 'normal');
  });
  y += 30;

  // Sales table
  if (sales && sales.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Factura', 'Fecha', 'Cliente', 'Estado', 'Metodo', 'Total']],
      body: sales.map(s => [
        s.invoiceNumber || '-',
        s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-CO') : '-',
        s.customerName || 'Sin cliente',
        s.status === 'COMPLETED' ? 'Completada' : s.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente',
        s.paymentMethod === 'CASH' ? 'Efectivo' : s.paymentMethod === 'CARD' ? 'Tarjeta' : s.paymentMethod || '-',
        fmt(s.total),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_COLOR);
    doc.text('No hay ventas registradas', 14, y + 10);
  }

  addFooter(doc);
  doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════
// 2. REPORTE DE PRODUCTOS MAS VENDIDOS
// ══════════════════════════════════════════════════════
export const generateTopProductsReport = (topProducts, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Productos Mas Vendidos', businessName, 'Ranking por cantidad vendida');

  if (topProducts && topProducts.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Producto', 'Cantidad Vendida', 'Ingresos']],
      body: topProducts.map((p, i) => [
        i + 1,
        p.productName,
        p.quantitySold + ' uds',
        fmt(p.totalRevenue),
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
      },
    });

    // Visual bar chart below table
    const finalY = doc.previousAutoTable.finalY + 15;
    if (finalY < 220) {
      doc.setFontSize(11);
      doc.setTextColor(...DARK_COLOR);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribucion Visual', 14, finalY);
      doc.setFont('helvetica', 'normal');

      const maxQty = topProducts[0]?.quantitySold || 1;
      const barColors = [[59,130,246],[99,102,241],[168,85,247],[249,115,22],[16,185,129]];
      topProducts.slice(0, 8).forEach((p, i) => {
        const by = finalY + 8 + i * 14;
        const barWidth = (p.quantitySold / maxQty) * 120;
        doc.setFontSize(8);
        doc.setTextColor(...DARK_COLOR);
        doc.text(p.productName.substring(0, 25), 14, by + 4);
        doc.setFillColor(...(barColors[i % barColors.length]));
        doc.roundedRect(80, by, barWidth, 6, 2, 2, 'F');
        doc.setTextColor(...GRAY_COLOR);
        doc.text(`${p.quantitySold}`, 80 + barWidth + 3, by + 5);
      });
    }
  }

  addFooter(doc);
  doc.save(`Reporte_TopProductos_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════
// 3. REPORTE DE VENTAS DIARIAS
// ══════════════════════════════════════════════════════
export const generateDailySalesReport = (dailySales, dashboard, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Reporte de Ventas Diarias', businessName, 'Tendencia de ventas por dia');

  // Summary
  const totalAmount = dailySales?.reduce((sum, d) => sum + Number(d.totalAmount || 0), 0) || 0;
  const totalCount = dailySales?.reduce((sum, d) => sum + Number(d.count || 0), 0) || 0;
  const avgDaily = dailySales?.length > 0 ? totalAmount / dailySales.length : 0;

  const cards = [
    { label: 'Total del Periodo', value: fmt(totalAmount) },
    { label: 'Promedio Diario', value: fmt(avgDaily) },
    { label: 'Dias con Ventas', value: String(dailySales?.length || 0) },
    { label: 'Total Transacciones', value: String(totalCount) },
  ];
  const cw = 40;
  cards.forEach((card, i) => {
    const x = 14 + i * (cw + 5);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, cw, 22, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_COLOR);
    doc.text(card.label, x + 3, y + 8);
    doc.setFontSize(11);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 3, y + 17);
    doc.setFont('helvetica', 'normal');
  });
  y += 30;

  if (dailySales && dailySales.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Ventas', 'Total', '% del Total']],
      body: dailySales.map(d => [
        d.date,
        d.count + ' ventas',
        fmt(d.totalAmount),
        totalAmount > 0 ? ((Number(d.totalAmount) / totalAmount) * 100).toFixed(1) + '%' : '0%',
      ]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' } },
    });
  }

  addFooter(doc);
  doc.save(`Reporte_VentasDiarias_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════
// 4. REPORTE DE INVENTARIO / STOCK
// ══════════════════════════════════════════════════════
export const generateInventoryReport = (stockItems, branchName, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Reporte de Inventario', businessName, `Sucursal: ${branchName || 'Principal'}`);

  const totalProducts = stockItems?.length || 0;
  const lowStockItems = stockItems?.filter(s => s.lowStock) || [];
  const totalValue = stockItems?.reduce((sum, s) => sum + (Number(s.salePrice || 0) * (s.quantity || 0)), 0) || 0;

  const cards = [
    { label: 'Total Productos', value: String(totalProducts) },
    { label: 'Productos Stock Bajo', value: String(lowStockItems.length) },
    { label: 'Valor del Inventario', value: fmt(totalValue) },
  ];
  const cw = 55;
  cards.forEach((card, i) => {
    const x = 14 + i * (cw + 8);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, cw, 22, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_COLOR);
    doc.text(card.label, x + 4, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 4, y + 17);
    doc.setFont('helvetica', 'normal');
  });
  y += 30;

  if (stockItems && stockItems.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['SKU', 'Producto', 'Categoria', 'Stock', 'Min', 'Precio', 'Valor Total', 'Estado']],
      body: stockItems.map(s => [
        s.productSku || '-',
        s.productName,
        s.categoryName || '-',
        s.quantity,
        s.minQuantity ?? '-',
        fmt(s.salePrice),
        fmt(Number(s.salePrice || 0) * (s.quantity || 0)),
        s.lowStock ? 'BAJO' : 'OK',
      ]),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === 'body') {
          if (data.cell.raw === 'BAJO') {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      },
    });
  }

  addFooter(doc);
  doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════
// 5. REPORTE DE CLIENTES
// ══════════════════════════════════════════════════════
export const generateCustomersReport = (customers, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Reporte de Clientes', businessName, `${customers?.length || 0} clientes registrados`);

  if (customers && customers.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nombre', 'Email', 'Telefono', 'Documento', 'Direccion']],
      body: customers.map(c => [
        c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '-',
        c.email || '-',
        c.phone || '-',
        c.documentNumber || '-',
        c.address || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_COLOR);
    doc.text('No hay clientes registrados', 14, y + 10);
  }

  addFooter(doc);
  doc.save(`Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════
// 6. REPORTE DE CAJA (SESIONES)
// ══════════════════════════════════════════════════════
export const generateCashReport = (sessions, businessName) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Reporte de Sesiones de Caja', businessName, `${sessions?.length || 0} sesiones registradas`);

  const totalEarnings = sessions?.reduce((sum, s) => {
    if (s.status === 'CLOSED') return sum + (Number(s.expectedBalance || 0) - Number(s.openingBalance || 0));
    return sum;
  }, 0) || 0;

  const cards = [
    { label: 'Total Sesiones', value: String(sessions?.length || 0) },
    { label: 'Ganancias Totales', value: fmt(totalEarnings) },
  ];
  cards.forEach((card, i) => {
    const x = 14 + i * 63;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, 55, 22, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_COLOR);
    doc.text(card.label, x + 4, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(...DARK_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 4, y + 17);
    doc.setFont('helvetica', 'normal');
  });
  y += 30;

  if (sessions && sessions.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Apertura', 'Cierre', 'Saldo Inicial', 'Saldo Esperado', 'Saldo Real', 'Ganancia', 'Estado']],
      body: sessions.map(s => {
        const earnings = Number(s.expectedBalance || 0) - Number(s.openingBalance || 0);
        return [
          s.openingDate ? new Date(s.openingDate).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-',
          s.closingDate ? new Date(s.closingDate).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-',
          fmt(s.openingBalance),
          fmt(s.expectedBalance),
          fmt(s.actualBalance),
          s.status === 'CLOSED' ? fmt(earnings) : '-',
          s.status === 'CLOSED' ? 'Cerrada' : 'Abierta',
        ];
      }),
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'center' } },
    });
  }

  addFooter(doc);
  doc.save(`Reporte_Caja_${new Date().toISOString().slice(0, 10)}.pdf`);
};
