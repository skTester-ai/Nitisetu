import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle role synchronization and errors
api.interceptors.response.use(
  (response) => {
    // Industry Standard: Check if backend provided a role update in headers
    const serverRole = response.headers['x-user-role'];
    if (serverRole) {
      // Dispatch a custom event that AuthContext will listen to
      const event = new CustomEvent('nitisetu:role-sync', { detail: { role: serverRole } });
      window.dispatchEvent(event);
    }
    return response;
  },
  (error) => {
    // Global unauthorized handler
    if (error.response?.status === 401) {
      const isPublicPath = 
        window.location.pathname === '/' || 
        window.location.pathname.includes('/login') || 
        window.location.pathname.includes('/register') ||
        window.location.pathname.includes('/check'); // Landing and public checks

      if (!isPublicPath) {
        // Only clear token and redirect if it's a private page
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
      } else {
        // If they're on a public path, just clear the stale token without redirecting
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data);
export const sendOTP = (email, purpose) => api.post('/auth/send-otp', { email, purpose }).then(r => r.data);
export const register = (name, email, password, otp, contactNumber) => api.post('/auth/register', { name, email, password, otp, contactNumber }).then(r => r.data);
export const googleLogin = (token) => api.post('/auth/google', { token }).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const updateDetails = (data) => api.put('/auth/updatedetails', data).then(r => r.data);
export const updatePassword = (data) => api.put('/auth/updatepassword', data).then(r => r.data);
export const forgotPassword = (email) => api.post('/auth/forgotpassword', { email }).then(r => r.data);
export const resetPassword = (data) => api.put('/auth/resetpassword', data).then(r => r.data);
export const provisionAdmin = (data) => api.post('/auth/admins', data).then(r => r.data);
export const updateUserRole = (id, role) => api.put(`/auth/users/${id}/role`, { role }).then(r => r.data);
export const getAllUsers = () => api.get('/auth/users').then((r) => r.data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`).then((r) => r.data);
export const sendWhatsAppOTP = (contactNumber) => api.post('/auth/send-whatsapp-otp', { contactNumber }).then(r => r.data);
export const verifyWhatsAppOTP = (contactNumber, otp) => api.post('/auth/verify-whatsapp-otp', { contactNumber, otp }).then(r => r.data);

// ── Schemes ───────────────────────────────
export const getSchemes = () => api.get(`/schemes?_v=${Date.now()}`).then((r) => r.data);
export const getScheme = (id) => api.get(`/schemes/${id}`).then((r) => r.data);
export const deleteScheme = (id) => api.delete(`/schemes/${id}`).then((r) => r.data);

export const uploadScheme = (file, schemeName, description, category) => {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('schemeName', schemeName);
  formData.append('description', description || '');
  formData.append('category', category || 'other');
  return api
    .post('/schemes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    .then((r) => r.data);
};

// ── Profiles ──────────────────────────────
export const getProfiles = () => api.get('/profiles').then((r) => r.data);
export const getProfile = (id) => api.get(`/profiles/${id}`).then((r) => r.data);
export const createProfile = (data) => api.post('/profiles', data).then((r) => r.data);
export const updateProfile = (id, data) => api.put(`/profiles/${id}`, data).then((r) => r.data);
export const deleteProfile = (id) => api.delete(`/profiles/${id}`).then((r) => r.data);

// ── Eligibility ───────────────────────────
export const checkEligibility = (profileId, schemeName, language = 'en', category = '') =>
  api.post('/eligibility/check', { profileId, schemeName, language, category }).then((r) => r.data);

export const checkEligibilityPublic = (profileData, schemeName, language = 'en', category = '') =>
  api.post('/eligibility/public-check', { profileData, schemeName, language, category }).then((r) => r.data);

export const translateResult = (result, language) =>
  api.post('/eligibility/translate-result', { result, language }).then((r) => r.data);

export const getEligibilityHistory = (profileId) =>
  api.get(`/eligibility/history/${profileId}`).then((r) => r.data);

export const deleteEligibilityCheck = (id) =>
  api.delete(`/eligibility/${id}`).then((r) => r.data);

// ── Voice ─────────────────────────────────
export const processVoice = (transcript) =>
  api.post('/voice/process', { transcript }).then((r) => r.data);

export const transcribeAudio = (audioBlob, language = 'en') => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);
  return api.post('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then((r) => r.data);
};

export const generateSpeech = (text, language = 'hi') =>
  api.post('/voice/tts', { text, language }, { responseType: 'blob' }).then((r) => r.data);

// ── Chat API ──────────────────────────────
export const chatWithKrishiMitra = async (query, history, language = 'en', sessionId = null) => {
  const { data } = await api.post('/chat', { query, history, language, sessionId });
  return data;
};

export const getChatSessions = async () => {
  const { data } = await api.get('/chat/sessions');
  return data;
};

export const createChatSession = async (title) => {
  const { data } = await api.post('/chat/sessions', { title });
  return data;
};

export const getSessionMessages = async (sessionId) => {
  const { data } = await api.get(`/chat/sessions/${sessionId}/messages`);
  return data;
};

export const deleteChatSession = async (sessionId) => {
  const { data } = await api.delete(`/chat/sessions/${sessionId}`);
  return data;
};

export const translateChatHistory = async (messages, targetLanguage) => {
  const { data } = await api.post('/chat/translate', { messages, targetLanguage });
  return data;
};

export const clearChatHistory = async () => {
  const { data } = await api.delete('/chat/clear');
  return data;
};

// ── Health ────────────────────────────────
export const getHealth = () => api.get('/health').then((r) => r.data);

// ── Analytics ─────────────────────────────
export const getAnalytics = () => api.get('/analytics').then((r) => r.data);
export const getResourceUsage = () => api.get('/analytics/resources').then((r) => r.data);
export const getGraphData = () => api.get('/graph/explorer').then((r) => r.data);

// ── Scanning ──────────────────────────────
export const scanDocument = (file, documentType, landUnit = 'Hectares') => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);
  formData.append('landUnit', landUnit);
  
  return api.post('/scan/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then((r) => r.data);
};

export default api;

