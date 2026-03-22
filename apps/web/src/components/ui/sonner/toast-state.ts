import { reactive } from "vue";

export type ToastVariant = "default" | "success" | "error";

export interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  duration: number;
  variant: ToastVariant;
}

const toasts = reactive<ToastRecord[]>([]);
const toastTimers = new Map<string, number>();

function clearToastTimer(id: string): void {
  const timer = toastTimers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    toastTimers.delete(id);
  }
}

function scheduleDismiss(id: string, duration: number): void {
  clearToastTimer(id);
  if (duration <= 0) return;

  const timer = window.setTimeout(() => {
    dismissToast(id);
  }, duration);
  toastTimers.set(id, timer);
}

interface ShowToastInput {
  title: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
}

export function showToast(input: ShowToastInput): string {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const duration = input.duration ?? 3200;
  const record: ToastRecord = {
    id,
    title: input.title,
    description: input.description,
    duration,
    variant: input.variant ?? "default",
  };

  toasts.unshift(record);
  scheduleDismiss(id, duration);
  return id;
}

export function dismissToast(id: string): void {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index >= 0) {
    toasts.splice(index, 1);
  }
  clearToastTimer(id);
}

export function useToastState(): { toasts: ToastRecord[] } {
  return { toasts };
}

interface ToastActionInput {
  description?: string;
  duration?: number;
}

export const toast = {
  message(title: string, options: ToastActionInput = {}): string {
    return showToast({
      title,
      description: options.description,
      duration: options.duration,
      variant: "default",
    });
  },

  success(title: string, options: ToastActionInput = {}): string {
    return showToast({
      title,
      description: options.description,
      duration: options.duration,
      variant: "success",
    });
  },

  error(title: string, options: ToastActionInput = {}): string {
    return showToast({
      title,
      description: options.description,
      duration: options.duration ?? 4200,
      variant: "error",
    });
  },

  dismiss: dismissToast,
};
