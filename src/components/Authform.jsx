import React, { useState } from "react";
import { login, register } from "../services/api";

/**
 * Écran de connexion / création de compte.
 *
 * Props :
 *  - onAuthenticated: (user) => void
 */
export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (isRegister && password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const user = isRegister
        ? await register(username.trim(), password)
        : await login(username.trim(), password);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError(null);
    setPassword("");
    setConfirm("");
  }

  return (
    <div className="mx-auto md:ml-40 md:mr-auto flex justify-center h-[40rem] max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="mb-1 text-xl font-semibold text-zinc-50">
          {isRegister ? "Créer un compte" : "Connexion"}
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          {isRegister
            ? "Votre historique de tentatives sera rattaché à ce compte."
            : "Connectez-vous pour retrouver votre historique."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm text-zinc-400"
            >
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
              placeholder="votre pseudo"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm text-zinc-400"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="confirm"
                className="mb-1.5 block text-sm text-zinc-400"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 cursor-pointer px-6 py-3 font-medium text-zinc-950 transition-opacity hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Veuillez patienter…"
              : isRegister
                ? "Créer mon compte"
                : "Se connecter"}
          </button>
        </form>

        <button
          onClick={switchMode}
          className="mt-5 w-full text-sm text-zinc-400 cursor-pointer hover:text-amber-400"
        >
          {isRegister
            ? "J'ai déjà un compte me connecter"
            : "Pas encore de compte ? En créer un"}
        </button>
      </div>
    </div>
  );
}
