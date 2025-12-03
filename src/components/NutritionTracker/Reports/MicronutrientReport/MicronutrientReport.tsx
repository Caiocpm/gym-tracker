// src/components/NutritionTracker/Reports/MicronutrientReport/MicronutrientReport.tsx
import { useMemo } from "react";
import type { FoodEntry, Micronutrients } from "../../../../types/nutrition";
import styles from "./MicronutrientReport.module.css";

interface MicronutrientReportProps {
  entries: FoodEntry[];
  customGoals?: Record<string, number>;
}

const MICRONUTRIENT_LABELS: Record<keyof Required<Micronutrients>, string> = {
  vitaminA: "Vitamina A",
  vitaminB1: "Vitamina B1",
  vitaminB2: "Vitamina B2",
  vitaminB3: "Vitamina B3",
  vitaminB6: "Vitamina B6",
  vitaminB12: "Vitamina B12",
  vitaminC: "Vitamina C",
  vitaminE: "Vitamina E",
  folate: "Folato",
  calcium: "Cálcio",
  iron: "Ferro",
  magnesium: "Magnésio",
  phosphorus: "Fósforo",
  potassium: "Potássio",
  sodium: "Sódio",
  zinc: "Zinco",
  copper: "Cobre",
  manganese: "Manganês",
  selenium: "Selênio",
  fiber: "Fibra",
  cholesterol: "Colesterol",
};

const MICRONUTRIENT_UNITS: Record<keyof Required<Micronutrients>, string> = {
  vitaminA: "μg",
  vitaminB1: "mg",
  vitaminB2: "mg",
  vitaminB3: "mg",
  vitaminB6: "mg",
  vitaminB12: "μg",
  vitaminC: "mg",
  vitaminE: "mg",
  folate: "μg",
  calcium: "mg",
  iron: "mg",
  magnesium: "mg",
  phosphorus: "mg",
  potassium: "mg",
  sodium: "mg",
  zinc: "mg",
  copper: "mg",
  manganese: "mg",
  selenium: "μg",
  fiber: "g",
  cholesterol: "mg",
};

const DAILY_VALUES: Record<keyof Required<Micronutrients>, number> = {
  vitaminA: 900,
  vitaminB1: 1.2,
  vitaminB2: 1.3,
  vitaminB3: 16,
  vitaminB6: 1.3,
  vitaminB12: 2.4,
  vitaminC: 90,
  vitaminE: 15,
  folate: 400,
  calcium: 1000,
  iron: 8,
  magnesium: 400,
  phosphorus: 700,
  potassium: 3500,
  sodium: 2300,
  zinc: 11,
  copper: 0.9,
  manganese: 2.3,
  selenium: 55,
  fiber: 25,
  cholesterol: 300,
};

