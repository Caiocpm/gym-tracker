// src/components/Profile/ProfileForm.tsx

import { useState } from "react";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import type { UserProfile } from "../../types/profile";

export function ProfileForm() {
  const { state, updateProfile } = useProfile();

  const initializeFormData = () => {
    if (state.profile) {
      return {
        name: state.profile.name,
        age: state.profile.age.toString(),
        gender: state.profile.gender as "masculino" | "feminino",
        height: state.profile.height.toString(),
        weight: state.profile.weight.toString(),
        activityLevel: state.profile.activityLevel as
          | "sedentario"
          | "leve"
          | "moderado"
          | "intenso"
          | "muito_intenso",
        goal: state.profile.goal as
          | "perder_peso"
          | "manter_peso"
          | "ganhar_massa"
          | "ganhar_forca",
      };
    }

    return {
      name: "",
      age: "",
      gender: "masculino" as "masculino" | "feminino",
      height: "",
      weight: "",
      activityLevel: "moderado" as
        | "sedentario"
        | "leve"
        | "moderado"
        | "intenso"
        | "muito_intenso",
      goal: "ganhar_massa" as
        | "perder_peso"
        | "manter_peso"
        | "ganhar_massa"
        | "ganhar_forca",
    };
  };

  const [formData, setFormData] = useState(initializeFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: UserProfile = {
      id: state.profile?.id || Date.now().toString(),
      name: formData.name.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      height: Number(formData.height),
      weight: Number(formData.weight),
      activityLevel: formData.activityLevel,
      goal: formData.goal,
      createdAt: state.profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateProfile(profileData);

    alert("Perfil salvo com sucesso! ✅");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="profile-form-container">
      <h2>Dados Pessoais</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Nome Completo - linha inteira */}
        <div className="profile-form-group profile-full-width">
          <label htmlFor="name" className="profile-form-label">
            Nome Completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Seu nome completo"
            className="profile-form-input"
            required
          />
        </div>

        {/* Idade e Sexo - mesma linha */}
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="age" className="profile-form-label">
              Idade *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Anos"
              min="13"
              max="100"
              className="profile-form-input"
              required
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="gender" className="profile-form-label">
              Sexo *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="profile-form-select"
              required
            >
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
        </div>

        {/* Altura e Peso - mesma linha */}
        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="height" className="profile-form-label">
              Altura (cm) *
            </label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="Ex: 175"
              min="100"
              max="250"
              className="profile-form-input"
              required
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="weight" className="profile-form-label">
              Peso Atual (kg) *
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Ex: 70.5"
              min="30"
              max="300"
              step="0.1"
              className="profile-form-input"
              required
            />
          </div>
        </div>

        {/* Nível de Atividade - linha inteira */}
        <div className="profile-form-group profile-full-width">
          <label htmlFor="activityLevel" className="profile-form-label">
            Nível de Atividade *
          </label>
          <select
            id="activityLevel"
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            className="profile-form-select"
            required
          >
            <option value="sedentario">Sedentário (sem exercícios)</option>
            <option value="leve">Leve (1-3x por semana)</option>
            <option value="moderado">Moderado (3-5x por semana)</option>
            <option value="intenso">Intenso (6-7x por semana)</option>
            <option value="muito_intenso">Muito Intenso (2x por dia)</option>
          </select>
        </div>

        {/* Objetivo Principal - linha inteira */}
        <div className="profile-form-group profile-full-width">
          <label htmlFor="goal" className="profile-form-label">
            Objetivo Principal *
          </label>
          <select
            id="goal"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            className="profile-form-select"
            required
          >
            <option value="perder_peso">Perder Peso</option>
            <option value="manter_peso">Manter Peso</option>
            <option value="ganhar_massa">Ganhar Massa Muscular</option>
            <option value="ganhar_forca">Ganhar Força</option>
          </select>
        </div>

        <button type="submit" className="profile-save-btn">
          {state.profile ? "Atualizar Perfil" : "Criar Perfil"}
        </button>
      </form>
    </div>
  );
}
