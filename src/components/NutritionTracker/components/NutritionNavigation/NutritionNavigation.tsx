// src/components/NutritionTracker/NutritionNavigation.tsx
import styles from "./NutritionNavigation.module.css"; // Importa os estilos como um objeto

interface NutritionNavigationProps {
  activeView: "overview" | "meals" | "settings";
  onViewChange: (view: "overview" | "meals" | "settings") => void;
}

export function NutritionNavigation({
  activeView,
  onViewChange,
}: NutritionNavigationProps) {
  return (
    <div className={styles.nutritionNavigationCard}>
      <div className={styles.nutritionNavHeader}>
        <h2> Contador de Calorias</h2>
        <p>Acompanhe sua alimentação e atinja suas metas</p>
      </div>

      <div className={styles.nutritionNavOptions}>
        <button
          className={`${styles.nutritionNavOption} ${
            activeView === "overview" ? styles.active : ""
          }`}
          onClick={() => onViewChange("overview")}
        >
          <div className={styles.navOptionIcon}>📊</div>
          <div className={styles.navOptionLabel}>Resumo</div>
        </button>

        <button
          className={`${styles.nutritionNavOption} ${
            activeView === "meals" ? styles.active : ""
          }`}
          onClick={() => onViewChange("meals")}
        >
          <div className={styles.navOptionIcon}>🍽️</div>
          <div className={styles.navOptionLabel}>Refeições</div>
        </button>

        {/* ✅ TERCEIRO BOTÃO - CONFIGURAÇÕES */}
        <button
          className={`${styles.nutritionNavOption} ${
            activeView === "settings" ? styles.active : ""
          }`}
          onClick={() => {
            onViewChange("settings");
          }}
        >
          <div className={styles.navOptionIcon}>⚙️</div>
          <div className={styles.navOptionLabel}>Configurações</div>
        </button>
      </div>
    </div>
  );
}
export default NutritionNavigation;
