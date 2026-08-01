import { create } from 'zustand';

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  resolveRequest: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,

  confirm: (message, options) =>
    new Promise<boolean>((resolve) => {
      set({ request: { message, resolve, ...options } });
    }),

  resolveRequest: (value) => {
    get().request?.resolve(value);
    set({ request: null });
  },
}));
