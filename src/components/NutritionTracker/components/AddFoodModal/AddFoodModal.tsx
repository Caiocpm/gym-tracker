// src/components/NutritionTracker/AddFoodModal.tsx
import { useState, useMemo } from "react";
import {
  searchFoods,
  getFoodsByCategory,
  CATEGORY_NAMES,
  addCustomFoodToDatabase,
} from "../../../../data/tacoFoodDatabase";
import type {
  PredefinedFood,
  MealType,
  FoodCategory,
} from "../../../../types/nutrition";
import { useNutritionContext } from "../../../../hooks/useNutritionContext";
import styles from "./AddFoodModal.module.css"; // AGORA IMPORTAMOS COMO CSS MODULE!

const getIconByCategory = (category: FoodCategory): string => {
  const iconMap: Record<FoodCategory, string> = {
    carbs: "🍞",
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

interface AddFoodModalProps {
  isOpen: boolean;
  meal: MealType;
  onClose: () => void;
}

export default function AddFoodModal({
  isOpen,
  meal,
  onClose,
}: AddFoodModalProps) {
  const { addFoodEntry, state, addFoodToMealPlanTemplate, activeMealPlan } = useNutritionContext();

  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    FoodCategory | "all"
  >("all");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // ✅ NOVO: Estado para checkbox "Adicionar a todos os dias"
  const [addToAllDays, setAddToAllDays] = useState(false);

  // Estados para alimento customizado
  const [customFood, setCustomFood] = useState({
    name: "",
    category: "" as FoodCategory,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    icon: "🍽️",
  });

  // Estados para quantidade
  const [selectedFood, setSelectedFood] = useState<PredefinedFood | null>(null);
  const [quantity, setQuantity] = useState(100);

  // Memoizar resultados da busca
  const searchResults = useMemo(() => {
    let results: PredefinedFood[] = [];

    if (searchTerm.trim()) {
      results = searchFoods(searchTerm);
    } else if (selectedCategory !== "all") {
      results = getFoodsByCategory(selectedCategory);
    } else {
      results = searchFoods("");
    }

    if (selectedCategory !== "all") {
      results = results.filter((food) => food.category === selectedCategory);
    }

    return results;
  }, [searchTerm, selectedCategory]);

  // Função para obter nome da refeição
  const getMealName = (meal: MealType): string => {
    const mealNames: Record<MealType, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack: "Lanches",
    };
    return mealNames[meal];
  };

  // Função para adicionar alimento
  const handleAddFood = (food: PredefinedFood) => {
    setSelectedFood(food);
  };

  // Função corrigida - sem duplicatas
  const handleConfirmAdd = () => {
    if (!selectedFood) return;

    const multiplier = quantity / 100;

    const foodData = {
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      quantity,
      meal,
      micronutrients: selectedFood?.micronutrients,
    };

    // ✅ Adicionar ao dia atual
    addFoodEntry({
      ...foodData,
      date: state.selectedDate,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // ✅ Se checkbox marcado, adicionar ao plano de refeições
    if (addToAllDays && activeMealPlan) {
      addFoodToMealPlanTemplate(activeMealPlan.id, foodData);
    }

    onClose();
  };

  // Função corrigida - sem duplicatas
  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customFood.name || !customFood.category) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Adicionar ao banco de dados
    const newFood = addCustomFoodToDatabase({
      id: `custom_${Date.now()}`,
      name: customFood.name,
      category: customFood.category,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
      icon: customFood.icon,
    });

    const foodData = {
      name: newFood.name,
      calories: newFood.calories,
      protein: newFood.protein,
      carbs: newFood.carbs,
      fat: newFood.fat,
      quantity: 100,
      meal,
      micronutrients: undefined,
    };

    // ✅ Adicionar à refeição do dia atual
    addFoodEntry({
      ...foodData,
      date: state.selectedDate,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // ✅ Se checkbox marcado, adicionar ao plano de refeições
    if (addToAllDays && activeMealPlan) {
      addFoodToMealPlanTemplate(activeMealPlan.id, foodData);
    }

    onClose();
  };

  // Função para resetar formulário customizado
  const resetCustomForm = () => {
    setCustomFood({
      name: "",
      category: "" as FoodCategory,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      icon: "🍽️",
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.addFoodModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Adicionar Alimento - {getMealName(meal)}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Seleção de modo */}
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${
              !showCustomForm ? styles.active : ""
            }`}
            onClick={() => {
              setShowCustomForm(false);
              setSelectedFood(null);
            }}
          >
            🔎 Buscar Alimentos
          </button>
          <button
            className={`${styles.modeBtn} ${
              showCustomForm ? styles.active : ""
            }`}
            onClick={() => {
              setShowCustomForm(true);
              setSelectedFood(null);
              resetCustomForm();
            }}
          >
            ➕ Adicionar Novo
          </button>
        </div>

        {!showCustomForm ? (
          <>
            {/* Busca e filtros */}
            <div className={styles.searchSection}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Buscar alimentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterContainer}>
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as FoodCategory | "all")
                  }
                  className={styles.categorySelect}
                >
                  <option value="all">Todas as categorias</option>
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resultados da busca */}
            <div className={styles.searchResults}>
              {searchResults.length > 0 ? (
                searchResults.map((food) => (
                  <div key={food.id} className={styles.foodResult}>
                    <div className={styles.foodInfo}>
                      <div className={styles.foodHeader}>
                        <h4>{food.name}</h4>
                      </div>
                      <span className={styles.foodIcon}>
                        {getIconByCategory(food.category)}
                      </span>
                    </div>
                    <div className={styles.foodNutrition}>
                      <span>🔥 {Math.round(food.calories)} kcal</span>
                      <span>🥩 {Math.round(food.protein * 10) / 10}g</span>
                      <span>🍞 {Math.round(food.carbs * 10) / 10}g</span>
                      <span>🥑 {Math.round(food.fat * 10) / 10}g</span>
                    </div>
                    <button
                      className={styles.addFoodBtn}
                      onClick={() => handleAddFood(food)}
                    >
                      Adicionar
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>
                  <p>Nenhum alimento encontrado.</p>
                  <p>
                    Tente buscar por outro termo ou adicione um novo alimento.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Formulário de alimento customizado */
          <form
            onSubmit={handleAddCustomFood}
            className={styles.customFoodForm}
          >
            <div className={styles.formGroup}>
              <label htmlFor="food-name">Nome do Alimento *</label>
              <input
                id="food-name"
                type="text"
                value={customFood.name}
                onChange={(e) =>
                  setCustomFood((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Pão de açúcar caseiro"
                required
                className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="food-category">Categoria *</label>
                <select
                  id="food-category"
                  value={customFood.category}
                  onChange={(e) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      category: e.target.value as FoodCategory,
                    }))
                  }
                  required
                  className={styles.formGroupSelect} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                >
                  <option value="">Selecione uma categoria</option>
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="food-icon">Ícone</label>
                <input
                  id="food-icon"
                  type="text"
                  value={customFood.icon}
                  onChange={(e) =>
                    setCustomFood((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  placeholder="🍽️"
                  maxLength={2}
                  className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                />
              </div>
            </div>

            <div className={styles.nutritionSection}>
              <h3>Valores Nutricionais (por 100g)</h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="food-calories">Calorias (kcal)</label>
                  <input
                    id="food-calories"
                    type="number"
                    min="0"
                    step="1"
                    value={customFood.calories}
                    onChange={(e) =>
                      setCustomFood((prev) => ({
                        ...prev,
                        calories: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="food-protein">Proteína (g)</label>
                  <input
                    id="food-protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.protein}
                    onChange={(e) =>
                      setCustomFood((prev) => ({
                        ...prev,
                        protein: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="food-carbs">Carboidratos (g)</label>
                  <input
                    id="food-carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.carbs}
                    onChange={(e) =>
                      setCustomFood((prev) => ({
                        ...prev,
                        carbs: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="food-fat">Gorduras (g)</label>
                  <input
                    id="food-fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={customFood.fat}
                    onChange={(e) =>
                      setCustomFood((prev) => ({
                        ...prev,
                        fat: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={styles.formGroupInput} // Usando uma classe mais genérica para inputs/selects dentro de form-group
                  />
                </div>
              </div>
            </div>

            {/* ✅ CHECKBOX para adicionar a todos os dias */}
            <div className={styles.persistentFoodCheckbox}>
              <label>
                <input
                  type="checkbox"
                  checked={addToAllDays}
                  onChange={(e) => setAddToAllDays(e.target.checked)}
                />
                <span>
                  📅 Adicionar a todos os dias (planejado permanente)
                </span>
              </label>
              <p className={styles.checkboxHint}>
                Este alimento aparecerá automaticamente em todos os próximos dias como "Planejado"
              </p>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.submitBtn}>
                Adicionar Alimento
              </button>
            </div>
          </form>
        )}

        {/* Modal de quantidade */}
        {selectedFood && (
          <div className={styles.quantityModal}>
            <div className={styles.quantityContent}>
              <h3>Definir Quantidade</h3>
              <div className={styles.selectedFoodInfo}>
                <span className={styles.foodIcon}>
                  {selectedFood.icon ||
                    getIconByCategory(selectedFood.category)}
                </span>
                <div>
                  <h4>{selectedFood.name}</h4>
                  <p>Valores para {quantity}g:</p>
                </div>
              </div>

              <div className={styles.quantityInputGroup}>
                <label htmlFor="quantity">Quantidade (gramas)</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className={styles.formGroupInput} // Usando a classe mais genérica
                />
              </div>

              <div className={styles.calculatedNutrition}>
                <div className={styles.nutritionItem}>
                  <span>🔥 Calorias:</span>
                  <span>
                    {Math.round(selectedFood.calories * (quantity / 100))} kcal
                  </span>
                </div>
                <div className={styles.nutritionItem}>
                  <span>🥩 Proteína:</span>
                  <span>
                    {Math.round(selectedFood.protein * (quantity / 100) * 10) /
                      10}
                    g
                  </span>
                </div>
                <div className={styles.nutritionItem}>
                  <span>🍞 Carboidratos:</span>
                  <span>
                    {Math.round(selectedFood.carbs * (quantity / 100) * 10) /
                      10}
                    g
                  </span>
                </div>
                <div className={styles.nutritionItem}>
                  <span>🥑 Gorduras:</span>
                  <span>
                    {Math.round(selectedFood.fat * (quantity / 100) * 10) / 10}g
                  </span>
                </div>
              </div>

              {/* ✅ CHECKBOX para adicionar a todos os dias */}
              <div className={styles.persistentFoodCheckbox}>
                <label>
                  <input
                    type="checkbox"
                    checked={addToAllDays}
                    onChange={(e) => setAddToAllDays(e.target.checked)}
                  />
                  <span>
                    📅 Adicionar a todos os dias (planejado permanente)
                  </span>
                </label>
                <p className={styles.checkboxHint}>
                  Este alimento aparecerá automaticamente em todos os próximos dias como "Planejado"
                </p>
              </div>

              <div className={styles.quantityActions}>
                <button
                  onClick={() => setSelectedFood(null)}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAdd}
                  className={styles.confirmBtn}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer informativo */}
        <div className={styles.tacoFooter}>
          <p>
            🇧🇷 Dados baseados na <strong>Tabela TACO</strong> - Tabela
            Brasileira de Composição de Alimentos
          </p>
        </div>
      </div>
    </div>
  );
}
