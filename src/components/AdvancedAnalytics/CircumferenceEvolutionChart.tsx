// src/components/AdvancedAnalytics/CircumferenceEvolutionChart.tsx

import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function CircumferenceEvolutionChart() {
  const { state } = useProfile();
  // ✅ Padrão: comece com algumas das novas circunferências ou as mais comuns
  const [selectedCircumferences, setSelectedCircumferences] = useState<
    string[]
  >(["waist", "abdomen_circumference", "thorax"]);

  if (!state.measurements || state.measurements.length < 2) {
    return (
      <div className="chart-placeholder">
        <h4>Evolução das Circunferências</h4>
        <p>
          Registre pelo menos duas medidas de circunferências para ver o
          gráfico.
        </p>
      </div>
    );
  }

  // ✅ Lista COMPLETA de circunferências disponíveis, incluindo as novas
  const availableCircumferences = [
    { key: "thorax", label: "Tórax", color: "#667eea" }, // ✅ Novo
    { key: "waist", label: "Cintura", color: "#764ba2" },
    { key: "abdomen_circumference", label: "Abdômen", color: "#f093fb" }, // ✅ Novo
    { key: "hip", label: "Quadril", color: "#f5576c" },
    { key: "neck", label: "Pescoço", color: "#4facfe" },
    { key: "scapular_circumference", label: "Escapular", color: "#00f2fe" }, // ✅ Novo

    {
      key: "bicep_right_contracted",
      label: "Bíceps Dir. (C)",
      color: "#ffc107",
    }, // ✅ Novo
    {
      key: "bicep_left_contracted",
      label: "Bíceps Esq. (C)",
      color: "#28a745",
    }, // ✅ Novo
    { key: "bicep_right_relaxed", label: "Bíceps Dir. (R)", color: "#dc3545" }, // ✅ Novo
    { key: "bicep_left_relaxed", label: "Bíceps Esq. (R)", color: "#6f42c1" }, // ✅ Novo
    { key: "bicep", label: "Bíceps (Genérico)", color: "#17a2b8" }, // Mantido para compatibilidade

    { key: "forearm_right", label: "Antebraço Dir.", color: "#fd7e14" }, // ✅ Novo
    { key: "forearm_left", label: "Antebraço Esq.", color: "#20c997" }, // ✅ Novo
    { key: "forearm", label: "Antebraço (Genérico)", color: "#e83e8c" }, // Mantido para compatibilidade

    { key: "thigh_right", label: "Coxa Dir.", color: "#6610f2" }, // ✅ Novo
    { key: "thigh_left", label: "Coxa Esq.", color: "#6c757d" }, // ✅ Novo
    { key: "thigh", label: "Coxa (Genérico)", color: "#007bff" }, // Mantido para compatibilidade

    { key: "calf_right", label: "Panturrilha Dir.", color: "#e91e63" }, // ✅ Novo
    { key: "calf_left", label: "Panturrilha Esq.", color: "#9c27b0" }, // ✅ Novo
    { key: "calf", label: "Panturrilha (Genérico)", color: "#ff9800" }, // Mantido para compatibilidade

    { key: "chest", label: "Peito (Genérico)", color: "#00bcd4" }, // Mantido para compatibilidade
  ];

  // Filtrar medidas que realmente possuem dados para as circunferências selecionadas
  const filteredMeasurements = state.measurements.filter((m) =>
    availableCircumferences.some(
      (circ) => m[circ.key as keyof typeof m] !== undefined
    )
  );

  if (filteredMeasurements.length < 2) {
    return (
      <div className="chart-placeholder">
        <h4>Evolução das Circunferências</h4>
        <p>
          Selecione circunferências com pelo menos duas medidas registradas para
          ver o gráfico.
        </p>
      </div>
    );
  }

  const sortedMeasurements = [...filteredMeasurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sortedMeasurements.map((m) => {
    const entry: { date: string; [key: string]: number | string } = {
      date: format(new Date(m.date), "dd/MM/yyyy", { locale: ptBR }),
    };
    availableCircumferences.forEach((circ) => {
      // Iterar sobre todas as disponíveis
      if (m[circ.key as keyof typeof m] !== undefined) {
        entry[circ.key] = m[circ.key as keyof typeof m] as number;
      }
    });
    return entry;
  });

  const handleCheckboxChange = (key: string) => {
    setSelectedCircumferences((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <>
      <h4>Evolução das Circunferências (cm)</h4>
      <div className="chart-controls-inline">
        {availableCircumferences.map((circ) => (
          <label key={circ.key} className="chart-checkbox-label">
            <input
              type="checkbox"
              checked={selectedCircumferences.includes(circ.key)}
              onChange={() => handleCheckboxChange(circ.key)}
              style={{ accentColor: circ.color }}
            />
            {circ.label}
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.3)"
          />
          <XAxis dataKey="date" stroke="#495057" />
          <YAxis
            stroke="#495057"
            label={{
              value: "Medida (cm)",
              angle: -90,
              position: "insideLeft",
              fill: "#495057",
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} cm`,
              availableCircumferences.find((c) => c.key === name)?.label ||
                name,
            ]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#495057" }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {availableCircumferences
            .filter((circ) => selectedCircumferences.includes(circ.key))
            .map((circ) => (
              <Line
                key={circ.key}
                type="monotone"
                dataKey={circ.key}
                stroke={circ.color}
                strokeWidth={2}
                dot={{ r: 3, fill: circ.color }}
                activeDot={{ r: 5 }}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
