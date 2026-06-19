import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

// Pages
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { DailyQuiz } from '@/pages/DailyQuiz';
import { MegaChallenge } from '@/pages/MegaChallenge';
import { QuestionBank } from '@/pages/QuestionBank';
import { Users } from '@/pages/Users';
import { Winners } from '@/pages/Winners';
import { Rewards } from '@/pages/Rewards';
import { Notifications } from '@/pages/Notifications';
import { Settings } from '@/pages/Settings';
import { Analytics } from '@/pages/Analytics';
import { AuditLogs } from '@/pages/AuditLogs';

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Unprotected Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Management Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/daily-quiz"
                element={
                  <ProtectedRoute>
                    <DailyQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mega-challenge"
                element={
                  <ProtectedRoute>
                    <MegaChallenge />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-bank"
                element={
                  <ProtectedRoute>
                    <QuestionBank />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/winners"
                element={
                  <ProtectedRoute>
                    <Winners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rewards"
                element={
                  <ProtectedRoute>
                    <Rewards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
};
export default App;
