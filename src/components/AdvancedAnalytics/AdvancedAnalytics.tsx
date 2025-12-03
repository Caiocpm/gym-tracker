// src/components/AdvancedAnalytics/AdvancedAnalytics.tsx

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import { useWorkout } from "../../contexts/WorkoutContext";
import { ProgressCharts } from "../ProgressCharts/ProgressCharts";
import "./AdvancedAnalytics.css";
import { WeightEvolutionChart } from "./WeightEvolutionChart.tsx";
import { CircumferenceEvolutionChart } from "./CircumferenceEvolutionChart.tsx";
import { BodyCompositionChart } from "./BodyCompositionChart.tsx";
// import { Calendar } from "../NutritionTracker/Calendar/Calendar"; // ✅ REMOVIDO
// import { NutritionOverview } from "../NutritionTracker/NutritionOverview"; // ✅ REMOVIDO
import { CalendarTrigger } from "../NutritionTracker/components/Calendar/CalendarTrigger/CalendarTrigger.tsx"; // ✅ NOVO IMPORT
import { NutritionSummaryCards } from "../NutritionTracker/components/NutritionSummaryCards/NutritionSummaryCards.tsx"; // ✅ NOVO IMPORT (será criado no próximo passo)
import type { MuscleGroup } from "../../types";

