// src/components/Profile/ProfileDashboard.tsx

import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import { calculateBodyComposition } from "../../utils/bodyCalculations";

export function ProfileDashboard() {
  const { state } = useProfile();

  if (!state.profile) {
    return (
      <div className="profile-dashboard">
        <div className="dashboard-empty">
          <h2>👤 Seu Perfil</h2>
          <p>Complete seus dados pessoais para ver o dashboard</p>
        </div>
      </div>
    );
  }

  // Pegar a medição mais recente
  const latestMeasurement =
    state.measurements.length > 0
      ? state.measurements[state.measurements.length - 1]
      : null;

  // ✅ Calcular composição corporal se houver medição
  const bodyComposition = latestMeasurement
    ? calculateBodyComposition(latestMeasurement, state.profile)
    : null;

  // ✅ Verificar se há dados suficientes para dobras cutâneas (Pollock 7)
  const hasSkinfoldData =
    latestMeasurement &&
    latestMeasurement.tricep !== undefined &&
    latestMeasurement.subscapular !== undefined &&
    latestMeasurement.chest_skinfold !== undefined &&
    latestMeasurement.midaxillary !== undefined &&
    latestMeasurement.suprailiac !== undefined &&
    latestMeasurement.abdominal !== undefined &&
    latestMeasurement.thigh_skinfold !== undefined;

  // ✅ Calcular estatísticas de progresso
  const getProgressStats = () => {
    if (state.measurements.length < 2) return null;

    const firstMeasurement = state.measurements[0];
    const weightChange = latestMeasurement!.weight - firstMeasurement.weight;
    const daysBetween = Math.floor(
      (new Date(latestMeasurement!.date).getTime() -
        new Date(firstMeasurement.date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return {
      weightChange,
      daysBetween,
      averageWeightChangePerWeek:
        daysBetween > 0 ? (weightChange / daysBetween) * 7 : 0,
    };
  };

  const progressStats = getProgressStats();

  // ✅ Função para obter classificação do IMC
  const getBMIClassification = (bmi: number) => {
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "#17a2b8" };
    if (bmi < 25) return { label: "Peso normal", color: "#28a745" };
    if (bmi < 30) return { label: "Sobrepeso", color: "#ffc107" };
    return { label: "Obesidade", color: "#dc3545" };
  };

  const bmiClassification = bodyComposition
    ? getBMIClassification(bodyComposition.bmi)
    : null;

  // ✅ Função para obter classificação da gordura corporal
  const getBodyFatClassification = (bodyFat: number, gender: string) => {
    if (gender === "masculino") {
      if (bodyFat < 6) return { label: "Essencial", color: "#17a2b8" };
      if (bodyFat < 14) return { label: "Atleta", color: "#28a745" };
      if (bodyFat < 18) return { label: "Fitness", color: "#20c997" };
      if (bodyFat < 25) return { label: "Aceitável", color: "#ffc107" };
      return { label: "Obesidade", color: "#dc3545" };
    } else {
      if (bodyFat < 14) return { label: "Essencial", color: "#17a2b8" };
      if (bodyFat < 21) return { label: "Atleta", color: "#28a745" };
      if (bodyFat < 25) return { label: "Fitness", color: "#20c997" };
      if (bodyFat < 32) return { label: "Aceitável", color: "#ffc107" };
      return { label: "Obesidade", color: "#dc3545" };
    }
  };

  const bodyFatClassification =
    hasSkinfoldData && bodyComposition
      ? getBodyFatClassification(bodyComposition.bodyFat, state.profile.gender)
      : null;

  return (
    <div className="profile-dashboard">
      <div className="dashboard-header">
        <h2>👤 Olá, {state.profile.name}!</h2>
        <p>Acompanhe seu progresso e evolução</p>
      </div>

      {/* ✅ Cards principais com layout responsivo */}
      <div className="dashboard-cards-container">
        {/* Card de Peso/IMC */}
        <div className="info-card">
          <div className="card-icon">⚖️</div>
          <div className="card-content">
            <h3>Peso & IMC</h3>
            {latestMeasurement ? (
              <>
                <div className="card-value">
                  {latestMeasurement.weight.toFixed(1)} kg
                </div>
                <div className="card-subtitle">
                  IMC: {bodyComposition?.bmi.toFixed(1) || "N/A"}
                  {bmiClassification && (
                    <span
                      style={{
                        color: bmiClassification.color,
                        marginLeft: "0.5rem",
                      }}
                    >
                      ({bmiClassification.label})
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="card-value">--</div>
                <div className="card-subtitle">Registre suas medidas</div>
              </>
            )}
          </div>
        </div>

        {/* Card de Composição Corporal */}
        <div className="info-card">
          <div className="card-icon">🔥</div>
          <div className="card-content">
            <h3>Gordura Corporal</h3>
            {hasSkinfoldData && bodyComposition ? (
              <>
                <div className="card-value">
                  {bodyComposition.bodyFat.toFixed(1)}%
                </div>
                <div className="card-subtitle">
                  {bodyFatClassification && (
                    <span style={{ color: bodyFatClassification.color }}>
                      {bodyFatClassification.label}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="card-value">--</div>
                <div className="card-subtitle">Complete dobras cutâneas</div>
              </>
            )}
          </div>
        </div>

        {/* Card de Massa Magra */}
        <div className="info-card">
          <div className="card-icon">💪</div>
          <div className="card-content">
            <h3>Massa Magra</h3>
            {hasSkinfoldData && bodyComposition ? (
              <>
                <div className="card-value">
                  {bodyComposition.leanMass.toFixed(1)} kg
                </div>
                <div className="card-subtitle">
                  {(
                    (bodyComposition.leanMass / latestMeasurement!.weight) *
                    100
                  ).toFixed(1)}
                  % do peso total
                </div>
              </>
            ) : (
              <>
                <div className="card-value">--</div>
                <div className="card-subtitle">Complete dobras cutâneas</div>
              </>
            )}
          </div>
        </div>

        {/* Card de Objetivo */}
        <div className="info-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Objetivo</h3>
            <div className="card-value">
              {state.profile.goal
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
            <div className="card-subtitle">
              Nível: {state.profile.activityLevel.replace("_", " ")}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Seção de Informações Pessoais */}
      <div className="dashboard-summary">
        <h3>👤 Informações Pessoais</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Idade:</span>
            <span className="summary-value">{state.profile.age} anos</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Gênero:</span>
            <span className="summary-value">
              {state.profile.gender === "masculino" ? "Masculino" : "Feminino"}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Altura:</span>
            <span className="summary-value">{state.profile.height} cm</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Nível de Atividade:</span>
            <span className="summary-value">
              {state.profile.activityLevel.replace("_", " ")}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Objetivo:</span>
            <span className="summary-value">
              {state.profile.goal
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Resumo das Medições (se houver) */}
      {state.measurements.length > 0 && (
        <div className="dashboard-summary">
          <h3>📊 Resumo das Medições</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Total de medições:</span>
              <span className="summary-value">{state.measurements.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Primeira medição:</span>
              <span className="summary-value">
                {new Date(state.measurements[0].date).toLocaleDateString(
                  "pt-BR"
                )}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Última medição:</span>
              <span className="summary-value">
                {new Date(latestMeasurement!.date).toLocaleDateString("pt-BR")}
              </span>
            </div>
            {progressStats && (
              <>
                <div className="summary-item">
                  <span className="summary-label">
                    Período de acompanhamento:
                  </span>
                  <span className="summary-value">
                    {progressStats.daysBetween} dias
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Variação de peso total:</span>
                  <span
                    className="summary-value"
                    style={{
                      color:
                        progressStats.weightChange >= 0 ? "#dc3545" : "#28a745",
                    }}
                  >
                    {progressStats.weightChange >= 0 ? "+" : ""}
                    {progressStats.weightChange.toFixed(1)} kg
                  </span>
                </div>
                {progressStats.daysBetween >= 7 && (
                  <div className="summary-item">
                    <span className="summary-label">Média semanal:</span>
                    <span
                      className="summary-value"
                      style={{
                        color:
                          progressStats.averageWeightChangePerWeek >= 0
                            ? "#dc3545"
                            : "#28a745",
                      }}
                    >
                      {progressStats.averageWeightChangePerWeek >= 0 ? "+" : ""}
                      {progressStats.averageWeightChangePerWeek.toFixed(2)}{" "}
                      kg/semana
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ Detalhes da Composição Corporal (se houver dados de dobras) */}
      {hasSkinfoldData && bodyComposition && (
        <div className="dashboard-summary">
          <h3>🔬 Análise Detalhada da Composição Corporal</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Percentual de Gordura:</span>
              <span
                className="summary-value"
                style={{ color: bodyFatClassification?.color }}
              >
                {bodyComposition.bodyFat.toFixed(1)}% (
                {bodyFatClassification?.label})
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Massa Gorda:</span>
              <span className="summary-value">
                {bodyComposition.fatMass.toFixed(1)} kg
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Massa Magra:</span>
              <span className="summary-value">
                {bodyComposition.leanMass.toFixed(1)} kg
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Classificação Geral:</span>
              <span className="summary-value">
                {bodyComposition.classification}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Últimas Circunferências (se houver) */}
      {latestMeasurement &&
        (latestMeasurement.chest ||
          latestMeasurement.waist ||
          latestMeasurement.hip ||
          latestMeasurement.neck ||
          latestMeasurement.bicep ||
          latestMeasurement.forearm ||
          latestMeasurement.thigh ||
          latestMeasurement.calf ||
          latestMeasurement.thorax ||
          latestMeasurement.bicep_right_contracted ||
          latestMeasurement.bicep_left_contracted ||
          latestMeasurement.abdomen_circumference ||
          latestMeasurement.forearm_right ||
          latestMeasurement.thigh_right ||
          latestMeasurement.calf_right) && (
          <div className="dashboard-summary">
            <h3>📏 Últimas Circunferências</h3>
            <div className="summary-stats">
              {latestMeasurement.thorax && (
                <div className="summary-item">
                  <span className="summary-label">Tórax:</span>
                  <span className="summary-value">
                    {latestMeasurement.thorax.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.chest && (
                <div className="summary-item">
                  <span className="summary-label">Peito:</span>
                  <span className="summary-value">
                    {latestMeasurement.chest.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.waist && (
                <div className="summary-item">
                  <span className="summary-label">Cintura:</span>
                  <span className="summary-value">
                    {latestMeasurement.waist.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.abdomen_circumference && (
                <div className="summary-item">
                  <span className="summary-label">Abdômen:</span>
                  <span className="summary-value">
                    {latestMeasurement.abdomen_circumference.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.hip && (
                <div className="summary-item">
                  <span className="summary-label">Quadril:</span>
                  <span className="summary-value">
                    {latestMeasurement.hip.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.neck && (
                <div className="summary-item">
                  <span className="summary-label">Pescoço:</span>
                  <span className="summary-value">
                    {latestMeasurement.neck.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.bicep_right_contracted && (
                <div className="summary-item">
                  <span className="summary-label">
                    Bíceps Dir. (Contraído):
                  </span>
                  <span className="summary-value">
                    {latestMeasurement.bicep_right_contracted.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.bicep_left_contracted && (
                <div className="summary-item">
                  <span className="summary-label">
                    Bíceps Esq. (Contraído):
                  </span>
                  <span className="summary-value">
                    {latestMeasurement.bicep_left_contracted.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.forearm_right && (
                <div className="summary-item">
                  <span className="summary-label">Antebraço Dir.:</span>
                  <span className="summary-value">
                    {latestMeasurement.forearm_right.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.thigh_right && (
                <div className="summary-item">
                  <span className="summary-label">Coxa Dir.:</span>
                  <span className="summary-value">
                    {latestMeasurement.thigh_right.toFixed(1)} cm
                  </span>
                </div>
              )}
              {latestMeasurement.calf_right && (
                <div className="summary-item">
                  <span className="summary-label">Panturrilha Dir.:</span>
                  <span className="summary-value">
                    {latestMeasurement.calf_right.toFixed(1)} cm
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ✅ Call to Action se não houver medições */}
      {state.measurements.length === 0 && (
        <div className="dashboard-cta">
          <h3>📏 Comece a registrar suas medidas!</h3>
          <p>
            Adicione sua primeira medição para acompanhar seu progresso e ver
            análises detalhadas da sua composição corporal
          </p>
        </div>
      )}

      {/* ✅ Dica para dobras cutâneas se não houver */}
      {state.measurements.length > 0 && !hasSkinfoldData && (
        <div className="dashboard-cta">
          <h3>🔬 Complete sua análise corporal!</h3>
          <p>
            Registre as 7 dobras cutâneas (Pollock) para ter acesso ao cálculo
            preciso do percentual de gordura corporal
          </p>
        </div>
      )}
    </div>
  );
}
