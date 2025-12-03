// src/components/NutritionTracker/GoalsSettings.tsx
import { useState } from "react";
import type { UserGoals } from "../../../../types/goals";
import { useGoals } from "../../../../hooks/useGoals";
import MicronutrientSelector from "../MicronutrientSelector";
import { AVAILABLE_MICRONUTRIENTS } from "../../../../types/goals";
import { getMicronutrientUnit } from "../../../../utils/nutritionHelpers"; // ✅ Importa a função de utilidade
import styles from "./GoalsSettings.module.css"; // ✅ IMPORTA CSS MODULES

interface GoalsSettingsProps {
  onClose: () => void;
}

export const GoalsSettings: React.FC<GoalsSettingsProps> = ({ onClose }) => {
  const { currentGoals, updateGoals } = useGoals();
  const [formData, setFormData] = useState<UserGoals>(currentGoals);

  // ✅ FUNÇÃO PARA FORMATAR NOMES DOS MICRONUTRIENTES
  const formatMicronutrientName = (key: string): string => {
    const foundById = AVAILABLE_MICRONUTRIENTS.find(
      (micro) => micro.id === key
    );
    if (foundById) {
      return foundById.name;
    }

    const foundByName = AVAILABLE_MICRONUTRIENTS.find(
      (micro) => micro.name === key
    );
    if (foundByName) {
      return foundByName.name;
    }

    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/Vitamin /g, "Vitamina ")
      .replace(/Iron/g, "Ferro")
      .replace(/Calcium/g, "Cálcio")
      .replace(/Magnesium/g, "Magnésio")
      .replace(/Potassium/g, "Potássio")
      .replace(/Sodium/g, "Sódio")
      .replace(/Zinc/g, "Zinco")
      .replace(/Copper/g, "Cobre")
      .replace(/Selenium/g, "Selênio")
      .replace(/Iodine/g, "Iodo");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoals({
      ...formData,
      createdAt: new Date().toISOString(),
      validFrom: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  const addMicronutrient = (name: string, defaultValue: number) => {
    setFormData({
      ...formData,
      micronutrients: {
        ...formData.micronutrients,
        [name]: defaultValue,
      },
    });
  };

  const removeMicronutrient = (key: string) => {
    const newMicronutrients = { ...formData.micronutrients };
    delete newMicronutrients[key];
    setFormData({
      ...formData,
      micronutrients: newMicronutrients,
    });
  };

  const existingMicronutrients = Object.keys(formData.micronutrients);

  return (
    <div className={styles.goalsSettingsOverlay}>
      <div className={styles.goalsSettingsModal}>
        <div className={styles.goalsSettingsHeader}>
          <h2>⚙️ Configurar Metas Diárias</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.goalsForm}>
          {/* ===== MACRONUTRIENTES ===== */}
          <div className={styles.goalsSection}>
            <h3>🍽️ Macronutrientes</h3>

            <div className={styles.inputGroup}>
              <label>🔥 Calorias (kcal)</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) =>
                  setFormData({ ...formData, calories: Number(e.target.value) })
                }
                min="0"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>🥩 Proteína (g)</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) =>
                  setFormData({ ...formData, protein: Number(e.target.value) })
                }
                min="0"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>🍞 Carboidratos (g)</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) =>
                  setFormData({ ...formData, carbs: Number(e.target.value) })
                }
                min="0"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>🥑 Gordura (g)</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) =>
                  setFormData({ ...formData, fat: Number(e.target.value) })
                }
                min="0"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>💧 Água (ml)</label>
              <input
                type="number"
                value={formData.water}
                onChange={(e) =>
                  setFormData({ ...formData, water: Number(e.target.value) })
                }
                min="0"
                required
              />
            </div>
          </div>

          {/* ===== MICRONUTRIENTES ===== */}
          <div className={styles.goalsSection}>
            <h3>🧬 Micronutrientes</h3>

            {/* Lista de micronutrientes adicionados */}
            <div className={styles.micronutrientsList}>
              {Object.keys(formData.micronutrients).length === 0 ? (
                <div className={styles.emptyMicronutrientsMessage}>
                  Nenhum micronutriente adicionado
                </div>
              ) : (
                Object.entries(formData.micronutrients).map(([key, value]) => {
                  const unit = getMicronutrientUnit(key); // ✅ Usa a função importada

                  return (
                    <div key={key} className={styles.micronutrientItem}>
                      <span className={styles.micronutrientName}>
                        {formatMicronutrientName(key)}
                      </span>

                      {/* ✅ INPUT COM UNIDADE */}
                      <div className={styles.micronutrientInputGroup}>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              micronutrients: {
                                ...formData.micronutrients,
                                [key]: Number(e.target.value),
                              },
                            })
                          }
                          min="0"
                          step="0.1"
                          className={styles.micronutrientInput}
                        />
                        <span className={styles.micronutrientUnit}>{unit}</span>
                      </div>

                      <button
                        type="button"
                        className={styles.removeMicronutrient}
                        onClick={() => removeMicronutrient(key)}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Novo seletor inteligente */}
            <MicronutrientSelector
              onSelect={addMicronutrient}
              excludeExisting={existingMicronutrients}
            />
          </div>

          {/* ===== INFORMAÇÕES DO PROFISSIONAL ===== */}
          <div className={styles.goalsSection}>
            <h3>👨‍⚕️ Informações do Profissional (Opcional)</h3>

            <div className={styles.professionalToggle}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.createdBy === "professional"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      createdBy: e.target.checked ? "professional" : "user",
                    })
                  }
                />
                Definido por profissional de saúde
              </label>
            </div>

            {formData.createdBy === "professional" && (
              <div className={styles.professionalInfo}>
                <div className={styles.inputGroup}>
                  <label>Nome do Profissional</label>
                  <input
                    type="text"
                    value={formData.professionalInfo?.name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        professionalInfo: {
                          ...formData.professionalInfo,
                          name: e.target.value,
                          license: formData.professionalInfo?.license || "",
                          notes: formData.professionalInfo?.notes || "",
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Registro Profissional</label>
                  <input
                    type="text"
                    placeholder="Ex: CRN 12345"
                    value={formData.professionalInfo?.license || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        professionalInfo: {
                          ...formData.professionalInfo,
                          name: formData.professionalInfo?.name || "",
                          license: e.target.value,
                          notes: formData.professionalInfo?.notes || "",
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Observações</label>
                  <textarea
                    placeholder="Ex: Dieta para ganho de massa muscular"
                    value={formData.professionalInfo?.notes || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        professionalInfo: {
                          ...formData.professionalInfo,
                          name: formData.professionalInfo?.name || "",
                          license: formData.professionalInfo?.license || "",
                          notes: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* ===== AÇÕES DO MODAL ===== */}
          <div className={styles.goalsActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              💾 Salvar Metas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalsSettings;
