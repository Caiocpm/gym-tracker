// src/components/NutritionTracker/views/NutritionMeals.tsx
import MealSection from "../../components/MealSection";
import DailyProgressCard from "../../components/DailyProgressCard";
import styles from "./NutritionMeals.module.css"; // ✅ IMPORTA CSS MODULES

function NutritionMeals() {
  return (
    <div className={styles.nutritionMeals}>
      <div className={styles.mealsHeader}>
        <h3>🍽️ Refeições do Dia</h3>
        <p>Gerencie suas refeições e acompanhe sua nutrição</p>
      </div>

      <DailyProgressCard />

      <div className={styles.mealsContainer}>
        <MealSection meal="breakfast" title="Café da Manhã" icon="🌅" />
        <MealSection meal="lunch" title="Almoço" icon="🌞" />
        <MealSection meal="dinner" title="Jantar" icon="🌙" />
        <MealSection meal="snack" title="Lanches" icon="🍎" />
      </div>
    </div>
  );
}
export default NutritionMeals;
