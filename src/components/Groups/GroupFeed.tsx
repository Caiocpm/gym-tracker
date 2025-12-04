// src/components/Groups/GroupFeed/GroupFeed.tsx

import { useState, useEffect } from "react";
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../contexts/AuthContext";
import { useGroupChallenges } from "../../hooks/useGroupChallenges";
import { ConfirmationModal } from "../UI/ConfirmationModal/ConfirmationModal";
import { LikesModal } from "./LikesModal/LikesModal";
import { CommentsSection } from "./CommentsSection/CommentsSection";
import { ChallengeCard } from "./ChallengeCard/ChallengeCard";
import { CreateChallengeModal } from "./CreateChallengeModal/CreateChallengeModal";
import { UserPublicProfile } from "../Profile/UserPublicProfile/UserPublicProfile";
import type {
  Group,
  WorkoutPost,
  PostLike,
  GroupChallenge,
} from "../../types/social";
import styles from "./GroupFeed.module.css";

interface GroupFeedProps {
  group: Group;
  onBack: () => void;
}

export function GroupFeed({ group, onBack }: GroupFeedProps) {
  const { getGroupPosts, likePost, deletePost, getPostLikes } = useGroups();
  const { userProfile } = useAuth();
  const {
    createChallenge,
    getGroupChallenges,
    joinChallenge,
    deleteChallenge,
  } = useGroupChallenges();

  const [posts, setPosts] = useState<WorkoutPost[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    id: string;
    workoutName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedPostLikes, setSelectedPostLikes] = useState<PostLike[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const [showCreateChallengeModal, setShowCreateChallengeModal] =
    useState(false);
  const [showChallengeDeleteModal, setShowChallengeDeleteModal] =
    useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<"posts" | "challenges">("posts");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isGroupAdmin = userProfile?.uid === group.createdBy;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("🔍 Carregando dados do grupo:", group.id);
        const [groupPosts, groupChallenges] = await Promise.all([
          getGroupPosts(group.id),
          getGroupChallenges(group.id),
        ]);

        console.log("📊 Posts carregados:", groupPosts.length);
        console.log(
          "🎯 Desafios carregados:",
          groupChallenges.length,
          groupChallenges
        );

        if (isMounted) {
          setPosts(groupPosts);
          setChallenges(groupChallenges);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error loading data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [getGroupPosts, getGroupChallenges, group.id, refreshKey]);

  const handleLike = async (postId: string) => {
    console.log("❤️ Curtindo post:", postId);

    const result = await likePost(postId);

    if (result.success) {
      // Atualização otimista: atualiza o contador localmente baseado na ação
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: result.added
                  ? (post.likesCount || 0) + 1
                  : Math.max((post.likesCount || 0) - 1, 0),
              }
            : post
        )
      );
    }
  };

  const handleShowLikes = async (postId: string) => {
    console.log("👥 Abrindo modal de likes para post:", postId);
    setLoadingLikes(true);
    try {
      const likes = await getPostLikes(postId);
      console.log("✅ Likes carregados:", likes);
      setSelectedPostLikes(likes);
      setShowLikesModal(true);
    } catch (error) {
      console.error("❌ Erro ao carregar likes:", error);
      alert("Erro ao carregar curtidas. Tente novamente.");
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleCommentAdded = (postId: string) => {
    console.log("✅ Comentário adicionado ao post:", postId);

    // Atualização otimista: incrementa o contador de comentários localmente
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
          : post
      )
    );
  };

  const toggleExercises = (postId: string) => {
    setExpandedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (postId: string, workoutName: string) => {
    setPostToDelete({ id: postId, workoutName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deletePost(postToDelete.id, group.id);
      if (success) {
        console.log("✅ Post deletado com sucesso!");
        setRefreshKey((prev) => prev + 1);
      } else {
        console.error("❌ Erro ao deletar post");
        alert("Erro ao deletar o post. Tente novamente.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Erro ao deletar o post. Tente novamente.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const handleCreateChallenge = async (challengeData: {
    title: string;
    description: string;
    type: import("../../types/social").ChallengeType;
    targetValue: number;
    targetUnit: string;
    startDate: Date;
    endDate: Date;
    isCompetitive: boolean;
    reward?: string;
    exerciseId?: string;
    exerciseName?: string;
  }) => {
    console.log("🎯 Criando desafio com dados:", challengeData);
    console.log("🏢 Grupo ID:", group.id);

    const challenge = await createChallenge(
      group.id,
      challengeData.title,
      challengeData.description,
      challengeData.type,
      challengeData.targetValue,
      challengeData.targetUnit,
      challengeData.startDate,
      challengeData.endDate,
      challengeData.isCompetitive,
      challengeData.reward,
      challengeData.exerciseId,
      challengeData.exerciseName
    );

    console.log("📦 Desafio retornado:", challenge);

    if (challenge) {
      console.log("✅ Desafio criado com sucesso! Atualizando lista...");
      setRefreshKey((prev) => prev + 1);
      setShowCreateChallengeModal(false);
    } else {
      console.error("❌ Falha ao criar desafio");
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    const success = await joinChallenge(challengeId);
    if (success) {
      console.log("✅ Participou do desafio!");
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleDeleteChallengeClick = (challengeId: string) => {
    setChallengeToDelete(challengeId);
    setShowChallengeDeleteModal(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    const success = await deleteChallenge(challengeToDelete);
    if (success) {
      console.log("✅ Desafio deletado!");
      setRefreshKey((prev) => prev + 1);
    }
    setShowChallengeDeleteModal(false);
    setChallengeToDelete(null);
  };

  return (
    <div className={styles.feedContainer}>
      {/* Header */}
      <div className={styles.feedHeader}>
        <button className={styles.backButton} onClick={onBack}>
          ← Voltar
        </button>
        <div className={styles.groupInfo}>
          <h1>{group.name}</h1>
          {group.description && <p>{group.description}</p>}
          <div className={styles.groupMeta}>
            <span>👥 {group.membersCount} membros</span>
            {group.inviteCode && (
              <span className={styles.inviteCode}>
                Código: <strong>{group.inviteCode}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "posts" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("posts")}
        >
          📝 Posts ({posts.length})
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "challenges" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("challenges")}
        >
          🎯 Desafios ({challenges.length})
        </button>
      </div>

      {/* Conteúdo baseado na aba ativa */}
      {activeTab === "challenges" ? (
        <>
          {/* Seção de Desafios */}
          {challenges.length > 0 ? (
            <div className={styles.challengesSection}>
              <div className={styles.challengesHeader}>
                <h2>🎯 Desafios Ativos</h2>
                {isGroupAdmin && (
                  <button
                    className={styles.createChallengeButton}
                    onClick={() => setShowCreateChallengeModal(true)}
                  >
                    + Criar Desafio
                  </button>
                )}
              </div>
              <div className={styles.challengesGrid}>
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={userProfile?.uid}
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onDelete={
                      isGroupAdmin
                        ? () => handleDeleteChallengeClick(challenge.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.noChallengesSection}>
              <h3>🎯 Nenhum Desafio Criado</h3>
              <p>
                {isGroupAdmin
                  ? "Crie desafios para motivar os membros do grupo!"
                  : "Ainda não há desafios neste grupo."}
              </p>
              {isGroupAdmin && (
                <button
                  className={styles.createChallengeButton}
                  onClick={() => setShowCreateChallengeModal(true)}
                >
                  + Criar Primeiro Desafio
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* Posts Feed */
        <div className={styles.feed}>
          {loading ? (
            <div className={styles.loading}>Carregando posts...</div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Nenhum treino compartilhado ainda</h3>
              <p>
                Complete um treino e compartilhe com o grupo para aparecer aqui!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                {/* Post Header */}
                <div className={styles.postHeader}>
                  <div
                    className={styles.userInfo}
                    onClick={() => setSelectedUserId(post.userId)}
                    style={{ cursor: "pointer" }}
                    title="Ver perfil do usuário"
                  >
                    <div className={styles.avatar}>
                      {post.userPhotoURL ? (
                        <img
                          src={post.userPhotoURL}
                          alt={post.userName || "Avatar do usuário"}
                          className={styles.avatarImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className={styles.avatarInitial}>
                          {post.userName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={styles.userName}>
                        {post.userName || "Anônimo"}
                      </div>
                      <div className={styles.postDate}>
                        {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  {userProfile?.uid === post.userId && (
                    <button
                      className={styles.deleteButton}
                      onClick={() =>
                        handleDeleteClick(post.id, post.workoutName)
                      }
                      title="Deletar este post"
                      aria-label="Deletar post"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <div className={styles.postContent}>
                  <h3>{post.workoutName}</h3>
                  {post.caption && <p>{post.caption}</p>}

                  {/* Workout Stats Grid - Otimizado para Mobile 2x2 */}
                  <div className={styles.workoutStats}>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>⏱️</span>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Duração</span>
                        <span className={styles.statValue}>
                          {Math.floor(post.duration / 60)} min
                        </span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>💪</span>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Exercícios</span>
                        <span className={styles.statValue}>
                          {post.exercises.length}
                        </span>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🏋️</span>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Volume Total</span>
                        <span className={styles.statValue}>
                          {post.totalVolume.toFixed(0)} kg
                        </span>
                      </div>
                    </div>

                    {post.records && post.records.length > 0 && (
                      <div
                        className={`${styles.statCard} ${styles.recordCard}`}
                      >
                        <span className={styles.statIcon}>🏆</span>
                        <div className={styles.statContent}>
                          <span className={styles.statLabel}>Recordes</span>
                          <span className={styles.statValue}>
                            {post.records.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Exercises Button */}
                  <button
                    className={`${styles.toggleExercisesButton} ${
                      expandedExercises.has(post.id) ? styles.expanded : ""
                    }`}
                    onClick={() => toggleExercises(post.id)}
                  >
                    <span className={styles.toggleIcon}>
                      {expandedExercises.has(post.id) ? "▲" : "▼"}
                    </span>
                    <span className={styles.toggleText}>
                      {expandedExercises.has(post.id)
                        ? "Esconder exercícios"
                        : "Ver exercícios"}
                    </span>
                    <span className={styles.exerciseCounter}>
                      {post.exercises.length}
                    </span>
                  </button>

                  {/* Exercises List */}
                  <div
                    className={`${styles.exercisesList} ${
                      expandedExercises.has(post.id) ? styles.expanded : ""
                    }`}
                  >
                    {post.exercises.map((exercise, idx) => {
                      const exerciseVolume = exercise.sets.reduce(
                        (sum, set) => sum + set.reps * set.weight,
                        0
                      );
                      const avgWeight =
                        exercise.sets.length > 0
                          ? (
                              exercise.sets.reduce(
                                (sum, set) => sum + set.weight,
                                0
                              ) / exercise.sets.length
                            ).toFixed(1)
                          : 0;

                      const hasRecord =
                        post.records &&
                        post.records.some(
                          (r) => r.exerciseName === exercise.name
                        );

                      return (
                        <div
                          key={idx}
                          className={`${styles.exerciseCard} ${
                            hasRecord ? styles.recordExercise : ""
                          }`}
                        >
                          <div className={styles.exerciseHeader}>
                            <h4>
                              {hasRecord && (
                                <span className={styles.recordBadge}>🏆 </span>
                              )}
                              {exercise.name}
                            </h4>
                            <span className={styles.exerciseVolumeBadge}>
                              {exerciseVolume.toFixed(0)} kg
                            </span>
                          </div>

                          <div className={styles.exerciseSummary}>
                            <span className={styles.exerciseStat}>
                              📊 {exercise.sets.length} séries
                            </span>
                            <span className={styles.exerciseStat}>
                              ⚖️ {avgWeight} kg (média)
                            </span>
                          </div>

                          {/* Individual Sets */}
                          <div className={styles.setsList}>
                            {exercise.sets.map((set, setIdx) => (
                              <div key={setIdx} className={styles.setItem}>
                                <span className={styles.setNumber}>
                                  Série {setIdx + 1}
                                </span>
                                <span className={styles.setDetails}>
                                  {set.reps} reps × {set.weight} kg
                                </span>
                                <span className={styles.setVolume}>
                                  {(set.reps * set.weight).toFixed(0)} kg
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Photos */}
                  {post.photos && post.photos.length > 0 && (
                    <div className={styles.photos}>
                      {post.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className={styles.photo}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions - Otimizado para Mobile em linha */}
                <div className={styles.postActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleLike(post.id)}
                    title="Curtir este post"
                  >
                    ❤️ Curtir
                  </button>

                  {post.likesCount > 0 && (
                    <button
                      className={styles.actionButton}
                      onClick={() => handleShowLikes(post.id)}
                      disabled={loadingLikes}
                      title={`Ver ${post.likesCount} curtida(s)`}
                    >
                      ❤️ {post.likesCount}
                    </button>
                  )}

                  <button
                    className={styles.actionButton}
                    onClick={() =>
                      setShowComments(showComments === post.id ? null : post.id)
                    }
                  >
                    💬 {post.commentsCount}
                  </button>

                  <button className={styles.actionButton}>
                    🔗 Compartilhar
                  </button>
                </div>

                {/* CommentsSection */}
                <CommentsSection
                  postId={post.id}
                  isOpen={showComments === post.id}
                  onCommentAdded={() => handleCommentAdded(post.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Confirmação de Delete */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Deletar Post"
        message={`Tem certeza que deseja deletar o post "${postToDelete?.workoutName}"?`}
        details={[
          "Esta ação não pode ser desfeita.",
          "O post será removido permanentemente do grupo.",
        ]}
        confirmText={isDeleting ? "Deletando..." : "Sim, Deletar"}
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
        disabled={isDeleting}
      />

      {/* Modal de Likes */}
      <LikesModal
        isOpen={showLikesModal}
        likes={selectedPostLikes}
        onClose={() => setShowLikesModal(false)}
      />

      {/* Modal de Criar Desafio */}
      {showCreateChallengeModal && (
        <CreateChallengeModal
          groupId={group.id}
          onClose={() => setShowCreateChallengeModal(false)}
          onSubmit={handleCreateChallenge}
        />
      )}

      {/* Modal de Confirmação de Deletar Desafio */}
      <ConfirmationModal
        isOpen={showChallengeDeleteModal}
        title="Deletar Desafio"
        message="Tem certeza que deseja deletar este desafio?"
        details={[
          "Esta ação não pode ser desfeita.",
          "Todos os participantes perderão o progresso.",
        ]}
        confirmText="Sim, Deletar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteChallenge}
        onCancel={() => setShowChallengeDeleteModal(false)}
        type="danger"
      />

      {/* Modal de Perfil Público */}
      {selectedUserId && (
        <UserPublicProfile
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
