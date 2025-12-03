// src/components/Profile/Profile.tsx

import { useState } from "react";
import { useProfile } from "../../contexts/ProfileProviderIndexedDB";
import { ProfileForm } from "./ProfileForm";
import { MeasurementsForm } from "./MeasurementsForm";
import { ProfileDashboard } from "./ProfileDashboard";
import { MeasurementsHistory } from "./MeasurementsHistory";
import { PublicProfile } from "./PublicProfile/PublicProfile";
import "./Profile.css";

type ProfileTab = "dashboard" | "personal" | "measurements" | "history" | "public";

export function Profile() {
  const { state } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>("dashboard");

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: "📊" },
    { id: "personal" as const, label: "Dados Pessoais", icon: "👤" },
    { id: "measurements" as const, label: "Medidas", icon: "📏" },
    { id: "history" as const, label: "Histórico", icon: "📈" },
    { id: "public" as const, label: "Perfil Público", icon: "🏆" },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie seus dados pessoais e acompanhe sua evolução</p>
      </div>

      {/* ✅ Navegação desktop (mantida) */}
      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`profile-tab-button ${
              activeTab === tab.id ? "active" : ""
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ✅ Navegação mobile sempre visível */}
      <div className="profile-mobile-nav">
        {tabs.map((tab) => (
          <button
            key={`mobile-${tab.id}`}
            className={`mobile-nav-item ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="mobile-nav-icon">{tab.icon}</div>
            <div className="mobile-nav-label">{tab.label}</div>
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === "dashboard" && <ProfileDashboard />}
        {activeTab === "personal" && <ProfileForm />}
        {activeTab === "measurements" && <MeasurementsForm />}
        {activeTab === "history" && <MeasurementsHistory />}
        {activeTab === "public" && <PublicProfile />}
      </div>

      {!state.profile && activeTab === "dashboard" && (
        <div className="profile-empty-state">
          <h3>👋 Bem-vindo!</h3>
          <p>
            Complete seus dados pessoais para começar a usar todas as
            funcionalidades.
          </p>
          <button
            onClick={() => setActiveTab("personal")}
            className="profile-save-btn"
          >
            Configurar Perfil
          </button>
        </div>
      )}
    </div>
  );
}