export function AdvancedAnalytics() {
  const {
    strengthMetrics,
    muscleGroupAnalysis,
    progressPredictions,
    workoutAnalytics,
    comparisonMetrics,
    rpeAnalysis,
    restTimeAnalysis,
    trainingTypeAnalysis,
  } = useAnalytics();
  const { state: profileState } = useProfile();
  const { state: workoutState } = useWorkout();

  const [activeTab, setActiveTab] = useState<
    "strength" | "muscle" | "predictions" | "nutrition" | "measurements"
  >("strength");

  // ✅ NOVO: Estado para sub-abas dentro de "Força"
  const [strengthSubTab, setStrengthSubTab] = useState<
    "overview" | "progress" | "comparisons" | "advanced"
  >("overview");

  // ✅ NOVO: Estado para filtro de grupo muscular
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<MuscleGroup | "Todos">("Todos");

  // ✅ NOVO: Função para obter o grupo muscular de um exercício
  const getExerciseMuscleGroup = (exerciseId: string): MuscleGroup | undefined => {
    const exerciseDef = workoutState.exerciseDefinitions.find(e => e.id === exerciseId);
    return exerciseDef?.primaryMuscleGroup;
  };

  // ✅ NOVO: Obter grupos musculares únicos dos exercícios atuais
  const availableMuscleGroups = Array.from(
    new Set(
      strengthMetrics
        .map(metric => getExerciseMuscleGroup(metric.exerciseId))
        .filter((group): group is MuscleGroup => group !== undefined)
    )
  ).sort();

  // ✅ NOVO: Filtrar strengthMetrics por grupo muscular
  const filteredStrengthMetrics = muscleGroupFilter === "Todos"
    ? strengthMetrics
    : strengthMetrics.filter(metric => {
        const group = getExerciseMuscleGroup(metric.exerciseId);
        return group === muscleGroupFilter;
      });

  const COLORS = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
  ];

  const hasWorkoutData =
    strengthMetrics.length > 0 ||
    muscleGroupAnalysis.length > 0 ||
    progressPredictions.length > 0;

  const hasProfileMeasurements = profileState.measurements.length > 0;

  const hasNutritionData = true;

  const hasAnyData =
    hasWorkoutData || hasProfileMeasurements || hasNutritionData;

  if (!hasAnyData) {
    return (
      <div className="advanced-analytics">
        <div className="empty-analytics">
          <h3>📈 Analytics Avançados</h3>
          <p>
            Adicione exercícios, registre medidas ou dados de nutrição para ver
            análises detalhadas!
          </p>
          <div className="empty-actions">
            {/* Você pode adicionar botões aqui para direcionar o usuário */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h3>📈 Analytics Avançados</h3>
        <p>Análises profissionais do seu progresso</p>
      </div>

      {/* ✅ Navegação desktop para Analytics */}
      <div className="analytics-desktop-nav">
        <button
          className={`analytics-tab-button ${
            activeTab === "strength" ? "active" : ""
          }`}
          onClick={() => setActiveTab("strength")}
          disabled={!hasWorkoutData}
        >
          💪 Força
        </button>
        <button
          className={`analytics-tab-button ${
            activeTab === "muscle" ? "active" : ""
          }`}
          onClick={() => setActiveTab("muscle")}
          disabled={!hasWorkoutData}
        >
          🎯 Grupos Musculares
        </button>
        <button
          className={`analytics-tab-button ${
            activeTab === "predictions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("predictions")}
          disabled={!hasWorkoutData}
        >
          🔮 Predições
        </button>
        <button
          className={`analytics-tab-button ${
            activeTab === "nutrition" ? "active" : ""
          }`}
          onClick={() => setActiveTab("nutrition")}
          disabled={!hasNutritionData}
        >
          🍎 Nutrição
        </button>
        <button
          className={`analytics-tab-button ${
            activeTab === "measurements" ? "active" : ""
          }`}
          onClick={() => setActiveTab("measurements")}
          disabled={!hasProfileMeasurements}
        >
          📏 Medidas Corporais
        </button>
      </div>

      {/* ✅ Navegação mobile para Analytics */}
      <div className="analytics-mobile-nav">
        <button
          key={`mobile-strength`}
          className={`analytics-mobile-nav-item ${
            activeTab === "strength" ? "active" : ""
          }`}
          onClick={() => setActiveTab("strength")}
          disabled={!hasWorkoutData}
        >
          <div className="analytics-mobile-nav-icon">💪</div>
          <div className="analytics-mobile-nav-label">Força</div>
        </button>
        <button
          key={`mobile-muscle`}
          className={`analytics-mobile-nav-item ${
            activeTab === "muscle" ? "active" : ""
          }`}
          onClick={() => setActiveTab("muscle")}
          disabled={!hasWorkoutData}
        >
          <div className="analytics-mobile-nav-icon">🎯</div>
          <div className="analytics-mobile-nav-label">Grupos</div>
        </button>
        <button
          key={`mobile-predictions`}
          className={`analytics-mobile-nav-item ${
            activeTab === "predictions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("predictions")}
          disabled={!hasWorkoutData}
        >
          <div className="analytics-mobile-nav-icon">🔮</div>
          <div className="analytics-mobile-nav-label">Predições</div>
        </button>
        <button
          key={`mobile-nutrition`}
          className={`analytics-mobile-nav-item ${
            activeTab === "nutrition" ? "active" : ""
          }`}
          onClick={() => setActiveTab("nutrition")}
          disabled={!hasNutritionData}
        >
          <div className="analytics-mobile-nav-icon">🍎</div>
          <div className="analytics-mobile-nav-label">Nutrição</div>
        </button>
        <button
          key={`mobile-measurements`}
          className={`analytics-mobile-nav-item ${
            activeTab === "measurements" ? "active" : ""
          }`}
          onClick={() => setActiveTab("measurements")}
          disabled={!hasProfileMeasurements}
        >
          <div className="analytics-mobile-nav-icon">📏</div>
          <div className="analytics-mobile-nav-label">Medidas</div>
        </button>
      </div>

      <div className="analytics-content">
        {/* ✅ ABA FORÇA - COM SUB-ABAS */}
        {activeTab === "strength" && hasWorkoutData && (
          <div className="strength-analysis">
            {/* ✅ SUB-NAVEGAÇÃO DESKTOP PARA FORÇA */}
            <div className="strength-sub-nav-desktop">
              <button
                className={`strength-sub-tab ${
                  strengthSubTab === "overview" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("overview")}
              >
                🎯 Visão Geral
              </button>
              <button
                className={`strength-sub-tab ${
                  strengthSubTab === "progress" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("progress")}
              >
                📈 Progresso
              </button>
              <button
                className={`strength-sub-tab ${
                  strengthSubTab === "comparisons" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("comparisons")}
              >
                🆚 Comparações
              </button>
              <button
                className={`strength-sub-tab ${
                  strengthSubTab === "advanced" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("advanced")}
              >
                📊 Métricas Avançadas
              </button>
            </div>

            {/* ✅ SUB-NAVEGAÇÃO MOBILE PARA FORÇA */}
            <div className="strength-sub-nav-mobile">
              <button
                className={`strength-sub-nav-item ${
                  strengthSubTab === "overview" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("overview")}
              >
                <div className="sub-nav-icon">🎯</div>
                <div className="sub-nav-label">Visão Geral</div>
              </button>
              <button
                className={`strength-sub-nav-item ${
                  strengthSubTab === "progress" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("progress")}
              >
                <div className="sub-nav-icon">📈</div>
                <div className="sub-nav-label">Progresso</div>
              </button>
              <button
                className={`strength-sub-nav-item ${
                  strengthSubTab === "comparisons" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("comparisons")}
              >
                <div className="sub-nav-icon">🆚</div>
                <div className="sub-nav-label">Comparações</div>
              </button>
              <button
                className={`strength-sub-nav-item ${
                  strengthSubTab === "advanced" ? "active" : ""
                }`}
                onClick={() => setStrengthSubTab("advanced")}
              >
                <div className="sub-nav-icon">📊</div>
                <div className="sub-nav-label">Avançado</div>
              </button>
            </div>

            {/* ✅ SUB-ABA: VISÃO GERAL */}
            {strengthSubTab === "overview" && (
              <div className="strength-sub-section">
                <div className="workout-stats">
                  <div className="stat-card">
                    <h4>🏋️ Total de Treinos</h4>
                    <span className="stat-value">
                      {workoutAnalytics.totalWorkouts}
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>📅 Dia Mais Ativo</h4>
                    <span className="stat-value">
                      {workoutAnalytics.mostActiveDay}
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>📊 Consistência</h4>
                    <span className="stat-value">
                      {workoutAnalytics.consistencyScore}%
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>🏆 Nível Geral</h4>
                    <span className="stat-value">
                      {comparisonMetrics.userLevel}
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>💪 Exercícios Registrados</h4>
                    <span className="stat-value">{strengthMetrics.length}</span>
                  </div>
                  <div className="stat-card">
                    <h4>🔥 Treinos de Força</h4>
                    <span className="stat-value">
                      {trainingTypeAnalysis.strengthPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="chart-container">
                  <h4>💪 Análise de Força (1RM Estimado)</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={strengthMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="exerciseName"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(1)}kg`,
                          "1RM Estimado",
                        ]}
                      />
                      <Bar dataKey="oneRepMax" fill="#667eea" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="strength-levels">
                  <div className="strength-levels-header">
                    <div className="strength-levels-title">
                      <h4>🏆 Níveis de Força por Exercício</h4>
                      <span className="exercise-count">
                        {filteredStrengthMetrics.length} {filteredStrengthMetrics.length === 1 ? "exercício" : "exercícios"}
                      </span>
                    </div>
                    <div className="muscle-group-filter">
                      <label htmlFor="muscle-group-select">Filtrar por grupo:</label>
                      <select
                        id="muscle-group-select"
                        value={muscleGroupFilter}
                        onChange={(e) => setMuscleGroupFilter(e.target.value as MuscleGroup | "Todos")}
                        className="muscle-group-select"
                      >
                        <option value="Todos">Todos os grupos</option>
                        {availableMuscleGroups.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="levels-grid">
                    {filteredStrengthMetrics.length > 0 ? (
                      filteredStrengthMetrics.map((metric) => (
                        <div key={metric.exerciseName} className="level-card">
                          <h5>{metric.exerciseName}</h5>
                          <div
                            className={`level-badge ${metric.strengthLevel.toLowerCase()}`}
                          >
                            {metric.strengthLevel === "Elite" && "👑 "}
                            {metric.strengthLevel === "Avançado" && "🔥 "}
                            {metric.strengthLevel === "Intermediário" && "💪 "}
                            {metric.strengthLevel === "Iniciante" && "🌱 "}
                            {metric.strengthLevel}
                          </div>
                          <p>
                            <span>🏋️ 1RM:</span>
                            <strong>{metric.oneRepMax.toFixed(1)}kg</strong>
                          </p>
                          <p>
                            <span>📈 Progresso:</span>
                            <strong>{metric.progressRate.toFixed(1)}%/sem</strong>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="no-exercises-message">
                        Nenhum exercício encontrado para o grupo selecionado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ SUB-ABA: PROGRESSO */}
            {strengthSubTab === "progress" && (
              <div className="strength-sub-section">
                <div className="chart-container">
                  <h4>📈 Taxa de Progresso (% por semana)</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={strengthMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="exerciseName"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(1)}%`,
                          "Progresso Semanal",
                        ]}
                      />
                      <Bar dataKey="progressRate" fill="#f093fb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="section-divider">
                  <h4>📈 Gráficos de Progresso Detalhados</h4>
                  <p>Análise visual completa da sua evolução nos treinos</p>
                </div>

                <div className="progress-charts-section">
                  <ProgressCharts />
                </div>
              </div>
            )}

            {/* ✅ SUB-ABA: COMPARAÇÕES */}
            {strengthSubTab === "comparisons" && (
              <div className="strength-sub-section">
                <div className="section-divider">
                  <h4>🎯 Comparativos de Força</h4>
                  <p>
                    Compare seu desempenho com padrões de força e outros
                    praticantes
                  </p>
                </div>

                <div className="comparison-analysis">
                  <div className="chart-container">
                    <h4>📊 Comparação com Padrões de Força</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(
                          comparisonMetrics.strengthStandards
                        ).map(([exercise, standards]) => ({
                          exercise,
                          iniciante: standards.beginner,
                          intermediario: standards.intermediate,
                          avancado: standards.advanced,
                          elite: standards.elite,
                          usuario:
                            strengthMetrics.find(
                              (m) => m.exerciseName === exercise
                            )?.oneRepMax || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="exercise"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value).toFixed(1)}kg`,
                            "",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="iniciante"
                          fill="#e0e0e0"
                          name="Iniciante"
                        />
                        <Bar
                          dataKey="intermediario"
                          fill="#ffb74d"
                          name="Intermediário"
                        />
                        <Bar dataKey="avancado" fill="#4fc3f7" name="Avançado" />
                        <Bar dataKey="elite" fill="#ba68c8" name="Elite" />
                        <Bar dataKey="usuario" fill="#f44336" name="Você" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="percentile-analysis">
                    <h4>📊 Seu Percentil por Exercício</h4>
                    <div className="percentile-grid">
                      {Object.entries(comparisonMetrics.strengthStandards).map(
                        ([exercise, standards]) => (
                          <div key={exercise} className="percentile-card">
                            <h5>{exercise}</h5>
                            <div className="percentile-circle">
                              <div className="circle-progress">
                                <svg
                                  viewBox="0 0 36 36"
                                  className="circular-chart"
                                >
                                  <path
                                    className="circle-bg"
                                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  <path
                                    className="circle"
                                    strokeDasharray={`${standards.userPercentile}, 100`}
                                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  <text x="18" y="20.35" className="percentage">
                                    {standards.userPercentile}%
                                  </text>
                                </svg>
                              </div>
                            </div>
                            <p className="percentile-description">
                              Você está no top {100 - standards.userPercentile}%
                              dos praticantes
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ SUB-ABA: MÉTRICAS AVANÇADAS */}
            {strengthSubTab === "advanced" && (
              <div className="strength-sub-section">
                <div className="section-divider">
                  <h4>📊 Métricas Avançadas</h4>
                  <p>Análises detalhadas de RPE, descanso e tipo de treino</p>
                </div>

                {/* ✅ ANÁLISE DE RPE */}
                {rpeAnalysis.length > 0 && (
                  <>
                    <div className="section-divider">
                      <h4>📊 Análise de RPE (Rate of Perceived Exertion)</h4>
                      <p>
                        Monitore a intensidade percebida dos seus treinos ao longo
                        do tempo
                      </p>
                    </div>

                    <div className="chart-container">
                      <h4>📈 RPE Médio por Exercício</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={rpeAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="exerciseName"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis domain={[0, 10]} />
                          <Tooltip
                            formatter={(value) => [
                              `${Number(value).toFixed(1)}`,
                              "RPE Médio",
                            ]}
                          />
                          <Bar dataKey="averageRPE" fill="#f5576c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rpe-analysis-cards">
                      <h4>🎯 Análise Detalhada de RPE</h4>
                      <div className="balance-grid">
                        {rpeAnalysis.map((analysis) => (
                          <div key={analysis.exerciseId} className="balance-card">
                            <h5>{analysis.exerciseName}</h5>
                            <div className="balance-metrics">
                              <p>
                                RPE Médio: <strong>{analysis.averageRPE}</strong>
                              </p>
                              <p>
                                Tendência:{" "}
                                <strong>
                                  {analysis.trend === "increasing"
                                    ? "📈 Aumentando"
                                    : analysis.trend === "decreasing"
                                    ? "📉 Diminuindo"
                                    : "➡️ Estável"}
                                </strong>
                              </p>
                              <p>
                                Registros:{" "}
                                <strong>{analysis.rpeProgression.length}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ ANÁLISE DE TEMPO DE DESCANSO */}
                {restTimeAnalysis.length > 0 && (
                  <>
                    <div className="section-divider">
                      <h4>⏱️ Análise de Tempos de Descanso</h4>
                      <p>Compare seus tempos reais de descanso com o planejado</p>
                    </div>

                    <div className="chart-container">
                      <h4>📊 Compliance de Tempo de Descanso</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={restTimeAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="exerciseName"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            formatter={(value) => [
                              `${Number(value).toFixed(0)}%`,
                              "",
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="compliance"
                            fill="#4facfe"
                            name="Aderência (%)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rest-time-cards">
                      <h4>⏲️ Detalhes de Tempo de Descanso</h4>
                      <div className="balance-grid">
                        {restTimeAnalysis.map((analysis) => (
                          <div key={analysis.exerciseId} className="balance-card">
                            <h5>{analysis.exerciseName}</h5>
                            <div className="balance-metrics">
                              <p>
                                Planejado:{" "}
                                <strong>{analysis.plannedRestTime}s</strong>
                              </p>
                              <p>
                                Real Médio:{" "}
                                <strong>{analysis.averageActualRestTime}s</strong>
                              </p>
                              <p>
                                Aderência: <strong>{analysis.compliance}%</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ ANÁLISE DE TIPO DE TREINO */}
                <div className="section-divider">
                  <h4>🎯 Análise: Força vs Hipertrofia</h4>
                  <p>Distribuição dos seus treinos por tipo de objetivo</p>
                </div>

                <div className="training-type-stats">
                  <div className="stat-card">
                    <h4>💪 Treinos de Força</h4>
                    <span className="stat-value">
                      {trainingTypeAnalysis.strengthSessions}
                    </span>
                    <span className="stat-subtitle">
                      {trainingTypeAnalysis.strengthPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>🏋️ Treinos de Hipertrofia</h4>
                    <span className="stat-value">
                      {trainingTypeAnalysis.hypertrophySessions}
                    </span>
                    <span className="stat-subtitle">
                      {trainingTypeAnalysis.hypertrophyPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>📊 Volume Médio (Força)</h4>
                    <span className="stat-value">
                      {trainingTypeAnalysis.strengthVolumeAverage}kg
                    </span>
                  </div>
                  <div className="stat-card">
                    <h4>📊 Volume Médio (Hipertrofia)</h4>
                    <span className="stat-value">
                      {trainingTypeAnalysis.hypertrophyVolumeAverage}kg
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ OUTRAS ABAS MANTIDAS COMO ESTAVAM */}
        {activeTab === "muscle" && hasWorkoutData && (
          <div className="muscle-analysis">
            <div className="chart-container">
              <h4>💪 Volume por Grupo Muscular</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={muscleGroupAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="group" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(0)}kg`,
                      "Volume Total",
                    ]}
                  />
                  <Bar dataKey="totalVolume" fill="#764ba2" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h4>⚖️ Balanceamento Muscular</h4>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={muscleGroupAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="group" />
                  <PolarRadiusAxis angle={90} domain={[0, "dataMax"]} />
                  <Radar
                    name="Balance (%)"
                    dataKey="balance"
                    stroke="#f5576c"
                    fill="#f5576c"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(1)}%`,
                      "Balance",
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="muscle-balance-cards">
              <h4>📊 Análise Detalhada por Grupo</h4>
              <div className="balance-grid">
                {muscleGroupAnalysis.map((group, index) => (
                  <div key={group.group} className="balance-card">
                    <h5>{group.group}</h5>
                    <div className="balance-metrics">
                      <p>
                        Volume:{" "}
                        <strong>{group.totalVolume.toLocaleString()}kg</strong>
                      </p>
                      <p>
                        Exercícios: <strong>{group.exerciseCount}</strong>
                      </p>
                      <p>
                        Balance: <strong>{group.balance.toFixed(1)}%</strong>
                      </p>
                      <div className="balance-bar">
                        <div
                          className="balance-fill"
                          style={{
                            width: `${group.balance}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "predictions" && hasWorkoutData && (
          <div className="predictions-analysis">
            <div className="chart-container">
              <h4>📈 Predições de Progresso (1RM)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressPredictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="exerciseName"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}kg`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="currentMax"
                    stroke="#667eea"
                    name="Atual"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedMax1Month"
                    stroke="#f093fb"
                    name="1 Mês"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedMax3Months"
                    stroke="#f5576c"
                    name="3 Meses"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedMax6Months"
                    stroke="#4facfe"
                    name="6 Meses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="predictions-cards">
              <h4>Predições Detalhadas</h4>
              <div className="predictions-grid">
                {progressPredictions.map((prediction) => (
                  <div
                    key={prediction.exerciseName}
                    className="prediction-card"
                  >
                    <h5>{prediction.exerciseName}</h5>
                    <div className="prediction-values">
                      <div className="current">
                        <span className="label">Atual</span>
                        <span className="value">
                          {prediction.currentMax.toFixed(1)}kg
                        </span>
                      </div>
                      <div className="future">
                        <span className="label">1 Mês</span>
                        <span className="value">
                          {prediction.predictedMax1Month.toFixed(1)}kg
                        </span>
                        <span className="gain">
                          +
                          {(
                            prediction.predictedMax1Month -
                            prediction.currentMax
                          ).toFixed(1)}
                          kg
                        </span>
                      </div>
                      <div className="future">
                        <span className="label">3 Meses</span>
                        <span className="value">
                          {prediction.predictedMax3Months.toFixed(1)}kg
                        </span>
                        <span className="gain">
                          +
                          {(
                            prediction.predictedMax3Months -
                            prediction.currentMax
                          ).toFixed(1)}
                          kg
                        </span>
                      </div>
                      <div className="future">
                        <span className="label">6 Meses</span>
                        <span className="value">
                          {prediction.predictedMax6Months.toFixed(1)}kg
                        </span>
                        <span className="gain">
                          +
                          {(
                            prediction.predictedMax6Months -
                            prediction.currentMax
                          ).toFixed(1)}
                          kg
                        </span>
                      </div>
                    </div>
                    <div className="confidence">
                      Confiança: <strong>{prediction.confidence}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ NOVA ABA DE NUTRIÇÃO */}
        {activeTab === "nutrition" && (
          <div className="nutrition-analysis">
            <h3>🍎 Análises de Nutrição</h3>
            <p>Selecione uma data para ver os detalhes nutricionais.</p>

            {/* ✅ CALENDAR TRIGGER INTEGRADO */}
            <CalendarTrigger />

            {/* ✅ NutritionSummaryCards para o dia selecionado (será criado no próximo passo) */}
            <div className="nutrition-daily-summary">
              <h4>Resumo Nutricional do Dia</h4>
              <NutritionSummaryCards />
            </div>
          </div>
        )}

        {/* ✅ ABA DE MEDIDAS CORPORAIS */}
        {activeTab === "measurements" && hasProfileMeasurements && (
          <div className="measurements-analysis">
            <div className="chart-container">
              <WeightEvolutionChart />
            </div>
            <div className="chart-container">
              <CircumferenceEvolutionChart />
            </div>
            {profileState.profile &&
              profileState.measurements.some((m) => m.tricep) && (
                <div className="chart-container">
                  <BodyCompositionChart />
                </div>
              )}
          </div>
        )}

        {/* ✅ Empty State para abas de Medidas */}
        {activeTab === "measurements" && !hasProfileMeasurements && (
          <div className="empty-analytics">
            <h3>�� Medidas Corporais</h3>
            <p>
              Registre suas medidas na seção "Perfil" para ver a evolução aqui!
            </p>
          </div>
        )}

        {/* ✅ Empty State para abas de Treino (Força, Grupos, Predições) */}
        {["strength", "muscle", "predictions"].includes(activeTab) &&
          !hasWorkoutData && (
            <div className="empty-analytics">
              <h3>📈 Analytics de Treino</h3>
              <p>Adicione exercícios para ver análises detalhadas!</p>
            </div>
          )}

        {/* ✅ Empty State para a aba de Nutrição (ajustado) */}
        {activeTab === "nutrition" && !hasNutritionData && (
          <div className="empty-analytics">
            <h3>🍎 Análises de Nutrição</h3>
            <p>
              Adicione alimentos e registre suas metas para ver análises
              detalhadas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