export default function MicronutrientReport({
  entries,
  customGoals,
}: MicronutrientReportProps) {
  const getGoalForNutrient = (
    nutrientKey: keyof Required<Micronutrients>
  ): number => {
    if (customGoals && customGoals[nutrientKey]) {
      return customGoals[nutrientKey];
    }
    return DAILY_VALUES[nutrientKey];
  };

  // ✅ FUNÇÃO PARA VERIFICAR SE TEM META PERSONALIZADA
  const hasCustomGoal = (
    nutrientKey: keyof Required<Micronutrients>
  ): boolean => {
    if (!customGoals) {
      return false;
    }

    const value = customGoals[nutrientKey];

    const result =
      value !== undefined &&
      value !== null &&
      typeof value === "number" &&
      value > 0;

    return result;
  };

  // ✅ FUNÇÃO PARA VERIFICAR SE É MICRONUTRIENTE SUSPEITO DE SER MANUAL
  const isSuspiciouslyManual = (
    nutrientKey: keyof Required<Micronutrients>,
    consumed: number,
    customGoals?: Record<string, number>
  ): boolean => {
    if (!customGoals || !customGoals[nutrientKey]) return false;

    // Se o valor consumido é exatamente igual à meta personalizada, é suspeito
    const goal = customGoals[nutrientKey];
    return Math.abs(consumed - goal) < 0.01;
  };

  // ✅ CALCULAR TOTAIS
  const totals = useMemo(() => {
    const result = entries.reduce((acc, entry) => {
      if (entry.micronutrients) {
        Object.entries(entry.micronutrients).forEach(([key, value]) => {
          if (value && typeof value === "number") {
            const microKey = key as keyof Micronutrients;
            const scaledValue = (value * entry.quantity) / 100;
            acc[microKey] = (acc[microKey] || 0) + scaledValue;
          }
        });
      }
      return acc;
    }, {} as Record<keyof Micronutrients, number>);

    return result;
  }, [entries]);

  // ✅ CORRIGIDO: MOSTRAR TODOS OS MICRONUTRIENTES QUE TÊM VALORES OU METAS
  const allNutrients = useMemo(() => {
    const nutrientsWithValues = Object.keys(totals).filter(
      (key) => totals[key as keyof Micronutrients] > 0
    );
    const nutrientsWithGoals = customGoals ? Object.keys(customGoals) : [];

    const combined = new Set([...nutrientsWithValues, ...nutrientsWithGoals]);

    return Array.from(combined);
  }, [totals, customGoals]);

  const getPercentageClass = (percentage: number) => {
    if (percentage >= 100) return styles.excellent;
    if (percentage >= 75) return styles.good;
    if (percentage >= 50) return styles.warning;
    return styles.danger;
  };

  const getRowClass = (percentage: number, isManual: boolean = false) => {
    const baseClass = styles.nutrientRow;
    let statusClass = "";

    if (percentage >= 100) statusClass = styles.excellent;
    else if (percentage >= 75) statusClass = styles.good;
    else if (percentage >= 50) statusClass = styles.warning;
    else statusClass = styles.danger;

    const manualClass = isManual ? styles.manualEntry : "";

    return `${baseClass} ${statusClass} ${manualClass}`.trim();
  };

  const vitamins = allNutrients.filter(
    (key) => key.toLowerCase().includes("vitamin") || key === "folate"
  );

  const minerals = allNutrients.filter(
    (key) =>
      !key.toLowerCase().includes("vitamin") &&
      key !== "folate" &&
      key !== "fiber" &&
      key !== "cholesterol"
  );

  const others = allNutrients.filter(
    (key) => key === "fiber" || key === "cholesterol"
  );

  const renderNutrientTable = (
    nutrients: string[],
    categoryName: string,
    icon: string
  ) => {
    if (nutrients.length === 0) return null;

    return (
      <div className={styles.nutrientCategory}>
        <h4>
          {icon} {categoryName}
        </h4>
        <table className={styles.nutrientTable}>
          <thead>
            <tr>
              <th>Nutriente</th>
              <th>Consumido</th>
              <th>Meta Diária</th>
              <th>Progresso</th>
            </tr>
          </thead>
          <tbody>
            {nutrients.map((key) => {
              const microKey = key as keyof Required<Micronutrients>;
              const consumed = totals[microKey] || 0;
              const goal = getGoalForNutrient(microKey);
              const percentage = goal > 0 ? (consumed / goal) * 100 : 0;
              const unit = MICRONUTRIENT_UNITS[microKey];
              const label = MICRONUTRIENT_LABELS[microKey];

              // ✅ VERIFICAR SE É VALOR MANUAL E SE TEM META PERSONALIZADA
              const isManual = isSuspiciouslyManual(
                microKey,
                consumed,
                customGoals
              );
              const isCustomGoal = hasCustomGoal(microKey);

              if (!label) return null;

              return (
                <tr
                  key={key}
                  className={getRowClass(percentage, isManual)}
                  title={
                    isManual
                      ? "Este valor pode ter sido adicionado manualmente"
                      : "Valor obtido dos alimentos"
                  }
                >
                  <td className={styles.nutrientName}>
                    {label}

                    {isCustomGoal && (
                      <span
                        className={styles.customGoalIndicator}
                        title="Meta personalizada"
                      >
                        🎯
                      </span>
                    )}
                    {/* ✅ INDICADOR DE FONTE MANUAL */}
                    {isManual && (
                      <span
                        className={styles.manualSourceIndicator}
                        title="Valor possivelmente adicionado manualmente"
                      >
                        ✋
                      </span>
                    )}
                  </td>
                  <td className={styles.nutrientValue}>
                    {consumed.toFixed(1)} {unit}
                    {isManual && (
                      <span className={styles.exactValueIndicator}>
                        (manual)
                      </span>
                    )}
                  </td>
                  <td className={styles.nutrientRda}>
                    {goal} {unit}
                  </td>
                  <td className={styles.nutrientPercentage}>
                    <div className={styles.percentageBar}>
                      <div
                        className={`${
                          styles.percentageFill
                        } ${getPercentageClass(percentage)} ${
                          isManual ? styles.manualFill : ""
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <span className={styles.percentageText}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ✅ CONTAR MICRONUTRIENTES POR FONTE
  const micronutrientStats = useMemo(() => {
    const totalEntries = allNutrients.filter(
      (key) => totals[key as keyof Micronutrients] > 0
    );

    const fromFood = totalEntries.filter(
      (key) =>
        !isSuspiciouslyManual(
          key as keyof Required<Micronutrients>,
          totals[key as keyof Micronutrients],
          customGoals
        )
    ).length;

    const fromManual = totalEntries.filter((key) =>
      isSuspiciouslyManual(
        key as keyof Required<Micronutrients>,
        totals[key as keyof Micronutrients],
        customGoals
      )
    ).length;

    const customGoalsCount = customGoals
      ? Object.keys(customGoals).filter((key) => customGoals[key] > 0).length
      : 0;

    return {
      fromFood,
      fromManual,
      total: fromFood + fromManual,
      customGoalsCount,
    };
  }, [allNutrients, totals, customGoals]);

  return (
    <div className={styles.micronutrientReport}>
      <h3>🧬 Relatório de Micronutrientes</h3>

      {allNutrients.length === 0 ? (
        <div className={styles.noData}>
          <p>Nenhum micronutriente registrado hoje</p>
          <p>Adicione alimentos para ver o relatório detalhado</p>
          {micronutrientStats.customGoalsCount > 0 && (
            <p className={styles.customGoalsAvailable}>
              💡 Você tem <strong>{micronutrientStats.customGoalsCount}</strong>{" "}
              metas personalizadas configuradas
            </p>
          )}
        </div>
      ) : (
        <>
          <div className={styles.reportSummary}>
            <p>
              <strong>{micronutrientStats.total}</strong> micronutrientes
              registrados hoje
              {micronutrientStats.fromFood > 0 && (
                <span className={styles.foodSourceNote}>
                  {" "}
                  • <strong>{micronutrientStats.fromFood}</strong> dos alimentos
                  🍎
                </span>
              )}
              {micronutrientStats.fromManual > 0 && (
                <span className={styles.manualSourceNote}>
                  {" "}
                  • <strong>{micronutrientStats.fromManual}</strong> manuais ✋
                </span>
              )}
              {micronutrientStats.customGoalsCount > 0 && (
                <span className={styles.customGoalsNote}>
                  {" "}
                  • <strong>{micronutrientStats.customGoalsCount}</strong> metas
                  personalizadas ⚙️
                </span>
              )}
            </p>
          </div>

          {renderNutrientTable(vitamins, "Vitaminas", "🧪")}
          {renderNutrientTable(minerals, "Minerais", "⚗️")}
          {renderNutrientTable(others, "Outros", "📋")}

          <div className={styles.reportFooter}>
            <p>
              <strong>Legenda:</strong>
            </p>
            <p>
              🟢 Excelente (≥100%) | 🔵 Bom (≥75%) | 🟡 Atenção (≥50%) | 🔴
              Baixo (&lt;50%)
            </p>
            <p>🎯 Meta personalizada | ✋ Valor manual | 🍎 Dos alimentos</p>
            <p>
              * Valores padrão baseados nas recomendações nutricionais para
              adultos
            </p>
          </div>
        </>
      )}
    </div>
  );
}
