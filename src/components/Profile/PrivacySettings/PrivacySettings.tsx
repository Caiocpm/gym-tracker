// src/components/Profile/PrivacySettings/PrivacySettings.tsx
import { useState } from "react";
import type { ProfilePrivacySettings, PrivacyLevel } from "../../../types/social";
import styles from "./PrivacySettings.module.css";

interface PrivacySettingsProps {
  settings: ProfilePrivacySettings;
  onSave?: (settings: ProfilePrivacySettings) => Promise<void>;
}

export function PrivacySettings({ settings: initialSettings, onSave }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<ProfilePrivacySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handlePrivacyChange = (
    field: keyof ProfilePrivacySettings,
    value: PrivacyLevel
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await onSave(settings);
      setSaveMessage("✅ Configurações salvas com sucesso!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setSaveMessage("❌ Erro ao salvar configurações");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getPrivacyIcon = (level: PrivacyLevel) => {
    switch (level) {
      case "public":
        return "🌍";
      case "friends":
        return "👥";
      case "private":
        return "🔒";
      default:
        return "🌍";
    }
  };

  const getPrivacyLabel = (level: PrivacyLevel) => {
    switch (level) {
      case "public":
        return "Público";
      case "friends":
        return "Amigos";
      case "private":
        return "Privado";
      default:
        return "Público";
    }
  };

  const getPrivacyDescription = (level: PrivacyLevel) => {
    switch (level) {
      case "public":
        return "Visível para todos";
      case "friends":
        return "Apenas amigos";
      case "private":
        return "Apenas você";
      default:
        return "";
    }
  };

  const privacyOptions: Array<{ field: keyof ProfilePrivacySettings; label: string; description: string }> = [
    {
      field: "badges",
      label: "🏆 Badges Conquistados",
      description: "Quem pode ver seus badges e conquistas",
    },
    {
      field: "stats",
      label: "📊 Estatísticas",
      description: "Quem pode ver suas estatísticas de treino",
    },
    {
      field: "workoutHistory",
      label: "💪 Histórico de Treinos",
      description: "Quem pode ver seus treinos completos",
    },
    {
      field: "progressPhotos",
      label: "📸 Fotos de Progresso",
      description: "Quem pode ver suas fotos de evolução",
    },
    {
      field: "measurements",
      label: "📏 Medidas Corporais",
      description: "Quem pode ver suas medidas e composição corporal",
    },
    {
      field: "groups",
      label: "👥 Grupos",
      description: "Quem pode ver de quais grupos você participa",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔒 Configurações de Privacidade</h2>
        <p className={styles.subtitle}>
          Controle quem pode ver suas informações e conquistas
        </p>
      </div>

      <div className={styles.settingsList}>
        {privacyOptions.map((option) => (
          <div key={option.field} className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h3 className={styles.settingLabel}>{option.label}</h3>
              <p className={styles.settingDescription}>{option.description}</p>
            </div>

            <div className={styles.privacyButtons}>
              {(["public", "friends", "private"] as PrivacyLevel[]).map((level) => (
                <button
                  key={level}
                  className={`${styles.privacyButton} ${
                    settings[option.field] === level ? styles.active : ""
                  }`}
                  onClick={() => handlePrivacyChange(option.field, level)}
                >
                  <span className={styles.privacyIcon}>{getPrivacyIcon(level)}</span>
                  <span className={styles.privacyLabel}>{getPrivacyLabel(level)}</span>
                  <span className={styles.privacyDescription}>
                    {getPrivacyDescription(level)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoIcon}>ℹ️</div>
        <div className={styles.infoContent}>
          <h4>Sobre as configurações de privacidade:</h4>
          <ul>
            <li>
              <strong>🌍 Público:</strong> Qualquer pessoa pode ver essas informações
            </li>
            <li>
              <strong>👥 Amigos:</strong> Apenas seus amigos e membros dos mesmos grupos
            </li>
            <li>
              <strong>🔒 Privado:</strong> Apenas você pode ver essas informações
            </li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      {onSave && (
        <div className={styles.saveSection}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "💾 Salvar Configurações"}
          </button>
          {saveMessage && (
            <div
              className={`${styles.saveMessage} ${
                saveMessage.includes("✅") ? styles.success : styles.error
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
