// src/components/Groups/CommentsSection/CommentsSection.tsx
import { useState, useEffect, useCallback } from "react";
import { useGroups } from "../../../hooks/useGroups";
import type { Comment } from "../../../types/social";
import styles from "./CommentsSection.module.css";

interface CommentsSectionProps {
  postId: string;
  isOpen: boolean;
  onCommentAdded: () => void;
}

export function CommentsSection({
  postId,
  isOpen,
  onCommentAdded,
}: CommentsSectionProps) {
  const { getPostComments, addComment } = useGroups();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CORRIGIDO: useCallback para memoizar loadComments
  const loadComments = useCallback(async () => {
    console.log("📥 Carregando comentários para post:", postId);
    setLoading(true);
    try {
      const fetchedComments = await getPostComments(postId);
      console.log("✅ Comentários carregados:", fetchedComments);
      console.log("📊 Total de comentários:", fetchedComments.length);
      setComments(fetchedComments);
    } catch (error) {
      console.error("❌ Erro ao carregar comentários:", error);
    } finally {
      setLoading(false);
    }
  }, [postId, getPostComments]);

  // ✅ CORRIGIDO: Carregar comentários quando abrir
  useEffect(() => {
    if (isOpen) {
      console.log("🎯 CommentsSection aberto, carregando comentários");
      loadComments();
    }
  }, [isOpen, loadComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("📤 Adicionando comentário:", commentText);
      await addComment(postId, commentText);
      console.log("✅ Comentário adicionado com sucesso!");

      setCommentText("");
      await loadComments(); // Recarregar comentários
      onCommentAdded();
    } catch (error) {
      console.error("❌ Erro ao adicionar comentário:", error);
      alert("Erro ao adicionar comentário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.commentsSection}>
      {/* Formulário de novo comentário */}
      <form onSubmit={handleAddComment} className={styles.addCommentForm}>
        <input
          type="text"
          placeholder="Adicione um comentário..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={isSubmitting || !commentText.trim()}
          className={styles.submitButton}
        >
          {isSubmitting ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {/* Lista de comentários */}
      <div className={styles.commentsList}>
        {loading ? (
          <div className={styles.loading}>Carregando comentários...</div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => {
            console.log("🎯 Renderizando comentário:", comment);

            return (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.avatarContainer}>
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName}
                      className={styles.avatar}
                      onError={(e) => {
                        console.warn(
                          "⚠️ Erro ao carregar avatar para:",
                          comment.userName
                        );
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className={styles.avatarInitial}>
                      {comment.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <div className={styles.userName}>
                      {comment.userName || "Usuário Desconhecido"}
                    </div>
                    <div className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
