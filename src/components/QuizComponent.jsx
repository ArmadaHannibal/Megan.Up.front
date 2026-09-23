import React, { useEffect, useState } from "react";
import { fetchRandomQuestions, submitQuiz } from "../services/api";
import { Chip } from "@heroui/react";
import { GiSprout } from "react-icons/gi";
import { BiSolidZap } from "react-icons/bi";
import { GiLaurelsTrophy } from "react-icons/gi";

const DIFFICULTY_LABELS = { 1: "Débutant", 2: "Intermédiaire", 3: "Avancé" };

/**
 * Fait passer un QCM à l'utilisateur puis remonte le résultat au parent.
 * L'utilisateur est identifié côté serveur via le jeton : plus de prop userId.
 *
 * Props :
 *  - difficulty: 1 | 2 | 3
 *  - questionCount: number
 *  - onFinished: (result) => void   // result = réponse de POST /api/quiz/submit
 *  - onCancel: () => void
 *  - onAuthExpired?: () => void
 */
export default function QuizComponent({
  difficulty,
  questionCount = 10,
  onFinished,
  onCancel,
  onAuthExpired,
}) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    console.log("Difficulté sélectionnée :", difficulty);
    fetchRandomQuestions(difficulty, questionCount)
      .then((data) => {
        if (!cancelled) setQuestions(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401 && onAuthExpired) onAuthExpired();
        else setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [difficulty, questionCount, onAuthExpired]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent =
    currentQuestion && answers[currentQuestion.id] !== undefined;

  function selectOption(optionIndex) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  }

  async function handleNextOrSubmit() {
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        difficulty,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionIndex: answers[q.id],
        })),
      };
      const result = await submitQuiz(payload);
      onFinished(result);
    } catch (err) {
      if (err.status === 401 && onAuthExpired) onAuthExpired();
      else setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-400">Chargement des questions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-rose-900 bg-rose-950/40 p-6 text-center">
        <p className="text-rose-300">{error}</p>
        <button
          onClick={onCancel}
          className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progression */}
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-400">
        <span>
          Question {currentIndex + 1} / {questions.length}
        </span>
        <Chip color="warning">
          {DIFFICULTY_LABELS[difficulty] === "Avancé"
            ? <GiLaurelsTrophy width={12} />
            : DIFFICULTY_LABELS[difficulty] === "Intermédiaire"
              ? <BiSolidZap width={12} />
              : <GiSprout width={12} />}
          <Chip.Label>{DIFFICULTY_LABELS[difficulty]}</Chip.Label>
        </Chip>
      </div>
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question + propositions en boutons radio */}
      <fieldset>
        <legend className="sr-only">{currentQuestion.text}</legend>
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
          {currentQuestion.category}
        </p>
        <p className="mb-6 text-xl font-semibold leading-snug text-black">
          {currentQuestion.text}
        </p>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.index;
            return (
              <label
                key={option.index}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-3 transition-colors ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 text-amber-200"
                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  /* Le name inclut l'id de la question : chaque question forme
                     son propre groupe radio, y compris si l'affichage change. */
                  name={`question-${currentQuestion.id}`}
                  value={option.index}
                  checked={isSelected}
                  onChange={() => selectOption(option.index)}
                  className="h-4 w-4 shrink-0 accent-amber-500"
                />
                <span className="text-left">{option.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-sm cursor-pointer text-zinc-500 hover:text-zinc-300"
        >
          Abandonner
        </button>
        <button
          onClick={handleNextOrSubmit}
          disabled={!hasAnsweredCurrent || submitting}
          className="rounded-lg cursor-pointer bg-amber-500 px-6 py-2.5 font-medium text-zinc-950 transition-opacity hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "Envoi…"
            : isLastQuestion
              ? "Valider le quiz"
              : "Suivant"}
        </button>
      </div>
    </div>
  );
}
