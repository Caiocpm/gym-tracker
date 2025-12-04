// src/hooks/useGroups.ts
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  FirestoreError,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { notificationService } from "../services/notificationService";
import type { Group, WorkoutPost, Comment, PostLike, GroupChallenge } from "../types/social";

export function useGroups() {
  const { currentUser } = useAuth();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  //                            LOAD USER'S GROUPS
  // ==========================================================================

  const loadMyGroups = useCallback(async () => {
    if (!currentUser) {
      setMyGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query groups where user is a member
      const groupsRef = collection(db, "groups");
      const q = query(
        groupsRef,
        where("members", "array-contains", currentUser.uid),
        orderBy("updatedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];

      querySnapshot.forEach((docSnapshot) => {
        groups.push({ id: docSnapshot.id, ...docSnapshot.data() } as Group);
      });

      setMyGroups(groups);
    } catch (err) {
      const firestoreError = err as FirestoreError;
      console.error("Error loading groups:", firestoreError);
      setError(firestoreError.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadMyGroups();
  }, [loadMyGroups]);

  // ==========================================================================
  //                            GROUP MANAGEMENT
  // ==========================================================================

  const createGroup = useCallback(
    async (data: {
      name: string;
      description?: string;
      coverPhoto?: string;
      isPrivate: boolean;
    }): Promise<Group | null> => {
      if (!currentUser) {
        setError("You must be logged in to create a group");
        return null;
      }

      try {
        const now = new Date().toISOString();
        const inviteCode = data.isPrivate ? generateInviteCode() : undefined;

        // ✅ Construir objeto sem undefined
        const groupData: Record<string, unknown> = {
          name: data.name,
          description: data.description || "",
          createdBy: currentUser.uid,
          createdAt: now,
          updatedAt: now,
          isPrivate: data.isPrivate,
          members: [currentUser.uid],
          admins: [currentUser.uid],
          membersCount: 1,
          postsCount: 0,
          weeklyActiveMembers: 1,
        };

        // ✅ Adicionar coverPhoto APENAS se houver valor
        if (data.coverPhoto) {
          groupData.coverPhoto = data.coverPhoto;
        }

        // ✅ Adicionar inviteCode APENAS se for grupo privado
        if (inviteCode) {
          groupData.inviteCode = inviteCode;
        }

        const docRef = await addDoc(collection(db, "groups"), groupData);

        // Add member document
        await addDoc(collection(db, "groupMembers"), {
          groupId: docRef.id,
          userId: currentUser.uid,
          role: "admin",
          joinedAt: now,
          lastActiveAt: now,
        });

        const newGroup: Group = {
          id: docRef.id,
          ...groupData,
        } as Group;

        setMyGroups((prev) => [newGroup, ...prev]);
        return newGroup;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error creating group:", firestoreError);
        setError(firestoreError.message);
        return null;
      }
    },
    [currentUser]
  );

  const joinGroup = useCallback(
    async (inviteCode: string): Promise<boolean> => {
      if (!currentUser) {
        setError("You must be logged in to join a group");
        return false;
      }

      try {
        // Find group by invite code
        const groupsRef = collection(db, "groups");
        const q = query(
          groupsRef,
          where("inviteCode", "==", inviteCode),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid invite code");
          return false;
        }

        const groupDoc = querySnapshot.docs[0];
        const groupData = groupDoc.data() as Group & { members?: string[] };

        // Check if already a member
        if (groupData.members?.includes(currentUser.uid)) {
          setError("You are already a member of this group");
          return false;
        }

        const now = new Date().toISOString();

        // Add user to members array
        await updateDoc(doc(db, "groups", groupDoc.id), {
          members: arrayUnion(currentUser.uid),
          membersCount: increment(1),
          updatedAt: now,
        });

        // Add member document
        await addDoc(collection(db, "groupMembers"), {
          groupId: groupDoc.id,
          userId: currentUser.uid,
          role: "member",
          joinedAt: now,
          lastActiveAt: now,
        });

        // Reload groups
        await loadMyGroups();
        return true;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error joining group:", firestoreError);
        setError(firestoreError.message);
        return false;
      }
    },
    [currentUser, loadMyGroups]
  );

  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!currentUser) {
        setError("You must be logged in");
        return false;
      }

      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          setError("Group not found");
          return false;
        }

        const groupData = groupSnap.data() as Group & {
          members?: string[];
          admins?: string[];
        };

        // Check if user is the only admin
        if (
          groupData.admins?.includes(currentUser.uid) &&
          groupData.admins.length === 1 &&
          groupData.membersCount > 1
        ) {
          setError("You must assign another admin before leaving");
          return false;
        }

        const now = new Date().toISOString();

        // Remove from members and admins arrays
        await updateDoc(groupRef, {
          members: arrayRemove(currentUser.uid),
          admins: arrayRemove(currentUser.uid),
          membersCount: increment(-1),
          updatedAt: now,
        });

        // Delete member document
        const membersRef = collection(db, "groupMembers");
        const q = query(
          membersRef,
          where("groupId", "==", groupId),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(docSnapshot.ref);
        });

        // Reload groups
        await loadMyGroups();
        return true;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error leaving group:", firestoreError);
        setError(firestoreError.message);
        return false;
      }
    },
    [currentUser, loadMyGroups]
  );

  // ✅ NOVA FUNÇÃO: DELETE GROUP
  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!currentUser) {
        setError("You must be logged in");
        return false;
      }

      try {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (!groupDoc.exists()) {
          setError("Group not found");
          return false;
        }

        const groupData = groupDoc.data() as Group;

        // Verificar se o usuário é o criador
        if (groupData.createdBy !== currentUser.uid) {
          setError("Only the group creator can delete the group");
          return false;
        }

        // Deletar todos os posts do grupo
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("groupId", "==", groupId));
        const postsSnapshot = await getDocs(postsQuery);

        for (const post of postsSnapshot.docs) {
          // Deletar likes do post
          const likesRef = collection(db, "postLikes");
          const likesQuery = query(likesRef, where("postId", "==", post.id));
          const likesSnapshot = await getDocs(likesQuery);
          for (const like of likesSnapshot.docs) {
            await deleteDoc(like.ref);
          }

          // Deletar comentários do post
          const commentsRef = collection(db, "postComments");
          const commentsQuery = query(
            commentsRef,
            where("postId", "==", post.id)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          for (const comment of commentsSnapshot.docs) {
            await deleteDoc(comment.ref);
          }

          // Deletar o post
          await deleteDoc(post.ref);
        }

        // Deletar todos os membros do grupo
        const membersRef = collection(db, "groupMembers");
        const membersQuery = query(membersRef, where("groupId", "==", groupId));
        const membersSnapshot = await getDocs(membersQuery);

        for (const member of membersSnapshot.docs) {
          await deleteDoc(member.ref);
        }

        // Deletar o grupo
        await deleteDoc(groupRef);

        // Atualizar lista local
        setMyGroups((prev) => prev.filter((g) => g.id !== groupId));

        console.log("✅ Grupo deletado com sucesso!");
        return true;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("❌ Erro ao deletar grupo:", firestoreError);
        setError(firestoreError.message);
        return false;
      }
    },
    [currentUser]
  );

  // ==========================================================================
  //                            POSTS
  // ==========================================================================

  const createPost = useCallback(
    async (
      groupId: string,
      postData: Omit<WorkoutPost, "id" | "userId" | "createdAt" | "updatedAt">
    ): Promise<WorkoutPost | null> => {
      if (!currentUser) {
        setError("You must be logged in");
        return null;
      }

      try {
        const now = new Date().toISOString();

        const post = {
          ...postData,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Usuário",
          userPhotoURL: currentUser.photoURL || undefined,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await addDoc(collection(db, "posts"), post);

        // Update group post count
        await updateDoc(doc(db, "groups", groupId), {
          postsCount: increment(1),
          updatedAt: now,
        });

        // ✅ Atualizar desafios automaticamente
        await updateChallengesFromWorkout(groupId, currentUser.uid, postData);

        return {
          id: docRef.id,
          ...post,
        };
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error creating post:", firestoreError);
        setError(firestoreError.message);
        return null;
      }
    },
    [currentUser]
  );

  const getGroupPosts = useCallback(
    async (
      groupId: string,
      limitCount: number = 20
    ): Promise<WorkoutPost[]> => {
      try {
        const postsRef = collection(db, "posts");
        const q = query(
          postsRef,
          where("groupId", "==", groupId),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const posts: WorkoutPost[] = [];

        querySnapshot.forEach((docSnapshot) => {
          posts.push({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as WorkoutPost);
        });

        return posts;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error getting posts:", firestoreError);
        setError(firestoreError.message);
        return [];
      }
    },
    []
  );

  const deletePost = useCallback(
    async (postId: string, groupId: string): Promise<boolean> => {
      if (!currentUser) {
        setError("You must be logged in");
        return false;
      }

      try {
        await deleteDoc(doc(db, "posts", postId));

        // Update group post count
        await updateDoc(doc(db, "groups", groupId), {
          postsCount: increment(-1),
          updatedAt: new Date().toISOString(),
        });

        return true;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error deleting post:", firestoreError);
        setError(firestoreError.message);
        return false;
      }
    },
    [currentUser]
  );

  // ==========================================================================
  //                            LIKES
  // ==========================================================================

  const likePost = useCallback(
    async (postId: string): Promise<{ success: boolean; added: boolean }> => {
      if (!currentUser) {
        setError("You must be logged in");
        return { success: false, added: false };
      }

      try {
        // Check if already liked
        const likesRef = collection(db, "postLikes");
        const q = query(
          likesRef,
          where("postId", "==", postId),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Already liked, remove like
          await deleteDoc(querySnapshot.docs[0].ref);
          await updateDoc(doc(db, "posts", postId), {
            likesCount: increment(-1),
          });
          return { success: true, added: false };
        } else {
          // Add like
          await addDoc(collection(db, "postLikes"), {
            postId,
            userId: currentUser.uid,
            createdAt: new Date().toISOString(),
          });
          await updateDoc(doc(db, "posts", postId), {
            likesCount: increment(1),
          });

          // ✅ Criar notificação para o autor do post
          try {
            const postDoc = await getDoc(doc(db, "posts", postId));
            if (postDoc.exists()) {
              const postData = postDoc.data();
              const postAuthorId = postData.userId;
              const groupId = postData.groupId;

              // Buscar nome do usuário que curtiu
              const userDoc = await getDoc(doc(db, "users", currentUser.uid));
              const userName = userDoc.exists()
                ? userDoc.data()?.displayName || "Alguém"
                : "Alguém";

              await notificationService.createPostLikeNotification(
                postId,
                postAuthorId,
                currentUser.uid,
                userName,
                groupId
              );
            }
          } catch (notifError) {
            console.warn("Erro ao criar notificação de like:", notifError);
            // Não falhar a operação de like por causa da notificação
          }

          return { success: true, added: true };
        }
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("Error liking post:", firestoreError);
        setError(firestoreError.message);
        return { success: false, added: false };
      }
    },
    [currentUser]
  );

  // ✅ ATUALIZAR: Obter likes de um post com detalhes do usuário
  const getPostLikes = useCallback(
    async (postId: string): Promise<PostLike[]> => {
      try {
        console.log("📤 Buscando likes para post:", postId);

        const likesRef = collection(db, "postLikes");
        const q = query(likesRef, where("postId", "==", postId));

        const querySnapshot = await getDocs(q);
        console.log("📦 Total de likes encontrados:", querySnapshot.size);

        const likes: PostLike[] = [];

        // ✅ Buscar informações de cada usuário que curtiu
        for (const likeDoc of querySnapshot.docs) {
          const likeData = likeDoc.data();
          console.log("❤️ Like encontrado:", likeData);

          try {
            // Buscar documento do usuário na coleção 'users'
            const userDocRef = doc(db, "users", likeData.userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              console.log("👤 Dados do usuário encontrados:", userData);

              likes.push({
                userId: likeData.userId,
                userName: userData?.displayName || "Usuário Desconhecido",
                userAvatar: userData?.photoURL,
                createdAt: likeData.createdAt,
              });
            } else {
              console.warn(
                "⚠️ Documento de usuário não encontrado para:",
                likeData.userId
              );
              // Adicionar com dados mínimos
              likes.push({
                userId: likeData.userId,
                userName: "Usuário Desconhecido",
                userAvatar: undefined,
                createdAt: likeData.createdAt,
              });
            }
          } catch (userError) {
            console.error(
              "❌ Erro ao buscar dados do usuário:",
              likeData.userId,
              userError
            );
            // Adicionar like mesmo que não consiga buscar dados do usuário
            likes.push({
              userId: likeData.userId,
              userName: "Usuário Desconhecido",
              userAvatar: undefined,
              createdAt: likeData.createdAt,
            });
          }
        }

        // ✅ Ordenar por data decrescente (mais recentes primeiro)
        const sortedLikes = likes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log("✅ Likes processados:", sortedLikes);
        return sortedLikes;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("❌ Erro ao obter likes:", firestoreError);
        return [];
      }
    },
    []
  );

  // ==========================================================================
  //                            COMMENTS
  // ==========================================================================

  const addComment = useCallback(
    async (postId: string, text: string): Promise<Comment | null> => {
      if (!currentUser) {
        setError("You must be logged in");
        return null;
      }

      try {
        const now = new Date().toISOString();

        console.log("📤 Criando comentário para post:", postId);
        console.log("📝 Texto:", text);
        console.log("👤 User ID:", currentUser.uid);

        const commentData: Omit<Comment, "id"> = {
          postId,
          userId: currentUser.uid,
          text,
          createdAt: now,
          likesCount: 0,
          repliesCount: 0,
        };

        console.log("💾 Dados do comentário:", commentData);

        // ✅ Adicionar comentário na coleção 'postComments'
        const docRef = await addDoc(collection(db, "postComments"), commentData);
        console.log("✅ Comentário criado com ID:", docRef.id);

        // Update post comment count
        await updateDoc(doc(db, "posts", postId), {
          commentsCount: increment(1),
        });
        console.log("✅ Contador de comentários atualizado");

        // ✅ Criar notificação para o autor do post
        try {
          const postDoc = await getDoc(doc(db, "posts", postId));
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const postAuthorId = postData.userId;
            const groupId = postData.groupId;

            // Buscar nome do usuário que comentou
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const userName = userDoc.exists()
              ? userDoc.data()?.displayName || "Alguém"
              : "Alguém";

            await notificationService.createPostCommentNotification(
              postId,
              docRef.id,
              postAuthorId,
              currentUser.uid,
              userName,
              text,
              groupId
            );
          }
        } catch (notifError) {
          console.warn("Erro ao criar notificação de comentário:", notifError);
          // Não falhar a operação de comentário por causa da notificação
        }

        return {
          id: docRef.id,
          ...commentData,
        };
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("❌ Erro ao adicionar comentário:", firestoreError);
        setError(firestoreError.message);
        return null;
      }
    },
    [currentUser]
  );

  const getPostComments = useCallback(
    async (postId: string): Promise<Comment[]> => {
      try {
        console.log("💬 Buscando comentários para post:", postId);

        const commentsRef = collection(db, "postComments");
        const q = query(
          commentsRef,
          where("postId", "==", postId),
          orderBy("createdAt", "asc")
        );

        const querySnapshot = await getDocs(q);
        console.log("📦 Total de comentários encontrados:", querySnapshot.size);

        const comments: Comment[] = [];

        // ✅ Buscar informações de cada usuário que comentou
        for (const commentDoc of querySnapshot.docs) {
          const commentData = commentDoc.data();
          console.log("💬 Comentário encontrado:", commentData);

          try {
            // Buscar documento do usuário
            const userDocRef = doc(db, "users", commentData.userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              console.log("👤 Dados do usuário encontrados:", userData);

              comments.push({
                id: commentDoc.id,
                postId: commentData.postId,
                userId: commentData.userId,
                userName: userData?.displayName || "Usuário Desconhecido",
                userAvatar: userData?.photoURL,
                text: commentData.text,
                createdAt: commentData.createdAt,
                likesCount: commentData.likesCount || 0,
                repliesCount: commentData.repliesCount || 0,
              });
            } else {
              console.warn(
                "⚠️ Documento de usuário não encontrado para:",
                commentData.userId
              );
              comments.push({
                id: commentDoc.id,
                postId: commentData.postId,
                userId: commentData.userId,
                userName: "Usuário Desconhecido",
                userAvatar: undefined,
                text: commentData.text,
                createdAt: commentData.createdAt,
                likesCount: commentData.likesCount || 0,
                repliesCount: commentData.repliesCount || 0,
              });
            }
          } catch (userError) {
            console.error(
              "❌ Erro ao buscar dados do usuário:",
              commentData.userId,
              userError
            );
            comments.push({
              id: commentDoc.id,
              postId: commentData.postId,
              userId: commentData.userId,
              userName: "Usuário Desconhecido",
              userAvatar: undefined,
              text: commentData.text,
              createdAt: commentData.createdAt,
              likesCount: commentData.likesCount || 0,
              repliesCount: commentData.repliesCount || 0,
            });
          }
        }

        console.log("✅ Comentários processados:", comments);
        return comments;
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error("❌ Erro ao obter comentários:", firestoreError);
        return [];
      }
    },
    []
  );

  return {
    // State
    myGroups,
    loading,
    error,

    // Group management
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup, // ✅ ADICIONADO
    loadMyGroups,

    // Posts
    createPost,
    getGroupPosts,
    deletePost,

    // Interactions
    likePost,
    getPostLikes,
    addComment,
    getPostComments,
  };
}

// ============================================================================
//                          HELPER FUNCTIONS
// ============================================================================

/**
 * Gera um código de convite aleatório com 8 caracteres
 * @returns Código de convite (ex: "ABC12XYZ")
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * ✅ Atualiza automaticamente o progresso dos desafios ativos quando um treino é compartilhado
 */
async function updateChallengesFromWorkout(
  groupId: string,
  userId: string,
  workoutData: Omit<WorkoutPost, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<void> {
  try {
    // 1. Buscar todos os desafios ativos do grupo
    const challengesQuery = query(
      collection(db, "groupChallenges"),
      where("groupId", "==", groupId),
      where("status", "==", "active")
    );

    const challengesSnapshot = await getDocs(challengesQuery);

    if (challengesSnapshot.empty) {
      console.log("📊 Nenhum desafio ativo encontrado para atualizar");
      return;
    }

    // 2. Calcular métricas do treino compartilhado
    const workoutMetrics = calculateWorkoutMetrics(workoutData);

    console.log(`🎯 Atualizando ${challengesSnapshot.size} desafios ativos...`);
    console.log("📊 Métricas do treino:", workoutMetrics);

    // 3. Atualizar cada desafio relevante
    const updates: Promise<void>[] = [];

    challengesSnapshot.forEach((challengeDoc) => {
      const challengeData = challengeDoc.data();
      const challengeId = challengeDoc.id;

      // Converter DocumentData para GroupChallenge
      const challenge: GroupChallenge = {
        id: challengeId,
        ...challengeData,
      } as GroupChallenge;

      // Verificar se o usuário está participando
      const participantIndex = challenge.participants?.findIndex(
        (p) => p.userId === userId
      );

      if (participantIndex === -1 || participantIndex === undefined) {
        console.log(`⏭️ Usuário não participa do desafio ${challenge.title}`);
        return;
      }

      // Calcular novo progresso baseado no tipo de desafio
      const currentProgress = challenge.participants[participantIndex].progress || 0;
      let newProgress = currentProgress;

      switch (challenge.type) {
        case "volume": {
          // Adicionar volume total do treino
          newProgress = currentProgress + workoutMetrics.totalVolume;
          console.log(`📈 Volume: ${currentProgress} → ${newProgress} kg`);
          break;
        }

        case "consistency": {
          // Incrementar apenas se for um dia diferente do último treino
          const lastUpdate = challenge.participants[participantIndex].lastUpdate;
          const today = new Date().toISOString().split("T")[0];
          const lastDay = lastUpdate ? new Date(lastUpdate).toISOString().split("T")[0] : null;

          if (today !== lastDay) {
            newProgress = currentProgress + 1;
            console.log(`📅 Consistência: ${currentProgress} → ${newProgress} dias`);
          }
          break;
        }

        case "records": {
          // Contar recordes batidos no treino
          newProgress = currentProgress + workoutMetrics.personalRecords;
          if (workoutMetrics.personalRecords > 0) {
            console.log(`🏆 Recordes: ${currentProgress} → ${newProgress}`);
          }
          break;
        }

        case "exercise": {
          // Verificar se o treino contém o exercício específico
          // Usar exerciseName como chave ao invés de exerciseId
          if (challenge.exerciseName && workoutMetrics.exerciseMaxWeights[challenge.exerciseName]) {
            const exerciseMax = workoutMetrics.exerciseMaxWeights[challenge.exerciseName];
            if (exerciseMax > currentProgress) {
              newProgress = exerciseMax;
              console.log(`💪 Exercício ${challenge.exerciseName}: ${currentProgress} → ${newProgress} kg`);
            }
          }
          break;
        }

        case "collaborative": {
          // Para desafios colaborativos, atualizar progresso individual
          newProgress = currentProgress + workoutMetrics.totalVolume;
          console.log(`👥 Colaborativo (individual): ${currentProgress} → ${newProgress} kg`);
          break;
        }
      }

      // Se houve mudança, atualizar o desafio
      if (newProgress !== currentProgress) {
        const updatePromise = updateChallengeProgress(
          challengeId,
          userId,
          newProgress,
          challenge
        );
        updates.push(updatePromise);
      }
    });

    // Executar todas as atualizações em paralelo
    await Promise.all(updates);

    console.log(`✅ ${updates.length} desafios atualizados com sucesso!`);
  } catch (error) {
    console.error("❌ Erro ao atualizar desafios:", error);
  }
}

/**
 * ✅ Calcular métricas do treino para atualização de desafios
 */
function calculateWorkoutMetrics(workoutData: Omit<WorkoutPost, "id" | "userId" | "createdAt" | "updatedAt">) {
  let totalVolume = 0;
  let personalRecords = 0;
  const exerciseMaxWeights: Record<string, number> = {};

  // Usar o campo 'records' do WorkoutPost para contar recordes
  personalRecords = workoutData.records?.length || 0;

  workoutData.exercises.forEach((exercise) => {
    let exerciseMaxWeight = 0;

    exercise.sets.forEach((set) => {
      // Volume
      const setVolume = set.weight * set.reps;
      totalVolume += setVolume;

      // Peso máximo por exercício
      if (set.weight > exerciseMaxWeight) {
        exerciseMaxWeight = set.weight;
      }
    });

    // Guardar peso máximo do exercício (usando nome do exercício como chave)
    exerciseMaxWeights[exercise.name] = Math.max(
      exerciseMaxWeights[exercise.name] || 0,
      exerciseMaxWeight
    );
  });

  return {
    totalVolume,
    personalRecords,
    exerciseMaxWeights,
  };
}

/**
 * ✅ Atualizar progresso de um participante no desafio
 */
async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  newProgress: number,
  challengeData: GroupChallenge
): Promise<void> {
  try {
    const challengeRef = doc(db, "groupChallenges", challengeId);

    // Verificar se o usuário está completando o desafio agora
    const participant = challengeData.participants.find((p) => p.userId === userId);
    const wasCompleted = participant?.completedAt !== undefined;
    const isNowCompleted = newProgress >= challengeData.targetValue;
    const justCompleted = !wasCompleted && isNowCompleted;

    // Atualizar participantes
    const updatedParticipants = challengeData.participants.map((p) => {
      if (p.userId === userId) {
        return {
          ...p,
          progress: newProgress,
          lastUpdate: new Date().toISOString(),
          completedAt: isNowCompleted && !wasCompleted ? new Date().toISOString() : p.completedAt,
        };
      }
      return p;
    });

    // Contar quantos completaram
    const completedCount = updatedParticipants.filter((p) => p.completedAt).length;

    // Atualizar ranks para desafios competitivos
    if (challengeData.isCompetitive) {
      const sorted = [...updatedParticipants].sort((a, b) => b.progress - a.progress);
      sorted.forEach((p, index) => {
        p.rank = index + 1;
      });
    }

    // Preparar dados de atualização
    const updateData: Record<string, unknown> = {
      participants: updatedParticipants,
      completedCount,
      updatedAt: new Date().toISOString(),
    };

    // Para desafios colaborativos, atualizar progresso coletivo
    if (challengeData.type === "collaborative") {
      const collectiveProgress = updatedParticipants.reduce(
        (sum, p) => sum + (p.progress || 0),
        0
      );
      updateData.collectiveProgress = collectiveProgress;
    }

    await updateDoc(challengeRef, updateData);

    console.log(`✅ Desafio "${challengeData.title}" atualizado para usuário ${userId}`);

    // ✅ Se o usuário acabou de completar, conceder badge
    if (justCompleted && challengeData.reward) {
      console.log(`🎉 Usuário ${userId} completou o desafio! Concedendo badge...`);
      await grantBadgeForChallenge(userId, challengeData);
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar desafio ${challengeId}:`, error);
  }
}

/**
 * ✅ Conceder badge ao completar desafio
 */
async function grantBadgeForChallenge(
  userId: string,
  challenge: GroupChallenge
): Promise<void> {
  try {
    // Verificar se já tem o badge deste desafio
    const existingBadgeQuery = query(
      collection(db, "userBadges"),
      where("userId", "==", userId),
      where("challengeId", "==", challenge.id)
    );

    const existingBadges = await getDocs(existingBadgeQuery);

    if (!existingBadges.empty) {
      console.log("⚠️ Badge já concedido para este desafio");
      return;
    }

    // Mapear tipo de desafio para categoria de badge
    const categoryMap: Record<string, string> = {
      volume: "volume",
      consistency: "consistency",
      records: "records",
      exercise: "exercise",
      collaborative: "collaborative",
    };

    // Determinar raridade baseado no valor alvo
    let badgeRarity = "common";
    if (challenge.targetValue >= 10000) {
      badgeRarity = "legendary";
    } else if (challenge.targetValue >= 5000) {
      badgeRarity = "epic";
    } else if (challenge.targetValue >= 2000) {
      badgeRarity = "rare";
    }

    const badgeCategory = categoryMap[challenge.type] || "special";

    // Criar badge
    const badgeData = {
      userId,
      badgeId: `badge_${Date.now()}`,
      badgeName: challenge.title,
      badgeIcon: getBadgeIcon(challenge.type),
      badgeCategory,
      badgeRarity,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      earnedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "userBadges"), badgeData);

    console.log(`🏆 Badge "${challenge.title}" concedido ao usuário ${userId}!`);
  } catch (error) {
    console.error("❌ Erro ao conceder badge:", error);
  }
}

/**
 * ✅ Obter ícone do badge baseado no tipo
 */
function getBadgeIcon(challengeType: string): string {
  const iconMap: Record<string, string> = {
    volume: "💪",
    consistency: "🔥",
    records: "🏆",
    exercise: "🎯",
    collaborative: "👥",
  };
  return iconMap[challengeType] || "⭐";
}
