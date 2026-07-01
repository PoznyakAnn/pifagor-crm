import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  fetchMe,
  hasSession,
  login as apiLogin,
  persistSession,
} from "../api/auth";
import type { ApiUser } from "../api/types";

interface ToastState {
  message: string;
  type: "ok" | "error";
}

interface CabinetContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  toast: (message: string, type?: "ok" | "error") => void;
}

const CabinetContext = createContext<CabinetContextValue | null>(null);

export function CabinetProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const toast = useCallback((message: string, type: "ok" | "error" = "ok") => {
    setToastState({ message, type });
    window.setTimeout(() => setToastState(null), 3500);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!hasSession()) {
      setUser(null);
      return;
    }
    const me = await fetchMe();
    setUser(me);
  }, []);

  const bootstrap = useCallback(async () => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password);
    persistSession(tokens);
    const me = await fetchMe();
    setUser(me);
    toast(`Добро пожаловать, ${me.first_name || me.email}!`);
  }, [toast]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, toast }),
    [user, loading, login, logout, refreshUser, toast],
  );

  return (
    <CabinetContext.Provider value={value}>
      {children}
      {toastState && (
        <div
          className={`cabinet-toast cabinet-toast--${toastState.type}`}
          role="status"
        >
          {toastState.message}
        </div>
      )}
    </CabinetContext.Provider>
  );
}

export function useCabinet() {
  const ctx = useContext(CabinetContext);
  if (!ctx) throw new Error("useCabinet must be used within CabinetProvider");
  return ctx;
}
