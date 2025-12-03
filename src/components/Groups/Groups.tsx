// Groups Component - Main container for social features
import { useState } from "react";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../contexts/AuthContext";
import { ConfirmationModal } from "../UI/ConfirmationModal/ConfirmationModal";
import type { Group } from "../../types/social";
import styles from "./Groups.module.css";
import { GroupFeed } from "./GroupFeed";

type TabType = "my-groups" | "discover" | "join";

export function Groups() {
  const { myGroups, loading, error, createGroup, joinGroup, deleteGroup } =
    useGroups();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("my-groups");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    const newGroup = await createGroup({
      name: groupName,
      description: groupDescription,
      isPrivate,
    });

    if (newGroup) {
      setShowCreateModal(false);
      setGroupName("");
      setGroupDescription("");
      setIsPrivate(false);
    }
    setIsSubmitting(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    const success = await joinGroup(inviteCode);

    if (success) {
      setShowJoinModal(false);
      setInviteCode("");
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteGroup(groupToDelete.id);
      if (success) {
        console.log("✅ Grupo deletado com sucesso!");
        setShowDeleteModal(false);
        setGroupToDelete(null);
      } else {
        console.error("❌ Erro ao deletar grupo");
        alert("Erro ao deletar o grupo. Tente novamente.");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Erro ao deletar o grupo. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setGroupToDelete(null);
  };

  if (selectedGroup) {
    return (
      <GroupFeed group={selectedGroup} onBack={() => setSelectedGroup(null)} />
    );
  }

  return (
    <div className={styles.groupsContainer}>
      <div className={styles.header}>
        <h1>Grupos</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className={styles.createButton}
            onClick={() => setShowJoinModal(true)}
          >
            <span>🔗</span>
            Entrar com Código
          </button>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <span>➕</span>
            Criar Grupo
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "my-groups" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("my-groups")}
        >
          Meus Grupos
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "discover" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("discover")}
        >
          Descobrir
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando grupos...</div>
      ) : (
        <>
          {activeTab === "my-groups" && (
            <>
              {myGroups.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>Você ainda não faz parte de nenhum grupo</h3>
                  <p>
                    Crie seu primeiro grupo ou entre em um grupo existente
                    usando um código de convite!
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "center",
                      marginTop: "1rem",
                    }}
                  >
                    <button
                      className={styles.createButton}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Criar Grupo
                    </button>
                    <button
                      className={styles.createButton}
                      onClick={() => setShowJoinModal(true)}
                    >
                      Entrar com Código
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.groupsGrid}>
                  {myGroups.map((group) => {
                    const isCreator = currentUser?.uid === group.createdBy;

                    return (
                      <div
                        key={group.id}
                        className={styles.groupCard}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className={styles.groupCardHeader}>
                          {group.coverPhoto ? (
                            <img
                              src={group.coverPhoto}
                              alt={group.name}
                              className={styles.groupCoverImage}
                            />
                          ) : (
                            <div className={styles.groupCover}>👥</div>
                          )}
                          {isCreator && (
                            <button
                              className={styles.deleteGroupButton}
                              onClick={(e) => handleDeleteClick(group, e)}
                              title="Deletar grupo"
                              aria-label="Deletar grupo"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className={styles.groupInfo}>
                          <h3 className={styles.groupName}>{group.name}</h3>
                          {group.description && (
                            <p className={styles.groupDescription}>
                              {group.description}
                            </p>
                          )}
                          <div className={styles.groupStats}>
                            <span>
                              👥 {group.membersCount} membro
                              {group.membersCount !== 1 ? "s" : ""}
                            </span>
                            <span>
                              📝 {group.postsCount} post
                              {group.postsCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "discover" && (
            <div className={styles.emptyState}>
              <h3>Descubra novos grupos</h3>
              <p>Em breve você poderá descobrir grupos públicos!</p>
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Criar Novo Grupo</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="groupName">Nome do Grupo *</label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Treino Matinal"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="groupDescription">Descrição</label>
                <textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Descreva o propósito do grupo..."
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.checkbox}>
                  <input
                    id="isPrivate"
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <label htmlFor="isPrivate">
                    Grupo Privado (apenas por convite)
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !groupName.trim()}
                >
                  {isSubmitting ? "Criando..." : "Criar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowJoinModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Entrar em um Grupo</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="inviteCode">Código de Convite</label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC12345"
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !inviteCode.trim()}
                >
                  {isSubmitting ? "Entrando..." : "Entrar no Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Grupo"
        message={`Tem certeza que deseja deletar o grupo "${groupToDelete?.name}"?`}
        details={[
          "Esta ação não pode ser desfeita.",
          "Todos os posts e dados do grupo serão removidos permanentemente.",
        ]}
        confirmText={isDeleting ? "Deletando..." : "Sim, Deletar"}
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
        disabled={isDeleting}
      />
    </div>
  );
}
