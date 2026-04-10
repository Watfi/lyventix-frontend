import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', resolve: null, variant: 'danger' });

  const confirm = useCallback(({ title, message, variant = 'danger' } = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, title, message, variant, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve(true);
    setState(s => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    state.resolve(false);
    setState(s => ({ ...s, open: false }));
  };

  return { confirm, dialogProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel } };
}
