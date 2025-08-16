// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { NewCampaignPage } from "./pages/NewCampaignPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import AuthPage from "./pages/AuthPage";
import PrivateRoute from "./components/PrivateRoute";
import { useAuthStore } from "./store/auth";

export default function App() {
  const { isLoggedIn } = useAuthStore();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {isLoggedIn && <Navbar />}
        <main className={isLoggedIn ? "container mx-auto px-4 py-6" : ""}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/new"
              element={
                <PrivateRoute>
                  <NewCampaignPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/campaign/:id"
              element={
                <PrivateRoute>
                  <CampaignDetailPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
