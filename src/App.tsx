// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WorkoutProvider } from "./contexts/WorkoutProviderIndexedDB";
import { NutritionProvider } from "./contexts/NutritionProviderIndexedDB";
import { ProfileProvider } from "./contexts/ProfileProviderIndexedDB";
import { ProfessionalProvider } from "./contexts/ProfessionalContext";
import { ToastProvider } from "./contexts/ToastProvider";
import { TimerToastProvider } from "./contexts/TimerToastProvider";
import { AppNavigationProvider } from "./contexts/AppNavigationContext";
import { AppContentWithNotifications } from "./components/AppContent/AppContentWithNotifications";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProfessionalSignup from "./pages/Auth/ProfessionalSignup";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfessionalProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/professional-signup"
                element={<ProfessionalSignup />}
              />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppNavigationProvider>
                      <TimerToastProvider>
                        <ProfileProvider>
                          <WorkoutProvider>
                            <NutritionProvider>
                              <AppContentWithNotifications />
                            </NutritionProvider>
                          </WorkoutProvider>
                        </ProfileProvider>
                      </TimerToastProvider>
                    </AppNavigationProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </ProfessionalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
