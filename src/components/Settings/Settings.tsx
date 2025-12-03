// src/components/Settings/Settings.tsx

import { useState } from "react";
import { BackupControls } from "../BackupControls/BackupControls";
import { IndexedDBDemo } from "../IndexedDBDemo/IndexedDBDemo";
import "./Settings.css";

export function Settings() {
  const [activeSection, setActiveSection] = useState<
    "backup" | "indexeddb" | "appearance" | "about"
  >("backup");

  const sections = [
    { id: "backup" as const, label: "Backup & Dados", icon: "💾" },
    { id: "indexeddb" as const, label: "IndexedDB", icon: "🗄️" },
    { id: "appearance" as const, label: "Aparência", icon: "🎨" },
    { id: "about" as const, label: "Sobre", icon: "ℹ️" },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Configurações</h1>
        <p>Personalize sua experiência e gerencie seus dados</p>
      </div>

      {/* ✅ Navegação das seções */}
      {/* ✅ Navegação desktop para Settings (visível apenas em desktop) */}
      <div className="settings-desktop-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`settings-tab-button ${
              activeSection === section.id ? "active" : ""
            }`}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-label">{section.label}</span>
          </button>
        ))}
      </div>

      {/* ✅ Navegação mobile para Settings (visível apenas em mobile) */}
      <div className="settings-mobile-nav">
        {sections.map((section) => (
          <button
            key={`mobile-${section.id}`}
            onClick={() => setActiveSection(section.id)}
            className={`settings-mobile-nav-item ${
              activeSection === section.id ? "active" : ""
            }`}
          >
            <div className="settings-mobile-nav-icon">{section.icon}</div>
            <div className="settings-mobile-nav-label">{section.label}</div>
          </button>
        ))}
      </div>

      {/* ✅ Conteúdo das seções */}
      <div className="settings-content">
        {activeSection === "backup" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>💾 Backup & Gerenciamento de Dados</h2>
              <p>Faça backup, restaure ou limpe seus dados com segurança</p>
            </div>
            {/* ✅ Usar o BackupControls existente */}
            <BackupControls />
          </div>
        )}

        {activeSection === "indexeddb" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>🗄️ IndexedDB - Banco de Dados Moderno</h2>
              <p>Migre seus dados para um armazenamento mais robusto e eficiente</p>
            </div>
            <IndexedDBDemo />
          </div>
        )}

        {activeSection === "appearance" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>🎨 Aparência</h2>
              <p>Personalize a aparência do aplicativo</p>
            </div>

            {/* ✅ Placeholder para tema escuro */}
            <div className="appearance-options">
              <div className="option-card">
                <div className="option-header">
                  <h3>🌙 Tema Escuro</h3>
                  <div className="option-toggle">
                    <label className="toggle-switch">
                      <input type="checkbox" disabled title="Em breve!" />
                      <span className="toggle-slider disabled"></span>
                    </label>
                  </div>
                </div>
                <p className="option-description">
                  Ative o modo escuro para uma experiência mais confortável em
                  ambientes com pouca luz.
                </p>
                <div className="coming-soon-badge">🚧 Em breve</div>
              </div>

              <div className="option-card">
                <div className="option-header">
                  <h3>🎨 Cores do Tema</h3>
                </div>
                <p className="option-description">
                  Personalize as cores principais do aplicativo.
                </p>
                <div className="coming-soon-badge">🚧 Em breve</div>
              </div>

              <div className="option-card">
                <div className="option-header">
                  <h3>📱 Layout Compacto</h3>
                </div>
                <p className="option-description">
                  Otimize o espaço da tela com um layout mais compacto.
                </p>
                <div className="coming-soon-badge">🚧 Em breve</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "about" && (
          <div className="settings-section">
            <div className="section-header">
              <h2>ℹ️ Sobre o GymTracker</h2>
              <p>Informações sobre o aplicativo e desenvolvimento</p>
            </div>

            <div className="about-content">
              <div className="about-card">
                <div className="about-icon">🏋️</div>
                <div className="about-info">
                  <h3>GymTracker</h3>
                  <p className="version">Versão 2.0.0</p>
                  <p className="description">
                    Seu companheiro completo para acompanhamento de treinos,
                    evolução corporal e análise de performance.
                  </p>
                </div>
              </div>

              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">💪</span>
                  <span className="feature-text">Registro de treinos</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📏</span>
                  <span className="feature-text">Medidas corporais</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span className="feature-text">Gráficos de progresso</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📈</span>
                  <span className="feature-text">Analytics avançados</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💾</span>
                  <span className="feature-text">Backup completo</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <span className="feature-text">Design responsivo</span>
                </div>
              </div>

              <div className="about-footer">
                <p>
                  <strong>Desenvolvido com:</strong> React, TypeScript, CSS3
                </p>
                <p>
                  <strong>Armazenamento:</strong> Local Storage (seus dados
                  ficam no seu dispositivo)
                </p>
                <p className="privacy-note">
                  🔒 <strong>Privacidade:</strong> Todos os seus dados são
                  armazenados localmente. Nenhuma informação é enviada para
                  servidores externos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
