// src/components/ProgressCharts/ProgressCharts.tsx

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorkout } from "../../contexts/WorkoutContext";
import type { LoggedExercise } from "../../types"; // ✅ Renomeado de ExerciseHistory
import "./ProgressCharts.css";

export function ProgressCharts() {
  const { state } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [timeRange, setTimeRange] = useState<number>(30); // dias

  // Filtrar dados por período
  const filterByTimeRange = (history: LoggedExercise[]) => {
    // ✅ Tipado history
    const cutoffDate = subDays(new Date(), timeRange);
    return history.filter((entry: LoggedExercise) =>
      isAfter(new Date(entry.date), cutoffDate)
    ); // ✅ Tipado entry
  };

  // Obter exercícios únicos
  const uniqueExercises = Array.from(
    new Set(
      state.loggedExercises.map((entry: LoggedExercise) => entry.exerciseName)
    ) // ✅ Renomeado e tipado entry
  );

  // Dados para gráfico de evolução de peso
  const getWeightProgressData = () => {
    const filteredHistory = filterByTimeRange(state.loggedExercises); // ✅ Renomeado
    const exerciseData = selectedExercise
      ? filteredHistory.filter(
          (entry: LoggedExercise) => entry.exerciseName === selectedExercise // ✅ Tipado entry
        )
      : filteredHistory;

    return exerciseData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry: LoggedExercise) => ({
        // ✅ Tipado entry
        date: format(new Date(entry.date), "dd/MM", { locale: ptBR }),
        peso: entry.weight,
        volume: entry.volume,
        exercicio: entry.exerciseName,
      }));
  };

  // Dados para gráfico de volume por exercício
  const getVolumeByExerciseData = () => {
    const filteredHistory = filterByTimeRange(state.loggedExercises); // ✅ Renomeado
    const exerciseVolumes: { [key: string]: number } = {};

    filteredHistory.forEach((entry: LoggedExercise) => {
      // ✅ Tipado entry
      if (exerciseVolumes[entry.exerciseName]) {
        exerciseVolumes[entry.exerciseName] += entry.volume;
      } else {
        exerciseVolumes[entry.exerciseName] = entry.volume;
      }
    });

    return Object.entries(exerciseVolumes).map(([name, volume]) => ({
      exercicio: name,
      volume,
    }));
  };

  // Dados para gráfico de treinos por dia da semana
  const getWorkoutsByDayData = () => {
    const filteredHistory = filterByTimeRange(state.loggedExercises); // ✅ Renomeado
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayCount: { [key: number]: number } = {};

    filteredHistory.forEach((entry: LoggedExercise) => {
      // ✅ Tipado entry
      const dayOfWeek = new Date(entry.date).getDay();
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    });

    return dayNames.map((name, index) => ({
      dia: name,
      treinos: dayCount[index] || 0,
    }));
  };

  const weightProgressData = getWeightProgressData();
  const volumeByExerciseData = getVolumeByExerciseData();
  const workoutsByDayData = getWorkoutsByDayData();

  const COLORS = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
  ];

  if (state.loggedExercises.length === 0) {
    // ✅ Renomeado
    return (
      <div className="progress-charts">
        <div className="empty-charts">
          <h3>📊 Gráficos de Progresso</h3>
          <p>Adicione alguns exercícios para ver seus gráficos de progresso!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-charts">
      <div className="charts-header">
        <h3>📊 Gráficos de Progresso</h3>

        <div className="charts-controls">
          <div className="control-group">
            <label htmlFor="exercise-select">Exercício:</label>
            <select
              id="exercise-select"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Todos os exercícios</option>
              {uniqueExercises.map(
                (
                  exercise: string // ✅ Tipado exercise
                ) => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="time-range">Período:</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value={7}>Última semana</option>
              <option value={30}>Último mês</option>
              <option value={90}>Últimos 3 meses</option>
              <option value={365}>Último ano</option>
            </select>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Gráfico de Evolução de Peso */}
        <div className="chart-container">
          <h4>Evolução de Peso</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  `${value}${name === "peso" ? "kg" : ""}`,
                  name === "peso" ? "Peso" : "Volume",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#667eea"
                strokeWidth={2}
                dot={{ fill: "#667eea", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Volume por Exercício */}
        <div className="chart-container">
          <h4>Volume Total por Exercício</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeByExerciseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="exercicio"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}kg`, "Volume Total"]} />
              <Bar dataKey="volume" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Treinos por Dia da Semana */}
        <div className="chart-container">
          <h4>Frequência por Dia da Semana</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workoutsByDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, "Exercícios"]} />
              <Bar dataKey="treinos" fill="#f093fb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Distribuição de Volume */}
        <div className="chart-container">
          <h4>Distribuição de Volume</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={volumeByExerciseData.slice(0, 6)} // Top 6 exercícios
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="volume"
              >
                {volumeByExerciseData.slice(0, 6).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const totalVolume = volumeByExerciseData.reduce(
                    (sum: number, item) => sum + item.volume, // ✅ Tipado sum
                    0
                  );
                  const percentage = (
                    ((value as number) / totalVolume) *
                    100
                  ).toFixed(1);
                  return [`${value}kg (${percentage}%)`, "Volume"];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legenda customizada para o gráfico de pizza */}
          <div className="pie-legend">
            {volumeByExerciseData.slice(0, 6).map((item, index) => {
              const totalVolume = volumeByExerciseData.reduce(
                (sum: number, data) => sum + data.volume, // ✅ Tipado sum
                0
              );
              const percentage = ((item.volume / totalVolume) * 100).toFixed(1);

              return (
                <div key={item.exercicio} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="legend-text">
                    {item.exercicio} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="stats-summary">
        <div className="stat-card">
          <h4>Total de Exercícios</h4>
          <span className="stat-value">
            {state.loggedExercises.length}
          </span>{" "}
          {/* ✅ Renomeado */}
        </div>
        <div className="stat-card">
          <h4>Exercícios Únicos</h4>
          <span className="stat-value">{uniqueExercises.length}</span>
        </div>
        <div className="stat-card">
          <h4>Volume Total</h4>
          <span className="stat-value">
            {state.loggedExercises // ✅ Renomeado
              .reduce(
                (sum: number, entry: LoggedExercise) => sum + entry.volume,
                0
              ) // ✅ Tipado sum e entry
              .toLocaleString()}
            kg
          </span>
        </div>
        <div className="stat-card">
          <h4>Peso Máximo</h4>
          <span className="stat-value">
            {Math.max(
              ...state.loggedExercises.map(
                (entry: LoggedExercise) => entry.weight
              ),
              0
            )}{" "}
            {/* ✅ Renomeado e tipado entry */}
            kg
          </span>
        </div>
      </div>
    </div>
  );
}
