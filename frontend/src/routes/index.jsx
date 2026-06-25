import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

export const router = createBrowserRouter([
  // Redirect root path to dashboard
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Public authentication routes (wrapped by AuthLayout)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  // Protected workspace routes (wrapped by ProtectedRoute & MainLayout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: (
              <div className="text-center py-12 space-y-2">
                <h1 className="text-2xl font-bold text-slate-200">Dashboard Workspace</h1>
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  Authentication Scaffolding Only
                </p>
              </div>
            ),
          },
        ],
      },
    ],
  },
  // Fallback path redirects to dashboard
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
export default router;
