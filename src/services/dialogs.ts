// Global in-app replacement for window.confirm() / window.alert().
//
// Why this exists: native browser dialogs (confirm/alert) are frequently
// blocked or silently no-op inside sandboxed preview iframes (Lovable,
// Bolt, StackBlitz, some embedded webviews) because they lack the
// "allow-modals" permission. When that happens a button that calls
// window.confirm(...) looks completely dead — nothing happens on click.
// Using an in-app modal instead guarantees the action always works,
// in preview AND in the final deployed production site.

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ConfirmRequest {
  id: number;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
}

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let idCounter = 0;

let confirmListeners: Array<(req: ConfirmRequest | null) => void> = [];
let toastListeners: Array<(items: ToastItem[]) => void> = [];
let toastItems: ToastItem[] = [];

export function subscribeConfirm(listener: (req: ConfirmRequest | null) => void) {
  confirmListeners.push(listener);
  return () => {
    confirmListeners = confirmListeners.filter(l => l !== listener);
  };
}

export function subscribeToasts(listener: (items: ToastItem[]) => void) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}

function emitToasts() {
  toastListeners.forEach(l => l([...toastItems]));
}

/**
 * Drop-in async replacement for window.confirm(). Renders an in-app modal
 * (via <DialogHost /> mounted once at the root) and resolves true/false
 * based on the user's choice.
 */
export function confirmDialog(
  message: string,
  options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }
): Promise<boolean> {
  return new Promise((resolve) => {
    const req: ConfirmRequest = {
      id: ++idCounter,
      message,
      title: options?.title,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      danger: options?.danger,
      resolve,
    };
    confirmListeners.forEach(l => l(req));
  });
}

/**
 * Drop-in replacement for window.alert() that shows a dismissible toast
 * instead of a blocking native dialog.
 */
export function notify(message: string, type: ToastType = 'success') {
  const item: ToastItem = { id: ++idCounter, message, type };
  toastItems = [...toastItems, item];
  emitToasts();
  setTimeout(() => {
    toastItems = toastItems.filter(t => t.id !== item.id);
    emitToasts();
  }, 4200);
}

export const showToast = notify;

export function dismissToast(id: number) {
  toastItems = toastItems.filter(t => t.id !== id);
  emitToasts();
}
