// src/components/AppContent/appContentTypes.ts
import type { AppView } from "../../contexts/AppNavigationContext";

export interface NavigationItem {
  id: AppView;
  label: string;
  icon: string;
}

// ✅ Forçar tipos literais
export const navigationItems: NavigationItem[] = [
  { id: "dashboard" as const, label: "Dashboard", icon: "📊" },
  { id: "profile" as const, label: "Perfil", icon: "👤" },
  { id: "workout" as const, label: "Treinos", icon: "💪" },
  { id: "nutrition" as const, label: "Dieta", icon: "🍎" },
  { id: "groups" as const, label: "Grupos", icon: "👥" },
  { id: "analytics" as const, label: "Analytics", icon: "📈" },
  { id: "settings" as const, label: "Config", icon: "⚙️" },
];
