import { useState, useCallback, useMemo } from "react";
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
import type { PieLabelRenderProps } from "recharts"; // ✅ type-only import
import { format, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorkout } from "../../contexts/WorkoutContext";
import type { LoggedExercise, MuscleGroup } from "../../types";
import "./ProgressCharts.css";

// Não precisamos mais de PieChartData e PieChartLabelProps customizados
// Usaremos PieLabelRenderProps diretamente e faremos type assertion para payload

export function ProgressCharts() {
  const { state } = useWorkout();
  const [internalSelectedExercise, setInternalSelectedExercise] =
    useState<string>(""); // ✅ Estado interno
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<
    MuscleGroup | "Todos"
  >("Todos");
  const [timeRange, setTimeRange] = useState<number>(30);

  // ✅ Função getMuscleGroupFromExerciseName com useCallback
  const getMuscleGroupFromExerciseName = useCallback(
    (exerciseName: string): MuscleGroup | undefined => {
      const exercise = state.exerciseDefinitions.find(
        (e) => e.name === exerciseName
      );
      return exercise?.primaryMuscleGroup;
    },
    [state.exerciseDefinitions]
  );

  // ✅ Função filterByTimeRange com useMemo
  const filterByTimeRange = useMemo(() => {
    return (history: LoggedExercise[]) => {
      const cutoffDate = subDays(new Date(), timeRange);
      return history.filter((entry: LoggedExercise) =>
        isAfter(new Date(entry.date), cutoffDate)
      );
    };
  }, [timeRange]);

  // ✅ Função filterByMuscleGroup com useMemo
  const filterByMuscleGroup = useMemo(() => {
    return (history: LoggedExercise[]) => {
      if (muscleGroupFilter === "Todos") return history;
      return history.filter((entry: LoggedExercise) => {
        const muscleGroup = getMuscleGroupFromExerciseName(entry.exerciseName);
        return muscleGroup === muscleGroupFilter;
      });
    };
  }, [muscleGroupFilter, getMuscleGroupFromExerciseName]);

  // ✅ Filtrar dados: tempo + grupo muscular
  const filteredLoggedExercises = useMemo(() => {
    const byTime = filterByTimeRange(state.loggedExercises);
    return filterByMuscleGroup(byTime);
  }, [state.loggedExercises, filterByTimeRange, filterByMuscleGroup]);

  // ✅ Obter exercícios únicos
  const uniqueExercises = useMemo(() => {
    return Array.from(
      new Set(
        filteredLoggedExercises.map(
          (entry: LoggedExercise) => entry.exerciseName
        )
      )
    );
  }, [filteredLoggedExercises]);

  // ✅ selectedExercise agora é um estado derivado
  const selectedExercise = useMemo(() => {
    if (
      internalSelectedExercise &&
      !uniqueExercises.includes(internalSelectedExercise)
    ) {
      return ""; // Limpa se o exercício selecionado não está mais disponível
    }
    return internalSelectedExercise;
  }, [internalSelectedExercise, uniqueExercises]);

  // ✅ Obter grupos musculares únicos
  const availableMuscleGroups = useMemo(() => {
    return Array.from(
      new Set(
        state.loggedExercises
          .map((entry) => getMuscleGroupFromExerciseName(entry.exerciseName))
          .filter((group): group is MuscleGroup => group !== undefined)
      )
    ).sort();
  }, [state.loggedExercises, getMuscleGroupFromExerciseName]);

  // ✅ handleExerciseChange agora atualiza o estado interno
  const handleExerciseChange = useCallback((value: string) => {
    setInternalSelectedExercise(value);
  }, []);

  // ✅ Dados para gráfico de evolução de peso
  const getWeightProgressData = useCallback(() => {
    const exerciseData = selectedExercise
      ? filteredLoggedExercises.filter(
          (entry: LoggedExercise) => entry.exerciseName === selectedExercise
        )
      : filteredLoggedExercises;

    return exerciseData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry: LoggedExercise) => ({
        date: format(new Date(entry.date), "dd/MM", { locale: ptBR }),
        peso: entry.weight,
        volume: entry.volume,
        exercicio: entry.exerciseName,
      }));
  }, [selectedExercise, filteredLoggedExercises]);

  // ✅ Dados para gráfico de volume por exercício
  const getVolumeByExerciseData = useCallback(() => {
    const exerciseVolumes: { [key: string]: number } = {};

    filteredLoggedExercises.forEach((entry: LoggedExercise) => {
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
  }, [filteredLoggedExercises]);

  // ✅ Dados para gráfico de treinos por dia da semana
  const getWorkoutsByDayData = useCallback(() => {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayCount: { [key: number]: number } = {};

    filteredLoggedExercises.forEach((entry: LoggedExercise) => {
      const dayOfWeek = new Date(entry.date).getDay();
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    });

    return dayNames.map((name, index) => ({
      dia: name,
      treinos: dayCount[index] || 0,
    }));
  }, [filteredLoggedExercises]);

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

  // ✅ CORRIGIDO: renderCustomizedLabel com type guard para midAngle e payload
  const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, outerRadius, percent, payload } = props;

    // ✅ Type assertion para payload
    const customPayload = payload as
      | { exercicio: string; volume: number }
      | undefined;

    // ✅ Type guards para todas as propriedades
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      outerRadius === undefined ||
      percent === undefined ||
      !customPayload ||
      !customPayload.exercicio // Garante que exercicio existe no payload
    ) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 40;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (filteredLoggedExercises.length === 0) {
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
            <label htmlFor="muscle-group-select">Grupo Muscular:</label>
            <select
              id="muscle-group-select"
              value={muscleGroupFilter}
              onChange={(e) =>
                setMuscleGroupFilter(e.target.value as MuscleGroup | "Todos")
              }
            >
              <option value="Todos">Todos os grupos</option>
              {availableMuscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="exercise-select">Exercício:</label>
            <select
              id="exercise-select"
              value={selectedExercise} // ✅ Usa o estado derivado
              onChange={(e) => handleExerciseChange(e.target.value)} // ✅ Usa callback validado
            >
              <option value="">Todos os exercícios</option>
              {uniqueExercises.map((exercise: string) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
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
                wrapperStyle={{ zIndex: 1000 }}
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
              <Tooltip
                formatter={(value) => [`${value}kg`, "Volume Total"]}
                wrapperStyle={{ zIndex: 1000 }}
              />
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
              <Tooltip
                formatter={(value) => [`${value}`, "Exercícios"]}
                wrapperStyle={{ zIndex: 1000 }}
              />
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
                data={volumeByExerciseData.slice(0, 6)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="volume"
                label={renderCustomizedLabel} // ✅ Type-safe com guards
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
                    (sum: number, item) => sum + item.volume,
                    0
                  );
                  const percentage = (
                    ((value as number) / totalVolume) *
                    100
                  ).toFixed(1);
                  return [`${value}kg (${percentage}%)`, "Volume"];
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="stats-summary">
        <div className="stat-card">
          <h4>Total de Exercícios</h4>
          <span className="stat-value">{filteredLoggedExercises.length}</span>
        </div>
        <div className="stat-card">
          <h4>Exercícios Únicos</h4>
          <span className="stat-value">{uniqueExercises.length}</span>
        </div>
        <div className="stat-card">
          <h4>Volume Total</h4>
          <span className="stat-value">
            {filteredLoggedExercises
              .reduce(
                (sum: number, entry: LoggedExercise) => sum + entry.volume,
                0
              )
              .toLocaleString()}
            kg
          </span>
        </div>
        <div className="stat-card">
          <h4>Peso Máximo</h4>
          <span className="stat-value">
            {Math.max(
              ...filteredLoggedExercises.map(
                (entry: LoggedExercise) => entry.weight
              ),
              0
            )}
            kg
          </span>
        </div>
      </div>
    </div>
  );
}
