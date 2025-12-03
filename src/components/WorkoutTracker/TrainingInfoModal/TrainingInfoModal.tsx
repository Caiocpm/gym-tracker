// src/components/WorkoutTracker/TrainingInfoModal/TrainingInfoModal.tsx
import { useEffect, useState } from "react";
import { Portal } from "../../UI/Portal/Portal";

interface TrainingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrainingInfoModal({ isOpen, onClose }: TrainingInfoModalProps) {
  const [activeTab, setActiveTab] = useState<"training-types" | "rpe">(
    "training-types"
  );

  // ✅ BLOQUEAR scroll do body quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // ✅ FECHAR com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ✅ REMOVIDA a função handleModalOpen não utilizada

  // ✅ ESTILOS inline para garantir funcionamento
  const overlayStyles: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
  };

  const contentStyles: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    width: "100%",
    maxWidth: "650px",
    maxHeight: "calc(100vh - 40px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    borderTop: "4px solid #3b82f6",
    margin: "auto",
  };

  const headerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 24px 0 24px",
    backgroundColor: "#ffffff",
    flexShrink: 0,
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    flexShrink: 0,
  };

  const tabStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "16px 24px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: isActive ? 600 : 500,
    color: isActive ? "#3b82f6" : "#64748b",
    borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
    transition: "all 0.2s ease",
  });

  const bodyStyles: React.CSSProperties = {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  };

  const actionsStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 24px 24px 24px",
    borderTop: "1px solid #f3f4f6",
    backgroundColor: "#ffffff",
    flexShrink: 0,
  };

  // ✅ CONTEÚDO da aba Tipos de Treino
  function renderTrainingTypesContent() {
    return (
      <>
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              💪
            </span>
            <h4
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              Treino de Força
            </h4>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 12px 0",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Focado no desenvolvimento de força máxima e hipertrofia muscular.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Métricas avançadas (RPE, Volume)
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Tempos de descanso maiores (2-3 min)
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Foco em cargas progressivas
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Controle detalhado de intensidade
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🏃
            </span>
            <h4
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              Treino de Resistência
            </h4>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 12px 0",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Focado no condicionamento físico e resistência muscular.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Métricas simplificadas
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Tempos de descanso menores (30-90s)
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Foco em volume e repetições
              </li>
              <li
                style={{
                  padding: "4px 0",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                ✅ Ideal para condicionamento
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "1px solid #fbbf24",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "1.25rem",
                width: "32px",
                height: "32px",
                background: "#fbbf24",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              💡
            </span>
            <h4
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#92400e",
              }}
            >
              Dica
            </h4>
          </div>
          <p
            style={{
              margin: 0,
              color: "#92400e",
              lineHeight: 1.5,
              fontSize: "0.9rem",
            }}
          >
            Você pode alternar entre os modos a qualquer momento usando o toggle
            ao lado do nome do treino. Cada exercício se adaptará
            automaticamente às configurações escolhidas.
          </p>
        </div>
      </>
    );
  }

  // ✅ CONTEÚDO da aba RPE
  function renderRPEContent() {
    return (
      <>
        {/* Introdução */}
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            border: "1px solid #fbbf24",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px 0",
              color: "#92400e",
              lineHeight: 1.5,
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            <strong>
              RPE (Rate of Perceived Exertion ou Índice de Esforço Percebido)
            </strong>{" "}
            é uma escala subjetiva de 1 a 10 que mede o quão difícil foi
            realizar uma série de exercícios.
          </p>
        </div>

        {/* Escala RPE */}
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              margin: "0 0 16px 0",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📊 Escala RPE
          </h4>

          {[
            {
              rpe: "1-2",
              description: "Muito Fácil",
              detail: "Poderia fazer 8+ repetições a mais",
              color: "#10b981",
            },
            {
              rpe: "3-4",
              description: "Fácil",
              detail: "Poderia fazer 6-7 repetições a mais",
              color: "#22c55e",
            },
            {
              rpe: "5-6",
              description: "Moderado",
              detail: "Poderia fazer 4-5 repetições a mais",
              color: "#eab308",
            },
            {
              rpe: "7",
              description: "Difícil",
              detail: "Poderia fazer 2-3 repetições a mais",
              color: "#f97316",
            },
            {
              rpe: "8",
              description: "Muito Difícil",
              detail: "Poderia fazer 1-2 repetições a mais",
              color: "#ef4444",
            },
            {
              rpe: "9",
              description: "Extremamente Difícil",
              detail: "Poderia fazer apenas 1 repetição a mais",
              color: "#dc2626",
            },
            {
              rpe: "10",
              description: "Máximo Esforço",
              detail: "Falha muscular completa",
              color: "#991b1b",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px",
                marginBottom: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: item.color,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                {item.rpe}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "2px",
                  }}
                >
                  {item.description}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748b",
                  }}
                >
                  {item.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dicas de uso */}
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #0ea5e9",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#0c4a6e",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            💡 Como usar o RPE
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: "#0c4a6e",
              lineHeight: 1.6,
            }}
          >
            <li style={{ marginBottom: "8px" }}>
              <strong>Avalie após cada série:</strong> Pergunte-se "quantas
              repetições eu conseguiria fazer a mais?"
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Seja honesto:</strong> A escala é subjetiva, mas seja
              consistente na sua avaliação
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Use para progressão:</strong> RPE 7-8 é ideal para
              hipertrofia, RPE 8-9 para força
            </li>
            <li>
              <strong>Ajuste o peso:</strong> Se o RPE está muito baixo, aumente
              o peso na próxima série
            </li>
          </ul>
        </div>
      </>
    );
  }

  return (
    <Portal>
      <div style={overlayStyles} onClick={handleOverlayClick}>
        <div
          style={contentStyles}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* ✅ HEADER */}
          <div style={headerStyles}>
            <h3
              id="modal-title"
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              📚 Informações de Treino
            </h3>
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              type="button"
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: "#6b7280",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "6px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* ✅ ABAS */}
          <div style={tabsContainerStyles}>
            <button
              style={tabStyles(activeTab === "training-types")}
              onClick={() => setActiveTab("training-types")}
            >
              💪 Tipos de Treino
            </button>
            <button
              style={tabStyles(activeTab === "rpe")}
              onClick={() => setActiveTab("rpe")}
            >
              🎯 RPE
            </button>
          </div>

          {/* ✅ CONTEÚDO DA ABA ATIVA */}
          <div style={bodyStyles}>
            {activeTab === "training-types"
              ? renderTrainingTypesContent()
              : renderRPEContent()}
          </div>

          {/* ✅ AÇÕES */}
          <div style={actionsStyles}>
            <button
              onClick={onClose}
              type="button"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                border: "none",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "white",
                cursor: "pointer",
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
