import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context
import { AuthProvider } from "./context/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import PlanRequiredRoute from "./components/PlanRequiredRoute";

// Pages - Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Pages - User
import HomePage from "./pages/HomePage"; 
import Dashboard from "./pages/user/Dashboard";
import Planselection from "./pages/Planselection";
import Captcha from "./pages/user/Captcha";
import Wallet from "./pages/user/Wallet";
import Withdraw from "./pages/user/Withdraw";

// Pages - Admin
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>

          {/* Default route → Always go to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Page: Browse Plans */}
          <Route path="/plans" element={<HomePage />} />

          {/* Plan Selection - For users after login/register */}
          <Route
            path="/plan-selection"
            element={
              <ProtectedRoute>
                <Planselection />
              </ProtectedRoute>
            }
          />

          {/* User Pages (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/captcha"
            element={
              <PlanRequiredRoute>
                <Captcha />
              </PlanRequiredRoute>
            }
          />

          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/withdraw"
            element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard (Protected - Admin only) */}
          <Route
            path="/adminDashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Legacy / shorthand admin path */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
