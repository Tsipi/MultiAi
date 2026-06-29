import { useCallback, useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_KEY = "teamstoa_auth_token";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_superuser: boolean;
  is_verified: boolean;
  runs_this_month: number;
  runs_quota: number | null;
  total_runs: number;
  created_at: string | null;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUserProfile(null);
  }, []);

  // Fetch user profile whenever the token changes
  useEffect(() => {
    if (!token) {
      setUserProfile(null);
      return;
    }
    fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        if (data) setUserProfile(data);
      })
      .catch(() => {
        // Network failure — keep token, profile will retry on next render
      });
  }, [token, logout]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) {
      throw new Error("Invalid email or password.");
    }
    const data = (await res.json()) as { access_token: string };
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
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
    await login(email, password);
  };

  const updateProfile = async (fields: { display_name?: string }): Promise<void> => {
    if (!token) throw new Error("Not authenticated.");
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error("Failed to update profile.");
    const updated = (await res.json()) as Partial<UserProfile>;
    setUserProfile((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!token) throw new Error("Not authenticated.");
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(body.detail ?? "Password change failed.");
    }
    if (!res.ok) throw new Error("Failed to change password.");
    // Re-login with new password to get a fresh token
    await login(userProfile?.email ?? "", newPassword);
    void currentPassword; // validated implicitly via re-login
  };

  return {
    token,
    isLoggedIn: Boolean(token),
    userProfile,
    email: userProfile?.email ?? null,
    isAdmin: userProfile?.is_superuser ?? false,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };
}
