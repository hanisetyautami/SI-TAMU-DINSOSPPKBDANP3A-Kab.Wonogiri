import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// Mengambil token login dari localStorage
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sitamu_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token tidak valid atau sudah expired.");
    }

    return Promise.reject(error);
  }
);


export default api;