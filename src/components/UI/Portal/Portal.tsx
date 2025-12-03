// src/components/UI/Portal/Portal.tsx
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  // ✅ VERIFICAÇÃO simples e direta
  if (typeof document === "undefined") {
    return null;
  }

  // ✅ RENDERIZAR diretamente no body
  return createPortal(children, document.body);
}
