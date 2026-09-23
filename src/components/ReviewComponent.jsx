import React, { useEffect, useState } from "react";

import { fetchAttemptDetail } from "../services/api";
import AttemptReview from "./AttemptReview";

const DIFFICULTY_LABELS = { 1: "Débutant", 2: "Intermédiaire", 3: "Avancé" };

/**
 * Relecture détaillée d'une tentative : score, puis questions, réponse donnée
 * vs bonne réponse et explication (voir AttemptReview).
 *
 * Props :
 *  - attemptId?: string        // si fourni, le détail est chargé depuis l'API
 *  - result?: QuizResult       // sinon, un résultat déjà en mémoire (juste après soumission) peut être passé directement
 *  - onBack: () => void
 *  - backLabel?: string        // texte du bouton de retour
 */
export default function ReviewComponent({
  attemptId,
  result: initialResult,
  onBack,
  backLabel = "Retour à l'accueil",
}) {
  const [result, setResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialResult || !attemptId) return;
    setLoading(true);
    fetchAttemptDetail(attemptId)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId, initialResult]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-400">Chargement de la relecture…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-rose-900 bg-rose-950/40 p-6 text-center">
        <p className="text-rose-300">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!result) return null;

  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* En-tête score */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          Niveau {DIFFICULTY_LABELS[result.difficulty]} -{" "}
          {new Date(result.timestamp).toLocaleDateString("fr-FR")}
        </p>
        <p className="mt-2 text-4xl font-bold text-amber-400">
          {result.score} / {result.totalQuestions}
        </p>
        <p className="mt-1 text-zinc-400">{percentage}% de bonnes réponses</p>
      </div>

      <AttemptReview details={result.details} />

      <button
        onClick={onBack}
        className="mt-8 mb-[5rem] rounded-lg cursor-pointer border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        {backLabel}
      </button>
    </div>
  );
}
