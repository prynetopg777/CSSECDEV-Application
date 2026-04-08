import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type LoginResult, type MeUser } from "../api";

type AuthState = {
  user: MeUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<{
    lastSuccessfulLoginAt: string | null;
    lastFailedLoginAt: string | null;
  }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { ok, data } = await api<{ user?: MeUser }>("/api/auth/me");
    if (ok && data.user) setUser(data.user);
    else setUser(null);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { ok, data } = await api<LoginResult & { error?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!ok || !("user" in data) || !data.user) {
      throw new Error((data as { error?: string }).error ?? "Invalid username and/or password.");
    }
    setUser(data.user);
    return {
      lastSuccessfulLoginAt: data.lastSuccessfulLoginAt ?? null,
      lastFailedLoginAt: data.lastFailedLoginAt ?? null,
    };
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
