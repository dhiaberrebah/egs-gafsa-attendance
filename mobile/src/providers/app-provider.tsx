import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, mobileSignIn, mobileSignOut, requestJson, validateMobileToken } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

const TOKEN_KEY = "egs-gafsa-coach-session";

type AppContextValue = {
  token: string | null;
  ready: boolean;
  locale: Locale;
  toggleLocale: () => void;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          const session = await validateMobileToken(storedToken);
          if (session.user.role !== "COACH") throw new ApiError(403, "COACH_ONLY");
          const validToken = session.refreshedToken ?? storedToken;
          if (session.refreshedToken) await SecureStore.setItemAsync(TOKEN_KEY, validToken);
          if (mounted) setToken(validToken);
        }
      } catch {
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch {
          // Keep the app usable if the device secure store is temporarily unavailable.
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await mobileSignIn(username, password);
    if (result.user.role !== "COACH") {
      try {
        await mobileSignOut(result.token);
      } catch {
        // Do not retain a non-coach token on this device.
      }
      throw new ApiError(403, "COACH_ONLY");
    }
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    } catch (error) {
      try {
        await mobileSignOut(result.token);
      } catch {
        // Do not keep a session when secure token storage fails.
      }
      throw error;
    }
    setToken(result.token);
  }, []);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await mobileSignOut(token);
      } catch {
        // Clear the device token even if the network is unavailable.
      }
    }
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // The in-memory token is still cleared if secure storage is unavailable.
    } finally {
      setToken(null);
    }
  }, [token]);

  const request = useCallback(async <T,>(path: string, options?: RequestInit) => {
    if (!token) throw new ApiError(401, "UNAUTHENTICATED");
    try {
      return await requestJson<T>(path, token, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch {
          // The in-memory token is still cleared if secure storage is unavailable.
        } finally {
          setToken(null);
        }
      }
      throw error;
    }
  }, [token]);

  const value = useMemo<AppContextValue>(() => ({
    token,
    ready,
    locale,
    toggleLocale: () => setLocale((current) => current === "fr" ? "ar" : "fr"),
    signIn,
    signOut,
    request,
  }), [token, ready, locale, signIn, signOut, request]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
