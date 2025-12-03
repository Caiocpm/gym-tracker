// src/components/Profile/MeasurementsForm.tsx

import { useState } from "react";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import type { BodyMeasurements } from "../../types/profile";

// ✅ Interface simplificada para o formulário
interface MeasurementsFormData {
  date: string;
  weight: string;
  // Circunferências básicas (compatibilidade)
  chest: string;
  waist: string;
  hip: string;
  neck: string;
  bicep: string;
  forearm: string;
  thigh: string;
  calf: string;
  // Dobras cutâneas
  tricep: string;
  subscapular: string;
  chest_skinfold: string;
  midaxillary: string;
  suprailiac: string;
  abdominal: string;
  thigh_skinfold: string;
  // ✅ NOVAS CIRCUNFERÊNCIAS
  thorax: string;
  bicep_right_contracted: string;
  bicep_left_contracted: string;
  bicep_right_relaxed: string;
  bicep_left_relaxed: string;
  abdomen_circumference: string;
  forearm_right: string;
  forearm_left: string;
  thigh_right: string;
  thigh_left: string;
  scapular_circumference: string;
  calf_right: string;
  calf_left: string;
}

export function MeasurementsForm() {
  const { state, addMeasurement } = useProfile();
  const [activeSection, setActiveSection] = useState<
    "basic" | "circumferences" | "skinfolds"
  >("basic");

  // ✅ Estado do formulário simplificado
  const [formData, setFormData] = useState<MeasurementsFormData>({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    chest: "",
    waist: "",
    hip: "",
    neck: "",
    bicep: "",
    forearm: "",
    thigh: "",
    calf: "",
    tricep: "",
    subscapular: "",
    chest_skinfold: "",
    midaxillary: "",
    suprailiac: "",
    abdominal: "",
    thigh_skinfold: "",
    // ✅ NOVOS CAMPOS INICIALIZADOS
    thorax: "",
    bicep_right_contracted: "",
    bicep_left_contracted: "",
    bicep_right_relaxed: "",
    bicep_left_relaxed: "",
    abdomen_circumference: "",
    forearm_right: "",
    forearm_left: "",
    thigh_right: "",
    thigh_left: "",
    scapular_circumference: "",
    calf_right: "",
    calf_left: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight) {
      alert("Peso é obrigatório!");
      return;
    }

    if (!state.profile) {
      alert("Complete seus dados pessoais primeiro!");
      return;
    }

    // ✅ Construir objeto de medidas de forma mais simples
    const measurementData: Omit<BodyMeasurements, "id" | "userId"> = {
      date: formData.date,
      weight: Number(formData.weight),
    };

    // ✅ Adicionar campos opcionais apenas se preenchidos
    if (formData.chest) measurementData.chest = Number(formData.chest);
    if (formData.waist) measurementData.waist = Number(formData.waist);
    if (formData.hip) measurementData.hip = Number(formData.hip);
    if (formData.neck) measurementData.neck = Number(formData.neck);
    if (formData.bicep) measurementData.bicep = Number(formData.bicep);
    if (formData.forearm) measurementData.forearm = Number(formData.forearm);
    if (formData.thigh) measurementData.thigh = Number(formData.thigh);
    if (formData.calf) measurementData.calf = Number(formData.calf);
    if (formData.tricep) measurementData.tricep = Number(formData.tricep);
    if (formData.subscapular)
      measurementData.subscapular = Number(formData.subscapular);
    if (formData.chest_skinfold)
      measurementData.chest_skinfold = Number(formData.chest_skinfold);
    if (formData.midaxillary)
      measurementData.midaxillary = Number(formData.midaxillary);
    if (formData.suprailiac)
      measurementData.suprailiac = Number(formData.suprailiac);
    if (formData.abdominal)
      measurementData.abdominal = Number(formData.abdominal);
    if (formData.thigh_skinfold)
      measurementData.thigh_skinfold = Number(formData.thigh_skinfold);

    // ✅ NOVOS CAMPOS
    if (formData.thorax) measurementData.thorax = Number(formData.thorax);
    if (formData.bicep_right_contracted)
      measurementData.bicep_right_contracted = Number(
        formData.bicep_right_contracted
      );
    if (formData.bicep_left_contracted)
      measurementData.bicep_left_contracted = Number(
        formData.bicep_left_contracted
      );
    if (formData.bicep_right_relaxed)
      measurementData.bicep_right_relaxed = Number(
        formData.bicep_right_relaxed
      );
    if (formData.bicep_left_relaxed)
      measurementData.bicep_left_relaxed = Number(formData.bicep_left_relaxed);
    if (formData.abdomen_circumference)
      measurementData.abdomen_circumference = Number(
        formData.abdomen_circumference
      );
    if (formData.forearm_right)
      measurementData.forearm_right = Number(formData.forearm_right);
    if (formData.forearm_left)
      measurementData.forearm_left = Number(formData.forearm_left);
    if (formData.thigh_right)
      measurementData.thigh_right = Number(formData.thigh_right);
    if (formData.thigh_left)
      measurementData.thigh_left = Number(formData.thigh_left);
    if (formData.scapular_circumference)
      measurementData.scapular_circumference = Number(
        formData.scapular_circumference
      );
    if (formData.calf_right)
      measurementData.calf_right = Number(formData.calf_right);
    if (formData.calf_left)
      measurementData.calf_left = Number(formData.calf_left);

    addMeasurement(measurementData);

    // ✅ Reset form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      weight: "",
      chest: "",
      waist: "",
      hip: "",
      neck: "",
      bicep: "",
      forearm: "",
      thigh: "",
      calf: "",
      tricep: "",
      subscapular: "",
      chest_skinfold: "",
      midaxillary: "",
      suprailiac: "",
      abdominal: "",
      thigh_skinfold: "",
      // ✅ NOVOS CAMPOS RESETADOS
      thorax: "",
      bicep_right_contracted: "",
      bicep_left_contracted: "",
      bicep_right_relaxed: "",
      bicep_left_relaxed: "",
      abdomen_circumference: "",
      forearm_right: "",
      forearm_left: "",
      thigh_right: "",
      thigh_left: "",
      scapular_circumference: "",
      calf_right: "",
      calf_left: "",
    });

    alert("Medidas salvas com sucesso! ✅");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="measurements-form-container">
      <h2>Medidas Corporais</h2>
      <p>Registre suas medidas para acompanhar a evolução</p>

      {/* ✅ Navegação das seções com textos abreviados - SEM usar a variável sections */}
      <div className="measurements-tabs">
        <button
          onClick={() => setActiveSection("basic")}
          className={`measurements-tab ${
            activeSection === "basic" ? "active" : ""
          }`}
        >
          <span className="tab-text-full">⚖️ Básico</span>
          <span className="tab-text-short">⚖️ Básico</span>
        </button>

        <button
          onClick={() => setActiveSection("circumferences")}
          className={`measurements-tab ${
            activeSection === "circumferences" ? "active" : ""
          }`}
        >
          <span className="tab-text-full">📏 Circunferências</span>
          <span className="tab-text-short">📏 Circunfêren.</span>
        </button>

        <button
          onClick={() => setActiveSection("skinfolds")}
          className={`measurements-tab ${
            activeSection === "skinfolds" ? "active" : ""
          }`}
        >
          <span className="tab-text-full">📐 Dobras Cutâneas</span>
          <span className="tab-text-short">📐 Dobras</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="measurements-form">
        {/* Data e Peso (sempre visível) */}
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="date" className="profile-form-label">
              Data *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="profile-form-input"
              required
            />
          </div>
          <div className="profile-form-group">
            <label htmlFor="weight" className="profile-form-label">
              Peso (kg) *
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Ex: 70.5"
              step="0.1"
              min="30"
              max="300"
              className="profile-form-input"
              required
            />
          </div>
        </div>

        {/* Seção Básica */}
        {activeSection === "basic" && (
          <div className="measurements-section">
            <h3>📊 Medidas Básicas</h3>
            <p>Peso é obrigatório. As demais medidas são opcionais.</p>
            <div className="basic-info">
              <p>✅ Peso registrado acima</p>
              <p>
                📏 Use as abas "Circunferências" e "Dobras Cutâneas" para
                medidas detalhadas
              </p>
            </div>
          </div>
        )}

        {/* Circunferências */}
        {activeSection === "circumferences" && (
          <div className="measurements-section">
            <h3>📏 Circunferências (cm)</h3>
            <p>
              Medidas opcionais para acompanhar mudanças na composição corporal
            </p>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="thorax" className="profile-form-label">
                  Tórax
                </label>
                <input
                  type="number"
                  id="thorax"
                  name="thorax"
                  value={formData.thorax}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="waist" className="profile-form-label">
                  Cintura
                </label>
                <input
                  type="number"
                  id="waist"
                  name="waist"
                  value={formData.waist}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="hip" className="profile-form-label">
                  Quadril
                </label>
                <input
                  type="number"
                  id="hip"
                  name="hip"
                  value={formData.hip}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="neck" className="profile-form-label">
                  Pescoço
                </label>
                <input
                  type="number"
                  id="neck"
                  name="neck"
                  value={formData.neck}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label
                  htmlFor="bicep_right_contracted"
                  className="profile-form-label"
                >
                  Bíceps Dir. (Contraído)
                </label>
                <input
                  type="number"
                  id="bicep_right_contracted"
                  name="bicep_right_contracted"
                  value={formData.bicep_right_contracted}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label
                  htmlFor="bicep_left_contracted"
                  className="profile-form-label"
                >
                  Bíceps Esq. (Contraído)
                </label>
                <input
                  type="number"
                  id="bicep_left_contracted"
                  name="bicep_left_contracted"
                  value={formData.bicep_left_contracted}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label
                  htmlFor="bicep_right_relaxed"
                  className="profile-form-label"
                >
                  Bíceps Dir. (Relaxado)
                </label>
                <input
                  type="number"
                  id="bicep_right_relaxed"
                  name="bicep_right_relaxed"
                  value={formData.bicep_right_relaxed}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label
                  htmlFor="bicep_left_relaxed"
                  className="profile-form-label"
                >
                  Bíceps Esq. (Relaxado)
                </label>
                <input
                  type="number"
                  id="bicep_left_relaxed"
                  name="bicep_left_relaxed"
                  value={formData.bicep_left_relaxed}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label
                  htmlFor="abdomen_circumference"
                  className="profile-form-label"
                >
                  Abdômen
                </label>
                <input
                  type="number"
                  id="abdomen_circumference"
                  name="abdomen_circumference"
                  value={formData.abdomen_circumference}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label
                  htmlFor="scapular_circumference"
                  className="profile-form-label"
                >
                  Escapular
                </label>
                <input
                  type="number"
                  id="scapular_circumference"
                  name="scapular_circumference"
                  value={formData.scapular_circumference}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="forearm_right" className="profile-form-label">
                  Antebraço Dir.
                </label>
                <input
                  type="number"
                  id="forearm_right"
                  name="forearm_right"
                  value={formData.forearm_right}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="forearm_left" className="profile-form-label">
                  Antebraço Esq.
                </label>
                <input
                  type="number"
                  id="forearm_left"
                  name="forearm_left"
                  value={formData.forearm_left}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="thigh_right" className="profile-form-label">
                  Coxa Dir.
                </label>
                <input
                  type="number"
                  id="thigh_right"
                  name="thigh_right"
                  value={formData.thigh_right}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="thigh_left" className="profile-form-label">
                  Coxa Esq.
                </label>
                <input
                  type="number"
                  id="thigh_left"
                  name="thigh_left"
                  value={formData.thigh_left}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="calf_right" className="profile-form-label">
                  Panturrilha Dir.
                </label>
                <input
                  type="number"
                  id="calf_right"
                  name="calf_right"
                  value={formData.calf_right}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="calf_left" className="profile-form-label">
                  Panturrilha Esq.
                </label>
                <input
                  type="number"
                  id="calf_left"
                  name="calf_left"
                  value={formData.calf_left}
                  onChange={handleChange}
                  placeholder="cm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dobras Cutâneas */}
        {activeSection === "skinfolds" && (
          <div className="measurements-section">
            <h3>📐 Dobras Cutâneas - Pollock 7 (mm)</h3>
            <p>Para cálculo preciso do percentual de gordura corporal</p>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="tricep" className="profile-form-label">
                  Tríceps
                </label>
                <input
                  type="number"
                  id="tricep"
                  name="tricep"
                  value={formData.tricep}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="subscapular" className="profile-form-label">
                  Subescapular
                </label>
                <input
                  type="number"
                  id="subscapular"
                  name="subscapular"
                  value={formData.subscapular}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="chest_skinfold" className="profile-form-label">
                  Peitoral
                </label>
                <input
                  type="number"
                  id="chest_skinfold"
                  name="chest_skinfold"
                  value={formData.chest_skinfold}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="midaxillary" className="profile-form-label">
                  Axilar Média
                </label>
                <input
                  type="number"
                  id="midaxillary"
                  name="midaxillary"
                  value={formData.midaxillary}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="suprailiac" className="profile-form-label">
                  Supra-ilíaca
                </label>
                <input
                  type="number"
                  id="suprailiac"
                  name="suprailiac"
                  value={formData.suprailiac}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="abdominal" className="profile-form-label">
                  Abdominal
                </label>
                <input
                  type="number"
                  id="abdominal"
                  name="abdominal"
                  value={formData.abdominal}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label htmlFor="thigh_skinfold" className="profile-form-label">
                  Coxa
                </label>
                <input
                  type="number"
                  id="thigh_skinfold"
                  name="thigh_skinfold"
                  value={formData.thigh_skinfold}
                  onChange={handleChange}
                  placeholder="mm"
                  step="0.1"
                  className="profile-form-input"
                />
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="profile-save-measurements-btn">
          Salvar Medidas
        </button>
      </form>
    </div>
  );
}
