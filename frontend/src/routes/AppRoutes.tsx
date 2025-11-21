import ProtectedRole from '@/routes/ProtectedRole';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RootLayout from '@/routes/RootLayout';
import { createBrowserRouter } from 'react-router-dom';

// Pages
import AdminHomePage from '@/pages/AdminHomePage/AdminHomePage';
import AdminReportDetailPage from '@/pages/AdminReportDetailPage/AdminReportDetailPage';
import AdminReportsPage from '@/pages/AdminReportsPage/AdminReportsPage';
import BrowsePage from '@/pages/BrowsePage';
import ContactPage from '@/pages/ContactPage';
import FaqPage from '@/pages/FaqPage/FaqPage';
import GameDetailPage from '@/pages/GameDetailPage';
import HomePage from '@/pages/HomePage';
import LegalPage from '@/pages/LegalPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ProfilePage from '@/pages/ProfilePage';
import RegisterPage from '@/pages/RegisterPage';
import ReportsPage from '@/pages/ReportsPage';
import TicketDetailPage from '@/pages/TicketsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'legal', element: <LegalPage /> },
      

      // Auth requise (n’importe quel role connecté)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'reports/new', element: <ReportsPage /> },
          { path: 'browse', element: <BrowsePage /> },
          { path: 'browse/:gameId', element: <GameDetailPage /> },
          { path: 'tickets/:ticketId', element: <TicketDetailPage /> },
        ],
      },

      // Admin / Moderator uniquement
      {
        element: <ProtectedRole allow={['Moderator', 'Admin']} />,
        children: [
          { path: 'admin', element: <AdminHomePage /> },
          { path: 'admin/reports', element: <AdminReportsPage />},
          { path: 'admin/reports/:id', element: <AdminReportDetailPage /> }
        ],
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);