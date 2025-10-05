// src/config/apiConfig.js
const API_BASE_URL = '/api'; // For client-side API routes

export const PHP_API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8080/api'  // XAMPP PHP backend
  : 'https://vybeztribe.com/api';

export const API_ENDPOINTS = {
  session: `${PHP_API_BASE}/auth/session.php`,
  login: `${PHP_API_BASE}/auth/login.php`,
  logout: `${PHP_API_BASE}/auth/logout.php`
};

export default API_BASE_URL;