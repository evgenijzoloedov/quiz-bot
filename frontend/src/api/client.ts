import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// В development используем полный URL, в production - относительный (nginx проксирует)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment ? `${API_URL}/api` : '/api';

console.log('API Base URL:', baseURL);
const apiClient = axios.create({
	baseURL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = localStorage.getItem('authToken');
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('authToken');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

export default apiClient;
