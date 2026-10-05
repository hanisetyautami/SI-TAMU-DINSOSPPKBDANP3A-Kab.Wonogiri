import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ========================================
// PAGES
// ========================================
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import RegistrationDashboard from "./pages/RegistrationDashboard";

import Users from "./pages/Users";


// ========================================
// PROTECTED ROUTE
// ========================================
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("sitamu_token");

  // Jika belum login
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


// ========================================
// APP
// ========================================
export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==================================
            LOGIN
        ================================== */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* ==================================
            REGISTER ADMIN
        ================================== */}
        <Route
          path="/register"
          element={<Register />}
        />


        {/* ==================================
            ADMIN DASHBOARD
        ================================== */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* ==================================
            USERS
        ================================== */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />


        {/* ==================================
            REGISTRATION DASHBOARD
            PUBLIC
            TIDAK PERLU LOGIN
        ================================== */}
        <Route
          path="/registration-dashboard"
          element={<RegistrationDashboard />}
        />


        {/* ==================================
            ROOT
        ================================== */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* ==================================
            DASHBOARD LAMA
            Supaya URL lama tidak error
        ================================== */}
        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />


        {/* ==================================
            REGISTRATION DASHBOARD LAMA
        ================================== */}
        <Route
          path="/RegistrationDashboard"
          element={
            <Navigate
              to="/registration-dashboard"
              replace
            />
          }
        />


        {/* ==================================
            PAGE NOT FOUND
        ================================== */}
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}