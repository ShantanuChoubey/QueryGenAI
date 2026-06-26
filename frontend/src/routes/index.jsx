import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import SQLGeneratorPage from '../pages/SQLGeneratorPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
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
            element: <SQLGeneratorPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          {
            path: '/history',
            element: <HistoryPage />,
          },
        ],
      },
    ],
  },
  // 404 catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
export default router;
