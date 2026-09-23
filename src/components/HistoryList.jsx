import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Drawer, useOverlayState } from "@heroui/react";
import { MdExpandMore } from "react-icons/md";

import { fetchAttemptDetail, fetchHistory } from "../services/api";
import AttemptReview from "./AttemptReview";

const DIFFICULTY_LABELS = { 1: "Débutant", 2: "Intermédiaire", 3: "Avancé" };

function errorsLabel(attempt) {
  const errors = attempt.totalQuestions - attempt.score;
  if (errors <= 0) return "";
  return ` · ${errors} erreur${errors > 1 ? "s" : ""}`;
}

/**
 * Une tentative dans le tiroir : en-tête repliable (niveau, date, score) et,
 * une fois ouverte, la relecture complète. Le détail n'est chargé qu'à la
 * première ouverture, puis remonté au parent pour éviter de le recharger.
 */
function AttemptSection({
  attempt,
  result,
  onLoaded,
  onAuthExpired,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open || result) return;
    let cancelled = false;
    setError(null);
    fetchAttemptDetail(attempt.id)
      .then((data) => !cancelled && onLoaded(attempt.id, data))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401 && onAuthExpired) onAuthExpired();
        else setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open, result, retry, attempt.id, onLoaded, onAuthExpired]);

  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const isLoading = open && !result && !error;

  return (
    <section className="rounded-xl border border-zinc-300 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-black">
            {DIFFICULTY_LABELS[attempt.difficulty]} -{" "}
            {new Date(attempt.timestamp).toLocaleDateString("fr-FR")}
          </p>
          <p className="text-xs text-zinc-600">
            {attempt.score} / {attempt.totalQuestions} bonnes réponses
            {errorsLabel(attempt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              percentage >= 70
                ? "bg-emerald-500/15 text-emerald-700"
                : percentage >= 40
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-rose-500/15 text-rose-700"
            }`}
          >
            {percentage}%
          </span>
          <MdExpandMore
            className={`size-5 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-200 p-4">
          {isLoading && (
            <p className="text-sm text-zinc-600">Chargement de la relecture…</p>
          )}
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
              <p>{error}</p>
              <button
                onClick={() => setRetry((n) => n + 1)}
                className="mt-2 cursor-pointer underline"
              >
                Réessayer
              </button>
            </div>
          )}
          {result && <AttemptReview details={result.details} />}
        </div>
      )}
    </section>
  );
}

/**
 * Liste des tentatives du joueur connecté. Cliquer sur une tentative ouvre
 * ses réponses dans un tiroir ; cocher plusieurs tentatives permet de les
 * ouvrir ensemble, l'une sous l'autre.
 * L'utilisateur est déduit du jeton côté serveur : plus de prop userId.
 *
 * Props :
 *  - onAuthExpired?: () => void
 */
export default function HistoryList({ onAuthExpired }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]); // cases cochées
  const [viewIds, setViewIds] = useState([]); // tentatives affichées dans le tiroir
  const [details, setDetails] = useState({}); // cache { [attemptId]: QuizResult }
  const drawer = useOverlayState();

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then((data) => !cancelled && setAttempts(data))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401 && onAuthExpired) onAuthExpired();
        else setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onAuthExpired]);

  const handleLoaded = useCallback((id, data) => {
    setDetails((prev) => ({ ...prev, [id]: data }));
  }, []);

  function toggleSelected(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openDrawer(ids) {
    setViewIds(ids);
    drawer.open();
  }

  // On respecte l'ordre de la liste (du plus récent au plus ancien).
  const viewedAttempts = useMemo(
    () => attempts.filter((a) => viewIds.includes(a.id)),
    [attempts, viewIds],
  );

  if (loading)
    return (
      <p className="text-center text-zinc-500">Chargement de l'historique…</p>
    );

  if (error) {
    return (
      <p className="rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-300">
        {error}
      </p>
    );
  }

  if (attempts.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        Aucune tentative pour le moment. Lancez votre premier QCM !
      </p>
    );
  }

  return (
    <>
      {selectedIds.length > 0 ? (
        <div className="liquid-ice sticky top-2 z-10 mb-3 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <p className="text-sm">
            {selectedIds.length} tentative{selectedIds.length > 1 ? "s" : ""}{" "}
            sélectionnée{selectedIds.length > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => setSelectedIds([])}
            >
              Tout désélectionner
            </Button>
            <Button
              size="sm"
              onPress={() =>
                openDrawer(
                  attempts
                    .filter((a) => selectedIds.includes(a.id))
                    .map((a) => a.id),
                )
              }
            >
              Voir les réponses
            </Button>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-zinc-500">
          Cliquez sur une tentative pour voir ses réponses, ou cochez-en
          plusieurs pour les consulter ensemble.
        </p>
      )}

      <div className="space-y-2">
        {attempts.map((attempt) => {
          const percentage = Math.round(
            (attempt.score / attempt.totalQuestions) * 100,
          );
          const isSelected = selectedIds.includes(attempt.id);
          const label = `${DIFFICULTY_LABELS[attempt.difficulty]} - ${new Date(
            attempt.timestamp,
          ).toLocaleDateString("fr-FR")}`;

          return (
            <div
              key={attempt.id}
              className={`flex items-stretch rounded-lg border bg-zinc-900 transition-colors ${
                isSelected
                  ? "border-amber-500"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <label className="flex cursor-pointer items-center px-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelected(attempt.id)}
                  aria-label={`Sélectionner la tentative ${label}`}
                  className="h-4 w-4 accent-amber-500"
                />
              </label>
              <button
                onClick={() => openDrawer([attempt.id])}
                className="flex flex-1 cursor-pointer items-center justify-between py-3 pr-4 text-left"
              >
                <div>
                  <p className="text-sm text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-500">
                    {attempt.score} / {attempt.totalQuestions} bonnes réponses
                    {errorsLabel(attempt)}
                  </p>
                  <p className="mt-1 text-xs text-amber-500">
                    Voir les réponses et la correction
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    percentage >= 70
                      ? "bg-emerald-500/10 text-emerald-400"
                      : percentage >= 40
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {percentage}%
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <Drawer state={drawer}>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            <Drawer.Dialog className="w-[92vw]! max-w-full! sm:w-[38rem]!">
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>
                  {viewedAttempts.length > 1
                    ? `Réponses de ${viewedAttempts.length} tentatives`
                    : "Réponses de la tentative"}
                </Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <div className="space-y-4 py-3">
                  {viewedAttempts.map((attempt, index) => (
                    <AttemptSection
                      key={attempt.id}
                      attempt={attempt}
                      result={details[attempt.id]}
                      onLoaded={handleLoaded}
                      onAuthExpired={onAuthExpired}
                      defaultOpen={index === 0}
                    />
                  ))}
                </div>
              </Drawer.Body>
              <Drawer.Footer>
                <Button variant="secondary" onPress={drawer.close}>
                  Fermer
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  );
}
