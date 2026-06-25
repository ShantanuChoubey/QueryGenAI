import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import QueryGeneratorPage from '../pages/QueryGeneratorPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <QueryGeneratorPage />,
      },
    ],
  },
]);
