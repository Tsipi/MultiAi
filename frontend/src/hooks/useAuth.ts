import { useState } from "react";

const BASE_URL = "http://localhost:8000";
const TOKEN_KEY = "auth_token";
const EMAIL_KEY = "auth_email";

export interface AuthState {
  token: string | null;
  email: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: sessionStorage.getItem(TOKEN_KEY),
    email: sessionStorage.getItem(EMAIL_KEY),
  });

  const login = async (email: string, password: string): Promise<void> => {
    // fastapi-users login expects OAuth2 form data (username + password)
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) {
      throw new Error("Invalid email or password.");
    }
    const data = (await res.json()) as { access_token: string };
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    sessionStorage.setItem(EMAIL_KEY, email);
    setAuth({ token: data.access_token, email });
  };

  const register = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(body.detail ?? "Registration failed.");
    }
    // Auto-login after successful registration
    await login(email, password);
  };

  const logout = (): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    setAuth({ token: null, email: null });
  };

  return { ...auth, isLoggedIn: Boolean(auth.token), login, register, logout };
}
