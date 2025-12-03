import { useState } from "react";
import type { StudentNote } from "../types/professional";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const NOTES_COLLECTION = "student_notes";

export function useStudentNotes() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Carregar notas - AGORA COM PARÂMETRO OPCIONAL
  const loadStudentNotes = async (studentLinkId?: string) => {
    try {
      setLoading(true);
      const notesRef = collection(db, NOTES_COLLECTION);
      let q;

      // ✅ Se não houver studentLinkId, carrega TODAS as notas
      if (studentLinkId) {
        q = query(notesRef, where("studentLinkId", "==", studentLinkId));
      } else {
        q = query(notesRef);
      }

      const snapshot = await getDocs(q);
      const notesData = snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<StudentNote, "id">),
        id: doc.id,
      }));

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
      const notesRef = collection(db, NOTES_COLLECTION);

      const newNote = {
        studentLinkId,
        professionalId,
        title: title || "",
        content,
        category,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Criando nota:", newNote);

      const docRef = await addDoc(notesRef, newNote);
      setNotes([...notes, { ...newNote, id: docRef.id }]);
      setError(null);
      return docRef.id;
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
      const noteRef = doc(db, NOTES_COLLECTION, noteId);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(noteRef, updateData);

      setNotes(
        notes.map((n) => (n.id === noteId ? { ...n, ...updateData } : n))
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
      const noteRef = doc(db, NOTES_COLLECTION, noteId);

      await deleteDoc(noteRef);

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
