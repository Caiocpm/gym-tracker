// src/hooks/useTags.ts
import { useState, useCallback } from "react";
import { professionalApi } from "../services/professionalApi";
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
      const loadedTags = await professionalApi.tags.list(currentUser.uid);
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
        const newTag = await professionalApi.tags.create({
          professionalId: currentUser.uid,
          name,
          color,
          description,
        });

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
        await professionalApi.tags.delete(tagId);
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
        await professionalApi.tags.addToStudent(studentLinkId, tagId);
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
        await professionalApi.tags.removeFromStudent(studentLinkId, tagId);
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
