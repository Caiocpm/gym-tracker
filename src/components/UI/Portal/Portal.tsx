// src/components/UI/Portal/Portal.tsx
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  // ✅ USAR modal-root se existir, senão usar body
  const portalRoot = document.getElementById("modal-root") || document.body;

  return createPortal(children, portalRoot);
}
