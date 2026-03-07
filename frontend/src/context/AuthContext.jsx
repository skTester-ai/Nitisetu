import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, sendOTP as apiSendOTP } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage on initial load
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const res = await getMe();
      if (res.success) {
        setUser(res.data);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      localStorage.removeItem('token');
      console.error('Failed to load user', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for role-sync signals from the API interceptor
    const handleRoleSync = (event) => {
      const { role } = event.detail;
      if (user && user.role !== role) {
        console.warn(`[AuthContext] Role mismatch detected (local: ${user.role}, server: ${role}). Syncing...`);
        loadUser();
      }
    };

    window.addEventListener('nitisetu:role-sync', handleRoleSync);
    return () => window.removeEventListener('nitisetu:role-sync', handleRoleSync);
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await apiLogin(email, password);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      console.error('Login error', err);
      return { success: false, error: err.response?.data?.error || err.message || 'Login failed' };
    }
  };

  const sendOTP = async (email, purpose) => {
    try {
      return await apiSendOTP(email, purpose);
    } catch (err) {
      console.error('Send OTP error', err);
      return { success: false, error: err.response?.data?.error || err.message || 'Failed to send OTP' };
    }
  };

  const register = async (name, email, password, otp, contactNumber) => {
    try {
      const res = await apiRegister(name, email, password, otp, contactNumber);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      console.error('Register error', err);
      return { success: false, error: err.response?.data?.error || err.message || 'Registration failed' };
    }
  };

  const googleAuth = async (googleToken) => {
    try {
      const res = await apiGoogleLogin(googleToken);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      console.error('Google Login error', err);
      return { success: false, error: err.response?.data?.error || err.message || 'Google Authentication failed' };
    }
  };

  const logout = () => {
    if (user) {
      localStorage.removeItem(`nitisetu_notifications_${user._id}`);
    }
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, googleAuth, logout, sendOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

