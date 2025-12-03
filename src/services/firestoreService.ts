import { db } from "../config/firebase";
import type { DocumentData } from "firebase/firestore";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
} from "firebase/firestore";

// CRUD genérico para Firestore
export const firestoreService = {
  // Criar documento
  async create<T extends DocumentData>(
    collectionName: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const ref = collection(db, collectionName);
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Erro ao criar documento em ${collectionName}:`, error);
      throw error;
    }
  },

  // Ler documento
  async read<T extends DocumentData>(
    collectionName: string,
    docId: string
  ): Promise<(T & { id: string }) | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          ...(docSnap.data() as T),
          id: docSnap.id,
        } as T & { id: string };
      }
      return null;
    } catch (error) {
      console.error(`Erro ao ler documento de ${collectionName}:`, error);
      throw error;
    }
  },

  // Ler todos os documentos
  async readAll<T extends DocumentData>(
    collectionName: string
  ): Promise<(T & { id: string })[]> {
    try {
      const ref = collection(db, collectionName);
      const q = query(ref);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
    } catch (error) {
      console.error(`Erro ao ler documentos de ${collectionName}:`, error);
      throw error;
    }
  },

  // Atualizar documento
  async update<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${collectionName}:`, error);
      throw error;
    }
  },

  // Deletar documento
  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erro ao deletar documento de ${collectionName}:`, error);
      throw error;
    }
  },
};
