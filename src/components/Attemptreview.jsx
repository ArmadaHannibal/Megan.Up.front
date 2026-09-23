import React, { useMemo, useState } from "react";
import { GiCheckMark } from "react-icons/gi";
import { TfiClose } from "react-icons/tfi";

/**
 * Corps de la relecture d'une tentative : filtre (toutes / mauvaises réponses)
 * puis une carte par question avec la réponse donnée, la bonne réponse et
 * l'explication. Utilisé à la fois par la page ReviewComponent (résultat juste
 * après un quiz) et par le tiroir de l'historique.
 *
 * Props :
 *  - details: UserAnswerResult[]   // `result.details` renvoyé par l'API
 */
export default function AttemptReview({ details }) {
  const [filter, setFilter] = useState("all"); // "all" | "wrong"

  // On garde le numéro d'origine de chaque question : « Question 4 » reste
  // « Question 4 » même quand le filtre masque les bonnes réponses.
  const numbered = useMemo(
    () => details.map((detail, idx) => ({ detail, number: idx + 1 })),
    [details],
  );
  const wrongCount = numbered.filter(({ detail }) => !detail.isCorrect).length;
  const visible =
    filter === "wrong"
      ? numbered.filter(({ detail }) => !detail.isCorrect)
      : numbered;

  const filters = [
    { value: "all", label: `Toutes les questions (${numbered.length})` },
    { value: "wrong", label: `Mauvaises réponses (${wrongCount})` },
  ];

  return (
    <div>
      {/* Filtre : tout voir ou seulement les erreurs */}
      <div
        role="group"
        aria-label="Filtrer les questions"
        className="mb-5 flex flex-wrap gap-2"
      >
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? "border-amber-500 bg-amber-500 font-medium text-zinc-950"
                : "border-zinc-400 text-zinc-700 hover:border-zinc-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Détail question par question */}
      <div className="space-y-5">
        {visible.length === 0 && (
          <p className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-5 text-center text-black">
            Aucune erreur sur cette tentative. Toutes les réponses étaient
            justes.
          </p>
        )}

        {visible.map(({ detail, number }) => (
          <div
            key={detail.questionId}
            className={`rounded-xl border p-5 ${
              detail.isCorrect
                ? "border-emerald-900 bg-emerald-950/20"
                : "border-rose-900 bg-rose-950/20"
            }`}
          >
            <p className="mb-3 flex items-center justify-between text-sm font-medium text-black">
              <span>Question {number}</span>
              <span
                className={
                  detail.isCorrect ? "text-emerald-700" : "text-rose-700"
                }
              >
                {detail.isCorrect ? "Réponse juste" : "Réponse fausse"}
              </span>
            </p>
            <p className="mb-4 font-medium text-black">{detail.questionText}</p>

            <div className="space-y-2">
              {detail.options.map((optionText, optIndex) => {
                const isUserChoice = optIndex === detail.selectedOptionIndex;
                const isCorrectAnswer = optIndex === detail.correctOptionIndex;
                let style = "bg-zinc-700 text-white";
                if (isCorrectAnswer)
                  style = "border-emerald-600 bg-emerald-500 text-white";
                else if (isUserChoice && !isCorrectAnswer)
                  style = "border-rose-600 bg-rose-500 text-white";

                // Étiquette explicite : pas besoin de deviner d'après la couleur.
                let tag = null;
                if (isCorrectAnswer && isUserChoice)
                  tag = "Votre réponse · bonne réponse";
                else if (isCorrectAnswer) tag = "Bonne réponse";
                else if (isUserChoice) tag = "Votre réponse";

                return (
                  <div
                    key={optIndex}
                    className={`flex flex-wrap gap-2.5 items-center justify-between rounded-lg border px-4 py-2 text-sm ${style}`}
                  >
                    <span>{optionText}</span>
                    <span className="flex items-center gap-2">
                      {tag && (
                        <span className="text-xs font-medium opacity-90">
                          {tag}
                        </span>
                      )}
                      {isCorrectAnswer && (
                        <div className="liquid-ice flex items-center p-1">
                          <GiCheckMark />
                        </div>
                      )}
                      {isUserChoice && !isCorrectAnswer && (
                        <div className="glass-ice flex items-center rounded-full p-1.5">
                          <TfiClose />
                        </div>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-lg bg-white p-3 text-sm leading-relaxed text-black">
              <span className="font-medium text-black">Explication : </span>
              {detail.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
