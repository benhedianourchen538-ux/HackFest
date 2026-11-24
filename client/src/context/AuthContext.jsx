import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement : si un jeton est enregistré, on récupère l'utilisateur
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleSession = useCallback(({ token, user: u }) => {
    tokenStorage.set(token);
    setUser(u);
    return u;
  }, []);

  const login = useCallback((email, password) => api.login(email, password).then(handleSession), [handleSession]);
  // Inscription : le compte est créé mais pas encore connecté (un code est envoyé par e-mail)
  const register = useCallback((payload) => api.register(payload), []);
  // Saisie du code reçu : le compte est activé et l'utilisateur connecté
  const verifierEmail = useCallback((email, code) => api.verifierEmail(email, code).then(handleSession), [handleSession]);
  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, verifierEmail, logout }),
    [user, loading, login, register, verifierEmail, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
