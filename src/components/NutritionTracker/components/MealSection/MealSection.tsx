// src/components/NutritionTracker/MealSection.tsx
import { useState, useEffect } from "react";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import AddFoodModal from "../AddFoodModal";
import { searchFoods } from "../../../../data/tacoFoodDatabase";
import type { FoodEntry, FoodCategory } from "../../../../types/nutrition";
import styles from "./MealSection.module.css";

// ✅ FUNÇÃO DE ÍCONES POR CATEGORIA
const getIconByCategory = (category: FoodCategory): string => {
  const iconMap: Record<FoodCategory, string> = {
    carbs: "🌾",
    protein: "🥩",
    fats: "🥑",
    vegetables: "🥦",
    fruits: "🍎",
    dairy: "🧀",
    snacks: "🍪",
    beverages: "🥤",
    cereals: "🌾",
    meat: "🥩",
    legumes: "🫘",
    oils: "🫒",
    recipes: "🍲",
    sweets: "🍰",
    other: "🍽️",
  };

  return iconMap[category] || "🍽️";
};

// ✅ FUNÇÃO PARA BUSCAR CATEGORIA DO ALIMENTO NO DATABASE
const getFoodCategory = (foodName: string): FoodCategory => {
  try {
    const searchResults = searchFoods(foodName);

    if (searchResults.length > 0) {
      const exactMatch = searchResults.find(
        (food) => food.name.toLowerCase() === foodName.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch.category;
      }

      return searchResults[0].category;
    }

    return "other";
  } catch {
    return "other";
  }
};

// ✅ FUNÇÃO HELPER PARA OBTER ÍCONE DO ALIMENTO
const getFoodIcon = (foodName: string): string => {
  const category = getFoodCategory(foodName);
  return getIconByCategory(category);
};

// ✅ COMPONENTE DE CARD COMPACTO PARA MOBILE - MOVIDO PARA FORA
interface CompactFoodCardProps {
  entry: FoodEntry;
  expandedEntries: Set<string>;
  toggleEntryExpansion: (entryId: string) => void;
  toggleFoodStatus: (entry: FoodEntry) => void;
  removeFoodEntry: (id: string) => void;
  formatTime: (timeString: string) => string;
  isInTemplate: boolean;
  handleRemoveFromTemplate?: (foodName: string) => void;
}

