// src/hooks/useTags.ts
import { useState, useCallback } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Tag } from "../types/professional";

export function useTags() {
  const { currentUser } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Carregar tags do profissional
  const loadTags = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const tagsRef = collection(db, `professionals/${currentUser.uid}/tags`);
      const snapshot = await getDocs(tagsRef);
      const loadedTags: Tag[] = [];

      snapshot.forEach((doc) => {
        loadedTags.push({ id: doc.id, ...doc.data() } as Tag);
      });

      setTags(loadedTags);
    } catch (err) {
      console.error("Erro ao carregar tags:", err);
      setError("Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ✅ Criar nova tag
  const createTag = useCallback(
    async (
      name: string,
      color: string,
      description?: string
    ): Promise<Tag | null> => {
      if (!currentUser) {
        setError("Você precisa estar logado");
        return null;
      }

      try {
        const now = new Date().toISOString();
        const tagData = {
          name,
          color,
          description: description || "",
          professionalId: currentUser.uid,
          createdAt: now,
          updatedAt: now,
        };

        const tagRef = collection(db, `professionals/${currentUser.uid}/tags`);
        const docRef = await addDoc(tagRef, tagData);

        const newTag: Tag = {
          id: docRef.id,
          ...tagData,
        };

        setTags((prev) => [...prev, newTag]);
        return newTag;
      } catch (err) {
        console.error("Erro ao criar tag:", err);
        setError("Erro ao criar tag");
        return null;
      }
    },
    [currentUser]
  );

  // ✅ Deletar tag
  const deleteTag = useCallback(
    async (tagId: string): Promise<boolean> => {
      if (!currentUser) {
        setError("Você precisa estar logado");
        return false;
      }

      try {
        await deleteDoc(
          doc(db, `professionals/${currentUser.uid}/tags`, tagId)
        );
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
        return true;
      } catch (err) {
        console.error("Erro ao deletar tag:", err);
        setError("Erro ao deletar tag");
        return false;
      }
    },
    [currentUser]
  );

  // ✅ Adicionar tag a um aluno
  const addTagToStudent = useCallback(
    async (studentLinkId: string, tagId: string): Promise<boolean> => {
      if (!currentUser) return false;

      try {
        const linkRef = doc(
          db,
          `professionals/${currentUser.uid}/studentLinks`,
          studentLinkId
        );

        await updateDoc(linkRef, {
          tags: arrayUnion(tagId),
        });

        return true;
      } catch (err) {
        console.error("Erro ao adicionar tag ao aluno:", err);
        return false;
      }
    },
    [currentUser]
  );

  // ✅ Remover tag de um aluno
  const removeTagFromStudent = useCallback(
    async (studentLinkId: string, tagId: string): Promise<boolean> => {
      if (!currentUser) return false;

      try {
        const linkRef = doc(
          db,
          `professionals/${currentUser.uid}/studentLinks`,
          studentLinkId
        );

        await updateDoc(linkRef, {
          tags: arrayRemove(tagId),
        });

        return true;
      } catch (err) {
        console.error("Erro ao remover tag do aluno:", err);
        return false;
      }
    },
    [currentUser]
  );

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    deleteTag,
    addTagToStudent,
    removeTagFromStudent,
  };
}
