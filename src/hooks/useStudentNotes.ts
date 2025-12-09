import { useState } from "react";
import type { StudentNote } from "../types/professional";
import { professionalApi } from "../services/professionalApi";

export function useStudentNotes() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Carregar notas - AGORA COM PARÂMETRO OPCIONAL
  const loadStudentNotes = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const notesData = await professionalApi.notes.list({ studentLinkId });
      setNotes(notesData);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao carregar notas:", err);
      setError("Erro ao carregar notas");
    } finally {
      setLoading(false);
    }
  };

  // Criar nota
  const createNote = async (
    studentLinkId: string,
    professionalId: string,
    title: string,
    content: string,
    category: StudentNote["category"],
    tags: string[]
  ): Promise<string> => {
    try {
      setLoading(true);
      console.log("📝 Criando nota via API");

      const newNote = await professionalApi.notes.create({
        studentLinkId,
        professionalId,
        title: title || "",
        content,
        category,
        tags,
      });

      setNotes([...notes, newNote]);
      setError(null);
      return newNote.id;
    } catch (err) {
      console.error("❌ Erro ao criar nota:", err);
      setError("Erro ao criar nota");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar nota
  const updateNote = async (noteId: string, updates: Partial<StudentNote>) => {
    try {
      setLoading(true);
      const updatedNote = await professionalApi.notes.update(noteId, updates);

      setNotes(
        notes.map((n) => (n.id === noteId ? updatedNote : n))
      );

      setError(null);
    } catch (err) {
      console.error("❌ Erro ao atualizar nota:", err);
      setError("Erro ao atualizar nota");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar nota
  const deleteNote = async (noteId: string) => {
    try {
      setLoading(true);
      await professionalApi.notes.delete(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao deletar nota:", err);
      setError("Erro ao deletar nota");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    notes,
    loading,
    error,
    loadStudentNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
