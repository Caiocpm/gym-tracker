// src/components/AdvancedAnalytics/BodyCompositionChart.tsx

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
import { calculateBodyComposition } from "../../utils/bodyCalculations"; // ✅ Importar cálculo de composição

export function BodyCompositionChart() {
  const { state } = useProfile();

  // Filtrar medidas que possuem dados suficientes para calcular a composição corporal (Pollock 7)
  const measurementsWithSkinfolds = state.measurements.filter(
    (m) =>
      m.tricep !== undefined &&
      m.subscapular !== undefined &&
      m.chest_skinfold !== undefined &&
      m.midaxillary !== undefined &&
      m.suprailiac !== undefined &&
      m.abdominal !== undefined &&
      m.thigh_skinfold !== undefined
  );

  if (!state.profile || measurementsWithSkinfolds.length < 2) {
    return (
      <div className="chart-placeholder">
        <h4>Evolução da Composição Corporal</h4>
        <p>
          Complete seus dados pessoais e registre pelo menos duas medidas com
          dobras cutâneas para ver o gráfico.
        </p>
      </div>
    );
  }

  // Ordenar as medidas por data
  const sortedMeasurements = [...measurementsWithSkinfolds].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sortedMeasurements.map((m) => {
    const bodyComp = calculateBodyComposition(m, state.profile!);
    return {
      date: format(new Date(m.date), "dd/MM/yyyy", { locale: ptBR }),
      bodyFat: bodyComp.bodyFat,
      leanMass: bodyComp.leanMass,
      fatMass: bodyComp.fatMass,
    };
  });

  return (
    <>
      <h4>Evolução da Composição Corporal</h4>
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
              value: "% / kg",
              angle: -90,
              position: "insideLeft",
              fill: "#495057",
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "bodyFat")
                return [`${value.toFixed(1)} %`, "Gordura Corporal"];
              if (name === "leanMass")
                return [`${value.toFixed(1)} kg`, "Massa Magra"];
              if (name === "fatMass")
                return [`${value.toFixed(1)} kg`, "Massa Gorda"];
              return [`${value.toFixed(1)}`, name];
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#495057" }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          <Line
            type="monotone"
            dataKey="bodyFat"
            stroke="#f5576c"
            strokeWidth={2}
            name="Gordura Corporal (%)"
            dot={{ r: 3, fill: "#f5576c" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="leanMass"
            stroke="#4facfe"
            strokeWidth={2}
            name="Massa Magra (kg)"
            dot={{ r: 3, fill: "#4facfe" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="fatMass"
            stroke="#ffc107"
            strokeWidth={2}
            name="Massa Gorda (kg)"
            dot={{ r: 3, fill: "#ffc107" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
