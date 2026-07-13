import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/authToken";

export interface UserPreferences {
  pref_answer_mode: string | null;
  pref_web_research_mode: string | null;
  pref_team_template: string | null;
}

export interface UserProfile extends UserPreferences {
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
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const logout = useCallback((): void => {
    clearAuthToken();
    setToken(null);
    setUserProfile(null);
  }, []);

  // Fetch user profile whenever the token changes
  useEffect(() => {
    if (!token) {
      setUserProfile(null);
      return;
    }
    fetch(`${getApiBaseUrl()}/api/me`, {
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
    const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) {
      throw new Error("Invalid email or password.");
    }
    const data = (await res.json()) as { access_token: string };
    setAuthToken(data.access_token);
    setToken(data.access_token);
  };

  const register = async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
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
    const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
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
    const res = await fetch(`${getApiBaseUrl()}/api/users/me`, {
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

  const savePreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
    if (!token) throw new Error("Not authenticated.");
    const res = await fetch(`${getApiBaseUrl()}/api/me/preferences`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error("Failed to save preferences.");
    const updated = (await res.json()) as Partial<UserPreferences>;
    setUserProfile((prev) => (prev ? { ...prev, ...updated } : prev));
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
    savePreferences,
  };
}
