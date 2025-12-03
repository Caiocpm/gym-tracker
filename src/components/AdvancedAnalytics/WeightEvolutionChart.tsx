// src/components/AdvancedAnalytics/WeightEvolutionChart.tsx

import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WeightEvolutionChart() {
  const { state } = useProfile();

  if (!state.measurements || state.measurements.length < 2) {
    return (
      <div className="chart-placeholder">
        <h4>Evolução do Peso</h4>
        <p>Registre pelo menos duas medidas de peso para ver o gráfico.</p>
      </div>
    );
  }

  // Ordenar as medidas por data para o gráfico
  const sortedMeasurements = [...state.measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sortedMeasurements.map((m) => ({
    date: format(new Date(m.date), "dd/MM/yyyy", { locale: ptBR }),
    weight: m.weight,
  }));

  return (
    <>
      <h4>Evolução do Peso (kg)</h4>
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
              value: "Peso (kg)",
              angle: -90,
              position: "insideLeft",
              fill: "#495057",
            }}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#495057" }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#667eea"
            strokeWidth={3}
            dot={{ r: 4, fill: "#667eea" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
