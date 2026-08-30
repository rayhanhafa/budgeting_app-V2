import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to inject token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to globally handle 401/403 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Notify user and redirect
      alert('Sesi berakhir, silakan login lagi.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
