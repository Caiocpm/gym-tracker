// src/components/NutritionTracker/Reports/CollapsibleMicronutrientReport/CollapsibleMicronutrientReport.tsx
import React, { useState, useMemo } from "react";
import MicronutrientReport from "../MicronutrientReport";
import type { Micronutrients, FoodEntry } from "../../../../types/nutrition";
import styles from "./CollapsibleMicronutrientReport.module.css";

// ✅ MAPEAMENTO DE CHAVES PORTUGUESAS PARA INGLESAS
const MICRONUTRIENT_KEY_MAPPING: Record<string, keyof Micronutrients> = {
  // Vitaminas
  "Vitamina A": "vitaminA",
  "Vitamina B1 (Tiamina)": "vitaminB1",
  "Vitamina B2 (Riboflavina)": "vitaminB2",
  "Vitamina B3 (Niacina)": "vitaminB3",
  "Vitamina B6 (Piridoxina)": "vitaminB6",
  "Vitamina B12 (Cobalamina)": "vitaminB12",
  "Vitamina C (Ácido Ascórbico)": "vitaminC",
  "Vitamina E (Tocoferol)": "vitaminE",
  Folato: "folate",

  // Minerais
  Cálcio: "calcium",
  Ferro: "iron",
  Magnésio: "magnesium",
  Fósforo: "phosphorus",
  Potássio: "potassium",
  Sódio: "sodium",
  Zinco: "zinc",
  Cobre: "copper",
  Manganês: "manganese",
  Selênio: "selenium",

  // Outros
  Fibra: "fiber",
  Colesterol: "cholesterol",
};

// ✅ FUNÇÃO PARA CONVERTER CHAVES PORTUGUESAS PARA INGLESAS
const convertCustomGoalsKeys = (
  customGoals: Record<string, number>
): Record<string, number> => {
  const converted: Record<string, number> = {};

  Object.entries(customGoals).forEach(([portugueseKey, value]) => {
    const englishKey = MICRONUTRIENT_KEY_MAPPING[portugueseKey];
    if (englishKey) {
      converted[englishKey] = value;
    }
  });

  return converted;
};

interface CollapsibleMicronutrientReportProps {
  todayMicronutrients: Micronutrients;
  customGoals: Micronutrients;
}

export const CollapsibleMicronutrientReport: React.FC<
  CollapsibleMicronutrientReportProps