const CompactFoodCard = ({
  entry,
  expandedEntries,
  toggleEntryExpansion,
  toggleFoodStatus,
  removeFoodEntry,
  formatTime,
  isInTemplate,
  handleRemoveFromTemplate,
}: CompactFoodCardProps) => {
  const isExpanded = expandedEntries.has(entry.id);

  return (
    <div className={styles.compactFoodCard}>
      <div
        className={styles.cardHeader}
        onClick={() => toggleEntryExpansion(entry.id)}
      >
        <div className={styles.foodBasics}>
          <span className={styles.foodIconMobile}>
            {getFoodIcon(entry.name)}
          </span>
          <div className={styles.foodInfo}>
            <div className={styles.foodNameRow}>
              <h6 className={styles.foodName}>{entry.name}</h6>
              {isInTemplate && (
                <span className={styles.templateBadge} title="Faz parte do plano diário">
                  📅
                </span>
              )}
            </div>
            <span className={styles.foodCalories}>
              {Math.round(entry.calories)} kcal
            </span>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.statusButton} ${
              entry.status === "consumed" ? styles.consumed : styles.planned
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFoodStatus(entry);
            }}
            title={
              entry.status === "consumed"
                ? "Marcar como planejado"
                : "Marcar como consumido"
            }
          >
            {entry.status === "consumed" ? "✅" : "☐"}
          </button>
          <span className={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.cardDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Quantidade</span>
              <span className={styles.detailValue}>{entry.quantity}g</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Proteína</span>
              <span className={styles.detailValue}>
                {entry.protein.toFixed(1)}g
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Carboidratos</span>
              <span className={styles.detailValue}>
                {entry.carbs.toFixed(1)}g
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Gorduras</span>
              <span className={styles.detailValue}>
                {entry.fat.toFixed(1)}g
              </span>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <span className={styles.timeInfo}>
              {entry.status === "consumed" ? "Consumido" : "Planejado"}:{" "}
              {formatTime(entry.time || "00:00")}
              {entry.consumedAt && entry.status === "consumed" && (
                <span className={styles.consumedTimeInfo}>
                  {" "}
                  (
                  {new Date(entry.consumedAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </span>
              )}
            </span>
            <div className={styles.cardFooterActions}>
              {isInTemplate && handleRemoveFromTemplate && (
                <button
                  className={styles.removeTemplateButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromTemplate(entry.name);
                  }}
                  title="Remover do plano diário"
                >
                  🗑️ Plano
                </button>
              )}
              <button
                className={styles.removeButtonMobile}
                onClick={() => removeFoodEntry(entry.id)}
                title="Remover alimento do dia"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE DE HEADER DE SEÇÃO COLAPSÁVEL - MOVIDO PARA FORA
interface CollapsibleSectionHeaderProps {
  section: "consumed" | "planned";
  title: string;
  count: number;
  totalCalories: number;
  isExpanded: boolean;
  toggleSectionExpansion: (section: "consumed" | "planned") => void;
}

const CollapsibleSectionHeader = ({
  section,
  title,
  count,
  totalCalories,
  isExpanded,
  toggleSectionExpansion,
}: CollapsibleSectionHeaderProps) => (
  <button
    className={`${styles.sectionHeader} ${styles[section]} ${
      isExpanded ? styles.expanded : styles.collapsed
    }`}
    onClick={() => toggleSectionExpansion(section)}
    type="button"
  >
    <div className={styles.sectionHeaderContent}>
      <div className={styles.sectionTitleInfo}>
        <h5 className={styles.sectionTitle}>
          {section === "consumed" ? "✅" : "⏳"} {title} ({count})
        </h5>
        <span className={styles.sectionCalories}>
          {Math.round(totalCalories)} kcal
        </span>
      </div>

      {/* ✅ MINI PROGRESSO QUANDO FECHADO */}
      {!isExpanded && count > 0 && (
        <div className={styles.miniProgress}>
          <div className={styles.miniProgressDots}>
            {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
              <div
                key={i}
                className={`${styles.miniProgressDot} ${styles[section]}`}
              />
            ))}
            {count > 5 && (
              <span className={styles.miniMoreIndicator}>+{count - 5}</span>
            )}
          </div>
        </div>
      )}
    </div>

    <span
      className={`${styles.sectionArrow} ${
        isExpanded ? styles.expanded : styles.collapsed
      }`}
    >
      {isExpanded ? "▲" : "▼"}
    </span>
  </button>
);

interface MealSectionProps {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  icon: string;
}

function MealSection({ meal, title, icon }: MealSectionProps) {
  const {
    removeFoodEntry,
    markFoodAsConsumed,
    markFoodAsPlanned,
    getEntriesByStatus,
    activeMealPlan,
    removeFoodFromMealPlanTemplate,
  } = useNutritionContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Estados para controlar expansão das seções
  const [expandedSections, setExpandedSections] = useState<
    Set<"consumed" | "planned">
  >(new Set());

  // ✅ DETECTAR MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ TOGGLE EXPANSÃO DE ENTRADA
  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // ✅ Toggle expansão de seção
  const toggleSectionExpansion = (section: "consumed" | "planned") => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // ✅ SEPARAR ALIMENTOS POR STATUS
  const plannedEntries = getEntriesByStatus("planned").filter(
    (entry: FoodEntry) => entry.meal === meal
  );
  const consumedEntries = getEntriesByStatus("consumed").filter(
    (entry: FoodEntry) => entry.meal === meal
  );

  // ✅ CALCULAR TOTAIS SEPARADOS
  const plannedTotals = plannedEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const consumedTotals = consumedEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const totalEntries = plannedEntries.length + consumedEntries.length;
  const completionPercentage =
    totalEntries > 0
      ? Math.round((consumedEntries.length / totalEntries) * 100)
      : 0;

  const formatTime = (timeString: string) => {
    try {
      return (
        timeString ||
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // ✅ FUNÇÃO PARA ALTERNAR STATUS
  const toggleFoodStatus = (entry: FoodEntry) => {
    if (entry.status === "planned") {
      markFoodAsConsumed(entry.id);
    } else {
      markFoodAsPlanned(entry.id);
    }
  };

  // ✅ VERIFICAR SE ALIMENTO FAZ PARTE DO TEMPLATE
  const isInTemplate = (foodName: string, mealType: typeof meal): boolean => {
    if (!activeMealPlan) return false;
    return activeMealPlan.plannedFoodTemplates.some(
      (template) => template.name === foodName && template.meal === mealType
    );
  };

  // ✅ REMOVER ALIMENTO DO TEMPLATE (TODOS OS DIAS)
  const handleRemoveFromTemplate = (foodName: string) => {
    if (!activeMealPlan) return;

    if (confirm(`Remover "${foodName}" do plano permanente?\n\nEste alimento não aparecerá mais automaticamente nos próximos dias.`)) {
      removeFoodFromMealPlanTemplate(activeMealPlan.id, foodName, meal);
    }
  };

  // ✅ CALCULAR CALORIAS TOTAIS COMBINADAS PARA EXIBIÇÃO
  const combinedTotalCalories = Math.round(
    consumedTotals.calories + plannedTotals.calories
  );

  return (
    <div className={styles.mealSection}>
      {totalEntries === 0 ? (
        // === RENDERIZAÇÃO PARA O ESTADO VAZIO ===
        <>
          <h4>
            {icon} {title}
          </h4>
          <p className={styles.mealCaloriesTotal}>
            {combinedTotalCalories} kcal total
          </p>
          <button
            className={styles.addFoodButton}
            onClick={() => setShowAddModal(true)}
          >
            + Adicionar
          </button>
          <div className={styles.emptyMeal}>
            <p>Nenhum alimento adicionado</p>
          </div>
        </>
      ) : (
        // === RENDERIZAÇÃO PARA O ESTADO COM ALIMENTOS ===
        <>
          {/* ✅ HEADER RESPONSIVO */}
          {isMobile ? (
            <div className={styles.mealHeaderMobile}>
              <div className={styles.mealTitleRow}>
                <h4>
                  {icon} {title}
                </h4>
                <span className={styles.totalCalories}>
                  {combinedTotalCalories} kcal
                </span>
              </div>

              <div className={styles.quickProgress}>
                <div className={styles.progressDots}>
                  {Array.from({ length: Math.min(totalEntries, 10) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className={`${styles.progressDot} ${
                          i < consumedEntries.length
                            ? styles.completed
                            : styles.pending
                        }`}
                      />
                    )
                  )}
                  {totalEntries > 10 && (
                    <span className={styles.moreIndicator}>
                      +{totalEntries - 10}
                    </span>
                  )}
                </div>
                <span className={styles.progressText}>
                  {consumedEntries.length}/{totalEntries}
                </span>
              </div>

              <button
                className={styles.addButtonMobile}
                onClick={() => setShowAddModal(true)}
              >
                + Adicionar
              </button>
            </div>
          ) : (
            <div className={styles.mealHeader}>
              <div className={styles.mealTitle}>
                <h4>
                  {icon} {title}
                </h4>
                <div className={styles.mealStats}>
                  <span className={styles.mealCalories}>
                    {combinedTotalCalories} kcal total
                  </span>
                  <span className={styles.mealCompletion}>
                    {completionPercentage}% concluído
                  </span>
                </div>
              </div>
              <button
                className={styles.addFoodButton}
                onClick={() => setShowAddModal(true)}
              >
                + Adicionar
              </button>
            </div>
          )}

          {/* ✅ BARRA DE PROGRESSO (APENAS DESKTOP) */}
          {!isMobile && (
            <div className={styles.mealProgressContainer}>
              <div className={styles.mealProgressBar}>
                <div
                  className={styles.mealProgressFill}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className={styles.mealProgressStats}>
                <span className={styles.consumedStat}>
                  ✅ {consumedEntries.length} consumido
                  {consumedEntries.length !== 1 ? "s" : ""}
                </span>
                <span className={styles.plannedStat}>
                  ⏳ {plannedEntries.length} planejado
                  {plannedEntries.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* ✅ MEAL ENTRIES - AGORA COM SEÇÕES COLAPSÁVEIS */}
          <div className={styles.mealEntries}>
            {/* ✅ SEÇÃO DE ALIMENTOS CONSUMIDOS - COLAPSÁVEL */}
            {consumedEntries.length > 0 && (
              <div
                className={`${styles.entriesSection} ${styles.consumedSection}`}
              >
                <CollapsibleSectionHeader
                  section="consumed"
                  title="Consumidos"
                  count={consumedEntries.length}
                  totalCalories={consumedTotals.calories}
                  isExpanded={expandedSections.has("consumed")}
                  toggleSectionExpansion={toggleSectionExpansion}
                />

                {/* ✅ CONTEÚDO EXPANSÍVEL */}
                {expandedSections.has("consumed") && (
                  <div className={styles.sectionContent}>
                    {consumedEntries.map((entry: FoodEntry) =>
                      isMobile ? (
                        <CompactFoodCard
                          key={entry.id}
                          entry={entry}
                          expandedEntries={expandedEntries}
                          toggleEntryExpansion={toggleEntryExpansion}
                          toggleFoodStatus={toggleFoodStatus}
                          removeFoodEntry={removeFoodEntry}
                          formatTime={formatTime}
                          isInTemplate={isInTemplate(entry.name, meal)}
                          handleRemoveFromTemplate={handleRemoveFromTemplate}
                        />
                      ) : (
                        <div
                          key={entry.id}
                          className={`${styles.mealEntry} ${styles.consumedEntry}`}
                        >
                          <div className={styles.entryCheckbox}>
                            <button
                              className={`${styles.statusToggle} ${styles.consumed}`}
                              onClick={() => toggleFoodStatus(entry)}
                              title="Marcar como planejado"
                            >
                              ✅
                            </button>
                          </div>

                          <span className={styles.foodIcon}>
                            {getFoodIcon(entry.name)}
                          </span>

                          <div className={styles.entryInfo}>
                            <div className={styles.foodNameRow}>
                              <h6>{entry.name}</h6>
                              {isInTemplate(entry.name, meal) && (
                                <span className={styles.templateBadge} title="Faz parte do plano diário">
                                  📅
                                </span>
                              )}
                            </div>
                            <p>{entry.quantity}g</p>
                            <div className={styles.entryMacros}>
                              <span>🔥 {Math.round(entry.calories)} kcal</span>
                              <span>🥩 {entry.protein.toFixed(1)}g</span>
                              <span>🍞 {entry.carbs.toFixed(1)}g</span>
                              <span>🥑 {entry.fat.toFixed(1)}g</span>
                            </div>
                          </div>
                          <div className={styles.entryActions}>
                            <span className={styles.entryTime}>
                              {formatTime(entry.time || "00:00")}
                            </span>
                            {entry.consumedAt && (
                              <span className={styles.consumedTime}>
                                Consumido:{" "}
                                {new Date(entry.consumedAt).toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            )}
                            {isInTemplate(entry.name, meal) && (
                              <button
                                className={styles.removeTemplateButton}
                                onClick={() => handleRemoveFromTemplate(entry.name)}
                                title="Remover do plano diário"
                              >
                                🗑️ Plano
                              </button>
                            )}
                            <button
                              className={styles.removeButton}
                              onClick={() => removeFoodEntry(entry.id)}
                              title="Remover alimento do dia"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    {/* ✅ RESUMO DA SEÇÃO (APENAS DESKTOP E QUANDO EXPANDIDO) */}
                    {!isMobile && (
                      <div
                        className={`${styles.sectionSummary} ${styles.consumedSummary}`}
                      >
                        <span>
                          Consumido: {Math.round(consumedTotals.calories)} kcal
                        </span>
                        <span>P: {consumedTotals.protein.toFixed(1)}g</span>
                        <span>C: {consumedTotals.carbs.toFixed(1)}g</span>
                        <span>G: {consumedTotals.fat.toFixed(1)}g</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ SEÇÃO DE ALIMENTOS PLANEJADOS - COLAPSÁVEL */}
            {plannedEntries.length > 0 && (
              <div
                className={`${styles.entriesSection} ${styles.plannedSection}`}
              >
                <CollapsibleSectionHeader
                  section="planned"
                  title="Planejados"
                  count={plannedEntries.length}
                  totalCalories={plannedTotals.calories}
                  isExpanded={expandedSections.has("planned")}
                  toggleSectionExpansion={toggleSectionExpansion}
                />

                {/* ✅ CONTEÚDO EXPANSÍVEL */}
                {expandedSections.has("planned") && (
                  <div className={styles.sectionContent}>
                    {plannedEntries.map((entry: FoodEntry) =>
                      isMobile ? (
                        <CompactFoodCard
                          key={entry.id}
                          entry={entry}
                          expandedEntries={expandedEntries}
                          toggleEntryExpansion={toggleEntryExpansion}
                          toggleFoodStatus={toggleFoodStatus}
                          removeFoodEntry={removeFoodEntry}
                          formatTime={formatTime}
                          isInTemplate={isInTemplate(entry.name, meal)}
                          handleRemoveFromTemplate={handleRemoveFromTemplate}
                        />
                      ) : (
                        <div
                          key={entry.id}
                          className={`${styles.mealEntry} ${styles.plannedEntry}`}
                        >
                          <div className={styles.entryCheckbox}>
                            <button
                              className={`${styles.statusToggle} ${styles.planned}`}
                              onClick={() => toggleFoodStatus(entry)}
                              title="Marcar como consumido"
                            >
                              ☐
                            </button>
                          </div>

                          <span className={styles.foodIcon}>
                            {getFoodIcon(entry.name)}
                          </span>

                          <div className={styles.entryInfo}>
                            <div className={styles.foodNameRow}>
                              <h6>{entry.name}</h6>
                              {isInTemplate(entry.name, meal) && (
                                <span className={styles.templateBadge} title="Faz parte do plano diário">
                                  📅
                                </span>
                              )}
                            </div>
                            <p>{entry.quantity}g</p>
                            <div className={styles.entryMacros}>
                              <span>🔥 {Math.round(entry.calories)} kcal</span>
                              <span>🥩 {entry.protein.toFixed(1)}g</span>
                              <span>🍞 {entry.carbs.toFixed(1)}g</span>
                              <span>🥑 {entry.fat.toFixed(1)}g</span>
                            </div>
                          </div>
                          <div className={styles.entryActions}>
                            <span className={styles.entryTime}>
                              Planejado: {formatTime(entry.time || "00:00")}
                            </span>
                            {isInTemplate(entry.name, meal) && (
                              <button
                                className={styles.removeTemplateButton}
                                onClick={() => handleRemoveFromTemplate(entry.name)}
                                title="Remover do plano diário"
                              >
                                🗑️ Plano
                              </button>
                            )}
                            <button
                              className={styles.removeButton}
                              onClick={() => removeFoodEntry(entry.id)}
                              title="Remover alimento do dia"
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    {/* ✅ RESUMO DA SEÇÃO (APENAS DESKTOP E QUANDO EXPANDIDO) */}
                    {!isMobile && (
                      <div
                        className={`${styles.sectionSummary} ${styles.plannedSummary}`}
                      >
                        <span>
                          Planejado: {Math.round(plannedTotals.calories)} kcal
                        </span>
                        <span>P: {plannedTotals.protein.toFixed(1)}g</span>
                        <span>C: {plannedTotals.carbs.toFixed(1)}g</span>
                        <span>G: {plannedTotals.fat.toFixed(1)}g</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ RESUMO TOTAL DA REFEIÇÃO (APENAS DESKTOP) */}
            {!isMobile && (
              <div className={styles.mealTotalSummary}>
                <div className={styles.summaryTotals}>
                  <span className={styles.totalLabel}>Total da Refeição:</span>
                  <span>🔥 {combinedTotalCalories} kcal</span>
                  <span>
                    🥩{" "}
                    {(consumedTotals.protein + plannedTotals.protein).toFixed(
                      1
                    )}
                    g
                  </span>
                  <span>
                    🍞 {(consumedTotals.carbs + plannedTotals.carbs).toFixed(1)}
                    g
                  </span>
                  <span>
                    🥑 {(consumedTotals.fat + plannedTotals.fat).toFixed(1)}g
                  </span>
                </div>
              </div>
            )}

            {/* ✅ RESUMO MOBILE SIMPLIFICADO */}
            {isMobile && (
              <div className={styles.mobileSummary}>
                <div className={styles.mobileSummaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🔥</span>
                    <span className={styles.summaryValue}>
                      {combinedTotalCalories}
                    </span>
                    <span className={styles.summaryLabel}>kcal</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🥩</span>
                    <span className={styles.summaryValue}>
                      {(consumedTotals.protein + plannedTotals.protein).toFixed(
                        1
                      )}
                    </span>
                    <span className={styles.summaryLabel}>g</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🍞</span>
                    <span className={styles.summaryValue}>
                      {(consumedTotals.carbs + plannedTotals.carbs).toFixed(1)}
                    </span>
                    <span className={styles.summaryLabel}>g</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🥑</span>
                    <span className={styles.summaryValue}>
                      {(consumedTotals.fat + plannedTotals.fat).toFixed(1)}
                    </span>
                    <span className={styles.summaryLabel}>g</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <AddFoodModal
          meal={meal}
          onClose={() => setShowAddModal(false)}
          isOpen={showAddModal}
        />
      )}
    </div>
  );
}

export default MealSection;
