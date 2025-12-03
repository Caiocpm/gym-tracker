const fs = require('fs');

const cleanAddFoodModal = `import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useNutrition } from '../../hooks/useNutrition';
import { foodDatabase } from '../../data/foodDatabase';
import { tacoFoodDatabase } from '../../data/tacoFoodDatabase';
import type {
  PredefinedFood,
  MealType,
  FoodCategory,
} from '../../types/nutrition';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealType;
}

const CATEGORY_NAMES: Record<FoodCategory, string> = {
  carbs: 'Carboidratos',
  protein: 'Prote√≠nas',
  fruits: 'Frutas',
  vegetables: 'Vegetais',
  fats: 'Gorduras',
  dairy: 'Latic√≠nios',
  beverages: 'Bebidas',
  snacks: 'Lanches',
  cereals: 'Cereais',
  meat: 'Carnes',
  legumes: 'Leguminosas',
  oils: '√ìleos',
  sweets: 'Doces',
  other: 'Outros'
};

const MEAL_NAMES: Record<MealType, string> = {
  breakfast: 'Caf√© da Manh√£',
  lunch: 'Almo√ßo',
  dinner: 'Jantar',
  snack: 'Lanche',
};

export default function AddFoodModal({ isOpen, onClose, meal }: AddFoodModalProps) {
  const { addFoodEntry } = useNutrition();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedFood, setSelectedFood] = useState<PredefinedFood | null>(null);
  const [quantity, setQuantity] = useState(100);

  // Combinar ambos os bancos de dados
  const allFoods = [...foodDatabase, ...tacoFoodDatabase];

  // Filtrar alimentos
  const filteredFoods = allFoods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Resetar estado quando modal abre
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedCategory('all');
      setSelectedFood(null);
      setQuantity(100);
    }
  }, [isOpen]);

  const handleAddFood = () => {
    if (!selectedFood) return;

    console.log('Ì∑™ Debug AddFoodModal:');
    console.log('ÌΩΩÔ∏è Alimento selecionado:', selectedFood.name);
    console.log('Ì∑¨ Micronutrientes do alimento:', selectedFood.micronutrients);
    console.log('‚öñÔ∏è Quantidade:', quantity);

    const multiplier = quantity / 100;
    const entry = {
      name: selectedFood.name,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      quantity,
      meal,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      micronutrients: selectedFood.micronutrients ? Object.fromEntries(
        Object.entries(selectedFood.micronutrients).map(([key, value]) => [
          key,
          value ? Math.round(value * multiplier * 100) / 100 : 0
        ])
      ) : undefined,
    };

    addFoodEntry(entry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Adicionar Alimento - {MEAL_NAMES[meal]}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!selectedFood ? (
            <>
              {/* Busca */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar alimento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtros por categoria */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={\`px-3 py-1 rounded-full text-sm \${
                    selectedCategory === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }\`}
                >
                  Todos
                </button>
                {Object.entries(CATEGORY_NAMES).map(([category, name]) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category as FoodCategory)}
                    className={\`px-3 py-1 rounded-full text-sm \${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }\`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Lista de alimentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      {food.icon && <span className="text-2xl">{food.icon}</span>}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{food.name}</h3>
                        <p className="text-sm text-gray-500">
                          {CATEGORY_NAMES[food.category]}
                        </p>
                        <p className="text-sm text-gray-600">
                          {food.calories} kcal/100g
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Detalhes do alimento selecionado */
            <div>
              <button
                onClick={() => setSelectedFood(null)}
                className="mb-4 text-blue-500 hover:text-blue-700"
              >
                ‚Üê Voltar √† lista
              </button>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  {selectedFood.icon && (
                    <span className="text-3xl">{selectedFood.icon}</span>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{selectedFood.name}</h3>
                    <p className="text-gray-600">
                      {CATEGORY_NAMES[selectedFood.category]}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(selectedFood.calories * (quantity / 100))}
                    </p>
                    <p className="text-sm text-gray-600">Calorias</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(selectedFood.protein * (quantity / 100) * 10) / 10}g
                    </p>
                    <p className="text-sm text-gray-600">Prote√≠na</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {Math.round(selectedFood.carbs * (quantity / 100) * 10) / 10}g
                    </p>
                    <p className="text-sm text-gray-600">Carboidratos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(selectedFood.fat * (quantity / 100) * 10) / 10}g
                    </p>
                    <p className="text-sm text-gray-600">Gordura</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantidade (gramas)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddFood}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/components/NutritionTracker/AddFoodModal.tsx', cleanAddFoodModal, 'utf8');

console.log('‚úÖ AddFoodModal limpo criado');