> = ({ todayMicronutrients, customGoals }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prevState) => !prevState);
  };

  const collapse = () => {
    setIsExpanded(false);
  };

  // ✅ FUNÇÃO PARA DETERMINAR COR DO STATUS
  const getStatusDotColor = (percentage: number, status: string) => {
    if (status.includes("Nenhum") || status.includes("Configurar"))
      return "#9ca3af"; // cinza
    if (percentage >= 90) return "#10b981"; // verde sutil
    if (percentage >= 70) return "#3b82f6"; // azul sutil
    if (percentage >= 50) return "#f59e0b"; // amarelo sutil
    return "#ef4444"; // vermelho sutil
  };

  // ✅ CALCULAR TOTAIS DOS MICRONUTRIENTES
  const totals = useMemo(() => {
    return Object.keys(todayMicronutrients).reduce((acc, key) => {
      const value = todayMicronutrients[key as keyof Micronutrients];
      if (typeof value === "number" && value > 0) {
        acc[key as keyof Micronutrients] = value;
      }
      return acc;
    }, {} as Record<keyof Micronutrients, number>);
  }, [todayMicronutrients]);

  const mockEntries: FoodEntry[] = useMemo(() => {
    const currentTime = new Date().toISOString();
    const currentDate = currentTime.split("T")[0];

    return [
      {
        id: "daily-total",
        name: "Total do Dia",
        quantity: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meal: "breakfast" as const,
        status: "consumed" as const,
        date: currentDate,
        time: currentTime,
        plannedAt: currentTime,
        micronutrients: todayMicronutrients,
      },
    ];
  }, [todayMicronutrients]);

  // ✅ CÁLCULO PRINCIPAL COM CONVERSÃO DE CHAVES
  const {
    overallAdequacy,
    highlights,
    hasDefinedGoals,
    hasRealMicronutrients,
    filteredCustomGoals,
  } = useMemo(() => {
    // ✅ CONVERTER CHAVES PORTUGUESAS PARA INGLESAS
    const convertedCustomGoals = convertCustomGoalsKeys(
      customGoals as Record<string, number>
    );

    // ✅ FILTRAR METAS PERSONALIZADAS VÁLIDAS (AGORA COM CHAVES EM INGLÊS)
    const filteredCustomGoals: Record<string, number> = Object.keys(
      convertedCustomGoals
    ).reduce((acc, key) => {
      const value = convertedCustomGoals[key];

      if (typeof value === "number" && value > 0) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, number>);

    const definedGoalsKeys = Object.keys(filteredCustomGoals);
    const hasDefinedGoals = definedGoalsKeys.length > 0;

    // ✅ VERIFICAR SE HÁ MICRONUTRIENTES VINDOS DE ALIMENTOS (não zerados)
    const realMicronutrients = Object.entries(todayMicronutrients).filter(
      ([, value]) => value && typeof value === "number" && value > 0
    );
    const hasRealMicronutrients = realMicronutrients.length > 0;

    // ✅ SE NÃO HÁ MICRONUTRIENTES REAIS, MOSTRAR MENSAGEM APROPRIADA
    if (!hasRealMicronutrients) {
      return {
        overallAdequacy: {
          percentage: 0,
          status: hasDefinedGoals
            ? "Nenhum micronutriente dos alimentos"
            : "Configurar Metas",
        },
        highlights: [],
        hasDefinedGoals,
        hasRealMicronutrients: false,
        filteredCustomGoals,
      };
    }

    // ✅ SE NÃO HÁ METAS DEFINIDAS MAS HÁ MICRONUTRIENTES
    if (!hasDefinedGoals) {
      return {
        overallAdequacy: {
          percentage: 0,
          status: "Micronutrientes Detectados",
        },
        highlights: [],
        hasDefinedGoals: false,
        hasRealMicronutrients: true,
        filteredCustomGoals,
      };
    }

    // ✅ CALCULAR ADEQUAÇÃO APENAS PARA MICRONUTRIENTES QUE EXISTEM
    let totalPercentage = 0;
    let validNutrientsCount = 0;
    const individualAdequacies: {
      name: string;
      percentage: number;
      consumed: number;
      goal: number;
    }[] = [];

    definedGoalsKeys.forEach((nutrientKey) => {
      const goal = filteredCustomGoals[nutrientKey];
      const consumed =
        (todayMicronutrients[nutrientKey as keyof Micronutrients] as number) ||
        0;

      // ✅ APENAS CONTAR SE O MICRONUTRIENTE FOI REALMENTE CONSUMIDO
      if (consumed > 0) {
        const percentage = (consumed / goal) * 100;
        individualAdequacies.push({
          name: nutrientKey,
          percentage,
          consumed,
          goal,
        });
        totalPercentage += percentage;
        validNutrientsCount++;
      }
    });

    // ✅ SE NÃO HÁ MICRONUTRIENTES VÁLIDOS COM METAS
    if (validNutrientsCount === 0) {
      return {
        overallAdequacy: {
          percentage: 0,
          status: "Nenhum micronutriente com meta consumido",
        },
        highlights: [],
        hasDefinedGoals: true,
        hasRealMicronutrients: true,
        filteredCustomGoals,
      };
    }

    const averagePercentage = totalPercentage / validNutrientsCount;

    let status: string;
    if (averagePercentage >= 90) {
      status = "Excelente ✅";
    } else if (averagePercentage >= 70) {
      status = "Bom 👍";
    } else if (averagePercentage >= 50) {
      status = "Moderado ⚠️";
    } else {
      status = "Atenção ❌";
    }

    const sortedAdequacies = [...individualAdequacies].sort(
      (a, b) => a.percentage - b.percentage
    );
    const topHighlights: {
      name: string;
      percentage: number;
      type: "low" | "high" | "good";
    }[] = [];

    sortedAdequacies.slice(0, 2).forEach((item) => {
      if (item.percentage < 90) {
        topHighlights.push({
          name: item.name,
          percentage: item.percentage,
          type: "low",
        });
      }
    });

    const highestExcess = sortedAdequacies.find(
      (item) => item.percentage > 150
    );
    if (
      highestExcess &&
      !topHighlights.some((h) => h.name === highestExcess.name)
    ) {
      topHighlights.push({
        name: highestExcess.name,
        percentage: highestExcess.percentage,
        type: "high",
      });
    }

    const result = {
      overallAdequacy: { percentage: Math.round(averagePercentage), status },
      highlights: topHighlights.slice(0, 3),
      hasDefinedGoals: true,
      hasRealMicronutrients: true,
      filteredCustomGoals,
    };

    return result;
  }, [todayMicronutrients, customGoals]);

  const formatMicronutrientName = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Vitamin /g, "Vitamina ");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <div className={styles.collapsibleMicronutrientContainer}>
      <button
        className={`${styles.collapsibleHeader} ${
          isExpanded ? styles.expanded : styles.collapsed
        }`}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls="micronutrient-content"
        type="button"
      >
        <div className={styles.headerContent}>
          <h3>🧬 Análise de Micronutrientes</h3>
          {!isExpanded && (
            <div className={styles.statusContainer}>
              {/* ✅ NOVO: Ponto colorido discreto */}
              <span
                className={styles.statusDot}
                style={{
                  backgroundColor: getStatusDotColor(
                    overallAdequacy.percentage,
                    overallAdequacy.status
                  ),
                }}
                title={
                  hasRealMicronutrients &&
                  hasDefinedGoals &&
                  overallAdequacy.percentage > 0
                    ? `${overallAdequacy.percentage}% - ${overallAdequacy.status}`
                    : hasRealMicronutrients && !hasDefinedGoals
                    ? `${Object.keys(totals).length} micronutrientes detectados`
                    : overallAdequacy.status.includes("Configurar")
                    ? "Configurar metas personalizadas"
                    : overallAdequacy.status
                }
              />
              {/* ✅ TEXTO OPCIONAL DISCRETO (remova se quiser apenas o ponto) */}
              <span className={styles.statusText}>
                {hasRealMicronutrients &&
                hasDefinedGoals &&
                overallAdequacy.percentage > 0
                  ? `${overallAdequacy.percentage}%`
                  : hasRealMicronutrients && !hasDefinedGoals
                  ? `${Object.keys(totals).length}`
                  : overallAdequacy.status.includes("Configurar")
                  ? "Configurar"
                  : "—"}
              </span>
            </div>
          )}
        </div>
        <span
          className={`${styles.arrow} ${
            isExpanded ? styles.expanded : styles.collapsed
          }`}
          aria-hidden="true"
        >
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      <div
        id="micronutrient-content"
        className={`${styles.collapsibleContent} ${
          isExpanded ? styles.expanded : styles.collapsed
        }`}
        aria-hidden={!isExpanded}
      >
        {/* ✅ NOVA LÓGICA: MOSTRAR RELATÓRIO SE HÁ MICRONUTRIENTES, MESMO SEM METAS */}
        {!hasRealMicronutrients ? (
          <div className={styles.micronutrientNoData}>
            <p>
              📊 Nenhum micronutriente foi registrado através dos alimentos
              hoje.
            </p>
            <p>
              Adicione alimentos ricos em vitaminas e minerais para ver a
              análise detalhada.
            </p>
            {!hasDefinedGoals && (
              <p className={styles.configNote}>
                💡 Configure metas personalizadas nas Configurações para análise
                mais precisa.
              </p>
            )}
          </div>
        ) : !hasDefinedGoals ? (
          // ✅ NOVO: MOSTRAR RELATÓRIO MESMO SEM METAS DEFINIDAS
          <>
            <div className={styles.micronutrientNoGoals}>
              <p>
                🎉 <strong>{Object.keys(totals).length}</strong> micronutrientes
                detectados dos alimentos!
              </p>
              <p>
                Para análise de adequação personalizada, configure suas metas na
                seção de Configurações.
              </p>
              <p className={styles.configNote}>
                📊 Valores mostrados com base nas recomendações nutricionais
                padrão.
              </p>
            </div>

            {/* ✅ MOSTRAR RELATÓRIO DETALHADO MESMO SEM METAS PERSONALIZADAS */}
            {isExpanded && (
              <div className={styles.detailedReport}>
                <MicronutrientReport
                  entries={mockEntries}
                  customGoals={filteredCustomGoals} // Vai estar vazio, mas o componente vai usar valores padrão
                />
                <div className={styles.collapseHint}>
                  <button
                    className={styles.collapseButton}
                    onClick={collapse}
                    type="button"
                  >
                    ▲ Recolher Análise Detalhada
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // ✅ CASO NORMAL: TEM METAS E MICRONUTRIENTES
          <>
            {!isExpanded && (
              <div className={styles.micronutrientSummary}>
                <div className={styles.summaryItem}>
                  <strong>Adequação Geral:</strong> {overallAdequacy.percentage}
                  % {overallAdequacy.status}
                </div>
                {highlights.length > 0 && (
                  <div className={styles.summaryHighlights}>
                    <strong>Destaques:</strong>
                    <ul>
                      {highlights.map((h, index) => (
                        <li
                          key={index}
                          className={
                            styles[
                              `highlight${
                                h.type.charAt(0).toUpperCase() + h.type.slice(1)
                              }`
                            ]
                          }
                        >
                          {h.type === "low"
                            ? "⬇️ Baixo"
                            : h.type === "high"
                            ? "⬆️ Excesso"
                            : ""}{" "}
                          {formatMicronutrientName(h.name)}:{" "}
                          {Math.round(h.percentage)}% da meta
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {highlights.length === 0 && overallAdequacy.percentage > 0 && (
                  <p className={styles.summaryAllGood}>
                    🎉 Todas as metas de micronutrientes estão bem equilibradas!
                  </p>
                )}
                <div className={styles.expandHint}>
                  <small>Clique para ver detalhes completos</small>
                </div>
              </div>
            )}

            {/* ✅ RELATÓRIO DETALHADO COM METAS PERSONALIZADAS */}
            {isExpanded && (
              <div className={styles.detailedReport}>
                <MicronutrientReport
                  entries={mockEntries}
                  customGoals={filteredCustomGoals}
                />
                <div className={styles.collapseHint}>
                  <button
                    className={styles.collapseButton}
                    onClick={collapse}
                    type="button"
                  >
                    ▲ Recolher Análise Detalhada
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
