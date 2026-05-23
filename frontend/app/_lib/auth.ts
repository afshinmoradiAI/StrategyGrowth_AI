import { API } from "./types";

const TOKEN_KEY = "sg_token";
const EMAIL_KEY = "sg_email";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function saveSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

const MODEL_KEY = "sg_model";

export function getSelectedModel(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MODEL_KEY);
}

export function setSelectedModel(modelId: string | null) {
  if (modelId) localStorage.setItem(MODEL_KEY, modelId);
  else localStorage.removeItem(MODEL_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  const model = getSelectedModel();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (model) headers["X-Model"] = model;
  return headers;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json() as Promise<{ access_token: string; email: string }>;
}

export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Registration failed");
  }
  return res.json() as Promise<{ access_token: string; email: string }>;
}
