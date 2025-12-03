import { createContext } from "react";

interface ToastData {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
    duration?: number
  ) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export type { ToastData, ToastContextType };
