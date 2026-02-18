import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rr_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('rr_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    setToken(r.data.token);
    setUser(r.data);
    localStorage.setItem('rr_token', r.data.token);
    return r.data;
  };

  const register = async (name, email, phone, password) => {
    const r = await axios.post(`${API}/auth/register`, { name, email, phone, password });
    setToken(r.data.token);
    setUser(r.data);
    localStorage.setItem('rr_token', r.data.token);
    return r.data;
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const loginWithGoogle = () => {
    const redirectUrl = window.location.origin + '/login';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGoogleCallback = async (sessionId) => {
    const r = await axios.post(`${API}/auth/google`, { session_id: sessionId });
    setToken(r.data.token);
    setUser(r.data);
    localStorage.setItem('rr_token', r.data.token);
    return r.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rr_token');
  };

  const authHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginWithGoogle, handleGoogleCallback, logout, authHeaders, API }}>
      {children}
    </AuthContext.Provider>
  );
};
