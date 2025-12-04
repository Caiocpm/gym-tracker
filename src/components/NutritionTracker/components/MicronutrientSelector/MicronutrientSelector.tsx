// src/components/NutritionTracker/components/MicronutrientSelector/MicronutrientSelector.tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { AVAILABLE_MICRONUTRIENTS } from "../../../../types/goals";
import type { MicronutrientOption } from "../../../../types/goals";
import styles from "./MicronutrientSelector.module.css";

interface MicronutrientSelectorProps {
  onSelect: (name: string, defaultValue: number, unit?: string) => void;
  excludeExisting: string[];
}

// ✅ UNIDADES DISPONÍVEIS PARA MICRONUTRIENTES
const MICRONUTRIENT_UNITS = [
  { value: "mg", label: "mg (miligramas)", common: true },
  { value: "μg", label: "μg (microgramas)", common: true },
  { value: "mcg", label: "mcg (microgramas)", common: false },
  { value: "g", label: "g (gramas)", common: false },
  { value: "IU", label: "IU (unidades internacionais)", common: false },
  { value: "%", label: "% (percentual)", common: false },
  { value: "ml", label: "ml (mililitros)", common: false },
] as const;

const MicronutrientSelector: React.FC<MicronutrientSelectorProps> = ({
  onSelect,
  excludeExisting,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customValue, setCustomValue] = useState<number>(0);
  const [customUnit, setCustomUnit] = useState<string>("mg"); // ✅ NOVO ESTADO

  // Não precisamos mais do dropdownRef pois usamos portal com overlay

  // Filtrar micronutrientes disponíveis
  const availableOptions = AVAILABLE_MICRONUTRIENTS.filter((option) => {
    const matchesSearch = option.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || option.category === selectedCategory;
    const notAlreadyAdded =
      !excludeExisting.includes(option.id) &&
      !excludeExisting.includes(option.name) &&
      !excludeExisting.some((existing) =>
        existing.toLowerCase().includes(option.name.toLowerCase())
      );

    return matchesSearch && matchesCategory && notAlreadyAdded;
  });

  // Categorias únicas
  const categories = [
    "all",
    ...Array.from(new Set(AVAILABLE_MICRONUTRIENTS.map((opt) => opt.category))),
  ];

  const handleSelectOption = (option: MicronutrientOption) => {
    console.log('handleSelectOption called:', option); // Debug
    console.log('Calling onSelect with:', { name: option.name, dailyValue: option.dailyValue, unit: option.unit }); // Debug
    onSelect(option.name, option.dailyValue, option.unit);
    setIsOpen(false);
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // ✅ ATUALIZADA: Incluir unidade personalizada
  const handleAddCustom = () => {
    if (customName.trim() && customValue > 0) {
      onSelect(customName.trim(), customValue, customUnit);
      setCustomMode(false);
      setCustomName("");
      setCustomValue(0);
      setCustomUnit("mg"); // ✅ RESETAR UNIDADE
      setIsOpen(false);
    }
  };

  // ✅ FUNÇÃO PARA RESETAR MODO PERSONALIZADO
  const handleCancelCustom = () => {
    setCustomMode(false);
    setCustomName("");
    setCustomValue(0);
    setCustomUnit("mg");
  };

  // Renderizar o dropdown em um portal
  const dropdownContent = isOpen && (
    <>
      {/* Overlay escuro para mobile */}
      <div
        className={styles.modalOverlay}
        onClick={() => setIsOpen(false)}
      />
      <div className={styles.selectorDropdown}>
          {/* Header com toggle e botão fechar */}
          <div className={styles.selectorHeader}>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${
                  !customMode ? styles.active : ""
                }`}
                onClick={() => setCustomMode(false)}
              >
                📋 Banco de Dados
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${
                  customMode ? styles.active : ""
                }`}
                onClick={() => setCustomMode(true)}
              >
                ✏️ Personalizado
              </button>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {!customMode ? (
            <>
              {/* Filtros */}
              <div className={styles.selectorFilters}>
                <input
                  type="text"
                  placeholder="🔍 Buscar micronutriente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.categoryFilter}
                >
                  <option value="all">🏷️ Todas as categorias</option>
                  {categories.slice(1).map((category) => (
                    <option key={category} value={category}>
                      {category === "Vitaminas"
                        ? "🧪"
                        : category === "Minerais"
                        ? "⚡"
                        : category === "Ácidos Graxos"
                        ? "🐟"
                        : "��"}{" "}
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de opções */}
              <div className={styles.optionsList}>
                {availableOptions.length > 0 ? (
                  availableOptions.map((option) => (
                    <div
                      key={option.id}
                      className={styles.optionItem}
                      onClick={() => handleSelectOption(option)}
                    >
                      <div className={styles.optionMain}>
                        <span className={styles.optionName}>{option.name}</span>
                        <span className={styles.optionValue}>
                          {option.dailyValue} {option.unit}
                        </span>
                      </div>
                      <div className={styles.optionCategory}>
                        {option.category}
                      </div>
                      {option.description && (
                        <div className={styles.optionDescription}>
                          {option.description}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.noOptions}>
                    <p>🔍 Nenhum micronutriente encontrado</p>
                    <small>
                      Tente ajustar os filtros ou use o modo personalizado
                    </small>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ✅ MODO PERSONALIZADO ATUALIZADO */
            <div className={styles.customMode}>
              <div className={styles.customHeader}>
                <h4>✏️ Micronutriente Personalizado</h4>
                <p>Para suplementos ou nutrientes específicos</p>
              </div>

              <div className={styles.customInputs}>
                <div className={styles.inputGroup}>
                  <label>Nome do Micronutriente</label>
                  <input
                    type="text"
                    placeholder="Ex: Coenzima Q10, Resveratrol..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className={styles.customInput}
                  />
                </div>

                {/* ✅ NOVA ESTRUTURA: VALOR E UNIDADE LADO A LADO */}
                <div className={styles.valueUnitRow}>
                  <div className={styles.inputGroup}>
                    <label>Meta Diária</label>
                    <input
                      type="number"
                      placeholder="Valor"
                      value={customValue || ""}
                      onChange={(e) => setCustomValue(Number(e.target.value))}
                      min="0"
                      step="0.1"
                      className={styles.customInput}
                    />
                  </div>

                  {/* ✅ NOVO: SELETOR DE UNIDADE */}
                  <div className={styles.inputGroup}>
                    <label>Unidade</label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className={styles.unitSelector}
                    >
                      {/* ✅ UNIDADES MAIS COMUNS PRIMEIRO */}
                      <optgroup label="📊 Mais Comuns">
                        {MICRONUTRIENT_UNITS.filter((unit) => unit.common).map(
                          (unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          )
                        )}
                      </optgroup>

                      {/* ✅ OUTRAS UNIDADES */}
                      <optgroup label="📋 Outras Unidades">
                        {MICRONUTRIENT_UNITS.filter((unit) => !unit.common).map(
                          (unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          )
                        )}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* ✅ PREVIEW DO VALOR COMPLETO */}
                {customName && customValue > 0 && (
                  <div className={styles.customPreview}>
                    <span className={styles.previewLabel}>Preview:</span>
                    <span className={styles.previewValue}>
                      {customName} - {customValue} {customUnit}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.customActions}>
                <button
                  type="button"
                  className={styles.cancelCustom}
                  onClick={handleCancelCustom}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.addCustom}
                  onClick={handleAddCustom}
                  disabled={!customName.trim() || customValue <= 0}
                >
                  ✅ Adicionar
                </button>
              </div>
            </div>
          )}
      </div>
    </>
  );

  return (
    <div className={styles.micronutrientSelector}>
      <button
        type="button"
        className={styles.selectorTrigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        ➕ Adicionar Micronutriente
      </button>

      {/* Renderizar dropdown em um portal diretamente no body */}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default MicronutrientSelector;
