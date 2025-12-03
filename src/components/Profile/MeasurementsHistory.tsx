// src/components/Profile/MeasurementsHistory.tsx

import { useState } from "react";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import { calculateBodyComposition } from "../../utils/bodyCalculations";

export function MeasurementsHistory() {
  const { state, deleteMeasurement } = useProfile();
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(
    null
  );

  if (!state.profile) {
    return (
      <div className="measurements-history">
        <div className="history-empty">
          <h2>📈 Histórico de Medidas</h2>
          <p>Complete seus dados pessoais primeiro</p>
        </div>
      </div>
    );
  }

  if (state.measurements.length === 0) {
    return (
      <div className="measurements-history">
        <div className="history-empty">
          <h2>📈 Histórico de Medidas</h2>
          <p>Nenhuma medida registrada ainda</p>
          <p>Use a aba "Medidas" para adicionar suas primeiras medições</p>
        </div>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta medição?")) {
      deleteMeasurement(id);
    }
  };

  // ✅ Calcular estatísticas do histórico
  const getHistoryStats = () => {
    const sortedByDate = [...state.measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestWeight = sortedByDate[0].weight;
    const oldestWeight = sortedByDate[sortedByDate.length - 1].weight;
    const weightChange = latestWeight - oldestWeight;

    return {
      totalMeasurements: state.measurements.length,
      weightChange,
      latestDate: sortedByDate[0].date,
    };
  };

  const historyStats = getHistoryStats();

  // ✅ Ordenar medições por data (mais recente primeiro)
  const sortedMeasurements = [...state.measurements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="measurements-history">
      {/* ✅ Header com estatísticas */}
      <div className="history-header">
        <h2>📈 Histórico de Medidas</h2>
        <p>Acompanhe sua evolução ao longo do tempo</p>
      </div>

      {/* ✅ Cards de estatísticas resumidas */}
      <div className="history-stats-cards">
        <div className="history-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{historyStats.totalMeasurements}</div>
            <div className="stat-label">Medições Registradas</div>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div
              className="stat-value"
              style={{
                color: historyStats.weightChange >= 0 ? "#dc3545" : "#28a745",
              }}
            >
              {historyStats.weightChange >= 0 ? "+" : ""}
              {historyStats.weightChange.toFixed(1)} kg
            </div>
            <div className="stat-label">Variação de Peso</div>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">
              {new Date(historyStats.latestDate).toLocaleDateString("pt-BR")}
            </div>
            <div className="stat-label">Última Medição</div>
          </div>
        </div>
      </div>

      {/* ✅ Lista de medições com design melhorado */}
      <div className="measurements-timeline">
        {sortedMeasurements.map((measurement, index) => {
          const bodyComp = calculateBodyComposition(
            measurement,
            state.profile!
          );

          const hasSkinfolds =
            measurement.tricep &&
            measurement.subscapular &&
            measurement.chest_skinfold &&
            measurement.midaxillary &&
            measurement.suprailiac &&
            measurement.abdominal &&
            measurement.thigh_skinfold;

          // ✅ Verificar se há alguma circunferência registrada
          const hasAnyCircumference =
            measurement.chest ||
            measurement.waist ||
            measurement.hip ||
            measurement.neck ||
            measurement.bicep ||
            measurement.forearm ||
            measurement.thigh ||
            measurement.calf ||
            measurement.thorax ||
            measurement.bicep_right_contracted ||
            measurement.bicep_left_contracted ||
            measurement.bicep_right_relaxed ||
            measurement.bicep_left_relaxed ||
            measurement.abdomen_circumference ||
            measurement.forearm_right ||
            measurement.forearm_left ||
            measurement.thigh_right ||
            measurement.thigh_left ||
            measurement.scapular_circumference ||
            measurement.calf_right ||
            measurement.calf_left;

          const isExpanded = selectedMeasurement === measurement.id;

          return (
            <div
              key={measurement.id}
              className={`measurement-timeline-item ${
                isExpanded ? "expanded" : ""
              }`}
            >
              {/* ✅ Header da medição sempre visível */}
              <div
                className="measurement-timeline-header"
                onClick={() =>
                  setSelectedMeasurement(
                    selectedMeasurement === measurement.id
                      ? null
                      : measurement.id
                  )
                }
              >
                <div className="timeline-marker">
                  <div className="timeline-dot">{index + 1}</div>
                </div>

                <div className="timeline-content">
                  <div className="timeline-main-info">
                    <div className="timeline-date">
                      📅{" "}
                      {new Date(measurement.date).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="timeline-primary-data">
                      <span className="weight-display">
                        ⚖️ {measurement.weight.toFixed(1)}kg
                      </span>
                      <span className="bmi-display">
                        📊 IMC: {bodyComp.bmi.toFixed(1)}
                      </span>
                      {hasSkinfolds && (
                        <span className="bodyfat-display">
                          🔥 {bodyComp.bodyFat.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="timeline-actions">
                    <button className="expand-toggle" type="button">
                      {isExpanded ? "▲ Recolher" : "▼ Expandir"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ✅ Detalhes expandíveis */}
              {isExpanded && (
                <div className="measurement-timeline-details">
                  <div className="details-container">
                    {/* Composição Corporal */}
                    <div className="detail-section">
                      <h4>📊 Composição Corporal</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">IMC:</span>
                          <span className="detail-value">
                            {bodyComp.bmi.toFixed(1)}
                          </span>
                        </div>
                        {hasSkinfolds && (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Gordura:</span>
                              <span className="detail-value">
                                {bodyComp.bodyFat.toFixed(1)}%
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Massa Magra:</span>
                              <span className="detail-value">
                                {bodyComp.leanMass.toFixed(1)}kg
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Massa Gorda:</span>
                              <span className="detail-value">
                                {bodyComp.fatMass.toFixed(1)}kg
                              </span>
                            </div>
                            <div className="detail-item full-width">
                              <span className="detail-label">
                                Classificação:
                              </span>
                              <span className="detail-value classification">
                                {bodyComp.classification}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Circunferências */}
                    {hasAnyCircumference && (
                      <div className="detail-section">
                        <h4>📏 Circunferências (cm)</h4>
                        <div className="detail-grid">
                          {measurement.thorax && (
                            <div className="detail-item">
                              <span className="detail-label">Tórax:</span>
                              <span className="detail-value">
                                {measurement.thorax.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.chest && (
                            <div className="detail-item">
                              <span className="detail-label">Peito:</span>
                              <span className="detail-value">
                                {measurement.chest.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.waist && (
                            <div className="detail-item">
                              <span className="detail-label">Cintura:</span>
                              <span className="detail-value">
                                {measurement.waist.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.abdomen_circumference && (
                            <div className="detail-item">
                              <span className="detail-label">Abdômen:</span>
                              <span className="detail-value">
                                {measurement.abdomen_circumference.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.hip && (
                            <div className="detail-item">
                              <span className="detail-label">Quadril:</span>
                              <span className="detail-value">
                                {measurement.hip.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.neck && (
                            <div className="detail-item">
                              <span className="detail-label">Pescoço:</span>
                              <span className="detail-value">
                                {measurement.neck.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.bicep_right_contracted && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Bíceps Dir. (C):
                              </span>
                              <span className="detail-value">
                                {measurement.bicep_right_contracted.toFixed(1)}
                                cm
                              </span>
                            </div>
                          )}
                          {measurement.bicep_left_contracted && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Bíceps Esq. (C):
                              </span>
                              <span className="detail-value">
                                {measurement.bicep_left_contracted.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.bicep_right_relaxed && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Bíceps Dir. (R):
                              </span>
                              <span className="detail-value">
                                {measurement.bicep_right_relaxed.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.bicep_left_relaxed && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Bíceps Esq. (R):
                              </span>
                              <span className="detail-value">
                                {measurement.bicep_left_relaxed.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.forearm_right && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Antebraço Dir.:
                              </span>
                              <span className="detail-value">
                                {measurement.forearm_right.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.forearm_left && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Antebraço Esq.:
                              </span>
                              <span className="detail-value">
                                {measurement.forearm_left.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.thigh_right && (
                            <div className="detail-item">
                              <span className="detail-label">Coxa Dir.:</span>
                              <span className="detail-value">
                                {measurement.thigh_right.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.thigh_left && (
                            <div className="detail-item">
                              <span className="detail-label">Coxa Esq.:</span>
                              <span className="detail-value">
                                {measurement.thigh_left.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.calf_right && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Panturrilha Dir.:
                              </span>
                              <span className="detail-value">
                                {measurement.calf_right.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.calf_left && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Panturrilha Esq.:
                              </span>
                              <span className="detail-value">
                                {measurement.calf_left.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.scapular_circumference && (
                            <div className="detail-item">
                              <span className="detail-label">Escapular:</span>
                              <span className="detail-value">
                                {measurement.scapular_circumference.toFixed(1)}
                                cm
                              </span>
                            </div>
                          )}

                          {/* Campos genéricos (compatibilidade) */}
                          {measurement.bicep && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Bíceps (Genérico):
                              </span>
                              <span className="detail-value">
                                {measurement.bicep.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.forearm && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Antebraço (Genérico):
                              </span>
                              <span className="detail-value">
                                {measurement.forearm.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.thigh && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Coxa (Genérico):
                              </span>
                              <span className="detail-value">
                                {measurement.thigh.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                          {measurement.calf && (
                            <div className="detail-item">
                              <span className="detail-label">
                                Panturrilha (Genérico):
                              </span>
                              <span className="detail-value">
                                {measurement.calf.toFixed(1)}cm
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dobras Cutâneas */}
                    {hasSkinfolds && (
                      <div className="detail-section">
                        <h4>📐 Dobras Cutâneas (mm)</h4>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Tríceps:</span>
                            <span className="detail-value">
                              {measurement.tricep!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Subescapular:</span>
                            <span className="detail-value">
                              {measurement.subscapular!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Peitoral:</span>
                            <span className="detail-value">
                              {measurement.chest_skinfold!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Axilar Média:</span>
                            <span className="detail-value">
                              {measurement.midaxillary!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Supra-ilíaca:</span>
                            <span className="detail-value">
                              {measurement.suprailiac!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Abdominal:</span>
                            <span className="detail-value">
                              {measurement.abdominal!.toFixed(1)}mm
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Coxa:</span>
                            <span className="detail-value">
                              {measurement.thigh_skinfold!.toFixed(1)}mm
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="measurement-actions">
                      <button
                        onClick={() => handleDelete(measurement.id)}
                        className="delete-measurement-btn"
                      >
                        🗑️ Excluir Medição
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
