const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "qcm_token";

// ---------------------------------------------------------------------------
// Gestion du jeton
// ---------------------------------------------------------------------------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Erreur enrichie : `status` permet de détecter les 401 côté composants. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) clearToken();
    throw new ApiError(
      body.detail || `Erreur API (${response.status})`,
      response.status,
    );
  }
  return response.json();
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez que l'API est démarrée sur " +
        API_BASE_URL,
      0,
    );
  }

  return handleResponse(response);
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export async function register(username, password) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  setToken(data.token);
  return data.user;
}

export async function login(username, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  setToken(data.token);
  return data.user;
}

export async function fetchCurrentUser() {
  return request("/api/auth/me");
}

export function logout() {
  clearToken();
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export async function fetchRandomQuestions(difficulty, limit = 10, category) {
  const params = new URLSearchParams({ difficulty, limit });
  if (category) params.set("category", category);
  return request(`/api/questions/random?${params}`);
}

export async function submitQuiz({ difficulty, answers }) {
  return request("/api/quiz/submit", {
    method: "POST",
    body: { difficulty, answers },
  });
}

export async function fetchHistory() {
  return request("/api/attempts/history");
}

export async function fetchAttemptDetail(attemptId) {
  return request(`/api/attempts/${attemptId}`);
}
