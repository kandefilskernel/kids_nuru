"use server";

import { isAdmin } from "@/lib/auth";
import { answerQuestion, loadCorpus, modelChunks, type Answer } from "@/lib/rag";
import { loadModel } from "./data";

export type AskState = { answer?: Answer; question?: string; error?: string };

/** Pose une question à l'assistant du modèle économique (réservé à l'équipe). */
export async function askModelAction(_prev: AskState, f: FormData): Promise<AskState> {
  if (!(await isAdmin())) return { error: "Accès refusé." };
  const question = String(f.get("question") ?? "").trim().slice(0, 500);
  if (question.length < 3) return { error: "Écrivez une question (3 caractères minimum)." };
  try {
    const [m, docs] = await Promise.all([loadModel(), loadCorpus()]);
    const answer = await answerQuestion(question, [...modelChunks(m), ...docs]);
    return { answer, question };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inconnue.", question };
  }
}
