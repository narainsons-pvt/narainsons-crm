import axios from 'axios';

// Use environment variable or fallback to production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://narainsons-backend.onrender.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;