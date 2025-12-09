import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  // ❗ IMPORTANT: DO NOT attach token to static frontend file requests
  const skipAuthFor = [
    "manifest.json",
    "favicon",
    "logo",
    "/",
    "/index.html",
  ];

  if (skipAuthFor.some((p) => req.url.includes(p))) {
    return req; // skip adding Authorization header
  }

  // ✅ Add Authorization only for backend API
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
