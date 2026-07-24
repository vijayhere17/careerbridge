export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "seeker" | "mentor" | "opportunity_provider" | "hr" | "admin";
  mobile?: string | null;
  company?: string | null;
  current_role?: string | null;
  target_roles?: string | null;
  location?: string | null;
  bio?: string | null;
};

const STORAGE_USER = "cb-user";
const STORAGE_TOKEN = "cb-token";
const AUTH_CHANGE_EVENT = "cb-auth-change";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_TOKEN);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_USER);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser, token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  window.localStorage.setItem(STORAGE_TOKEN, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_USER);
  window.localStorage.removeItem(STORAGE_TOKEN);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function onAuthChange(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, listener);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const token = getAuthToken();

  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");
  if (!(init.body instanceof FormData)) {
  headers.set("Content-Type", "application/json");
}

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("/api") ? `${API_BASE_URL}${path}` : path;
  const response = await fetch(url, { ...init, headers });
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await response.json();
    if (!response.ok) {
      throw body;
    }
    return body as T;
  }

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response as unknown as T;
}
