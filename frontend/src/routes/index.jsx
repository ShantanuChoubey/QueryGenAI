import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import SQLGeneratorPage from '../pages/SQLGeneratorPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';
import WorkspacePage from '../pages/WorkspacePage.jsx';
import AdminUsersPage from '../pages/AdminUsersPage.jsx';
import AdminLogsPage from '../pages/AdminLogsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminRoute from '../components/AdminRoute.jsx';

export const router = createBrowserRouter([
  // Redirect root path to workspaces landing page
  {
    path: '/',
    element: <Navigate to="/workspaces" replace />,
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
            path: '/workspaces',
            element: <WorkspacePage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          {
            path: '/history',
            element: <HistoryPage />,
          },
          // Admin routes (require ADMIN role)
          {
            element: <AdminRoute />,
            children: [
              {
                path: '/admin/users',
                element: <AdminUsersPage />,
              },
              {
                path: '/admin/logs',
                element: <AdminLogsPage />,
              },
            ],
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
