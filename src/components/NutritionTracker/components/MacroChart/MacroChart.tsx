// src/components/NutritionTracker/MacroChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./MacroChart.module.css"; // Importa os estilos como um objeto

interface MacroChartProps {
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percentage: number;
    };
  }>;
}

// ✅ Componente CustomTooltip movido para fora do render
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.macroTooltip}>
        <p>{data.name}</p>
        <p>
          {data.value} kcal ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function MacroChart({ nutrition }: MacroChartProps) {
  // Calcular calorias por macronutriente
  const proteinCalories = nutrition.protein * 4;
  const carbsCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;

  const data = [
    {
      name: "Proteína",
      value: proteinCalories,
      percentage:
        nutrition.calories > 0
          ? Math.round((proteinCalories / nutrition.calories) * 100)
          : 0,
      color: "#e74c3c",
    },
    {
      name: "Carboidratos",
      value: carbsCalories,
      percentage:
        nutrition.calories > 0
          ? Math.round((carbsCalories / nutrition.calories) * 100)
          : 0,
      color: "#f39c12",
    },
    {
      name: "Gorduras",
      value: fatCalories,
      percentage:
        nutrition.calories > 0
          ? Math.round((fatCalories / nutrition.calories) * 100)
          : 0,
      color: "#27ae60",
    },
  ];

  const COLORS = ["#e74c3c", "#f39c12", "#27ae60"];

  if (nutrition.calories === 0) {
    return (
      <div className={styles.macroChartSection}>
        <h4>📊 Distribuição de Macronutrientes</h4>
        <div className={styles.emptyChart}>
          <p>Adicione alimentos para ver a distribuição de macros</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.macroChartSection}>
      <h4>📊 Distribuição de Macronutrientes</h4>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.macroLegend}>
        {data.map((item, index) => (
          <div key={item.name} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ backgroundColor: COLORS[index] }}
            />
            <span>
              {item.name}: {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MacroChart;
