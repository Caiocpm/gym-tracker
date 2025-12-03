// src/components/NutritionTracker/NutritionTracker.tsx
import { useState } from "react";
import NutritionOverview from "./views/NutritionOverview/NutritionOverview";
import NutritionMeals from "./views/NutritionMeals/NutritionMeals";
import { NutritionNavigation } from "./components/NutritionNavigation/NutritionNavigation";
import { GoalsSettings } from "./components/GoalsSettings/GoalsSettings";
import { useDateSync } from "../../hooks/useDateSync";
import { useDateChangeNotification } from "../../hooks/useDateChangeNotification";
import styles from "./NutritionTracker.module.css"; // ✅ IMPORTA CSS MODULES

type ViewType = "overview" | "meals" | "settings";

export function NutritionTracker() {
  const [activeView, setActiveView] = useState<ViewType>("overview");

  // ✅ HOOKS DE SINCRONIZAÇÃO
  useDateSync();
  useDateChangeNotification();

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <NutritionOverview />;

      case "meals":
        return <NutritionMeals />;

      case "settings":
        return <GoalsSettings onClose={() => setActiveView("overview")} />;

      default:
        return <NutritionOverview />;
    }
  };

  return (
    <div className={styles.nutritionTracker}>
      <NutritionNavigation
        activeView={activeView}
        onViewChange={(view: ViewType) => {
          setActiveView(view);
        }}
      />

      <div className={styles.nutritionContent}>{renderContent()}</div>
    </div>
  );
}
