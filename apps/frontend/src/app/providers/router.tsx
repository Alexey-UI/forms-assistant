import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/widgets/RootLayout';
import { ProtectedRoute } from '@/shared/lib/ProtectedRoute';
import { GuestRoute } from '@/shared/lib/GuestRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SurveyCreatePage } from '@/pages/SurveyCreatePage';
import { SurveyEditPage } from '@/pages/SurveyEditPage';
import { SurveyResultsPage } from '@/pages/SurveyResultsPage';
import { SurveyTakePage } from '@/pages/SurveyTakePage';
import { GroupChatPage } from '@/pages/GroupChatPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/s/:token', element: <SurveyTakePage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/profile', element: <ProfilePage /> },
          { path: '/surveys/new', element: <SurveyCreatePage /> },
          { path: '/surveys/:surveyId/edit', element: <SurveyEditPage /> },
          { path: '/surveys/:surveyId/results', element: <SurveyResultsPage /> },
          { path: '/surveys/:surveyId/take', element: <SurveyTakePage /> },
          { path: '/groups/:groupId', element: <GroupChatPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
