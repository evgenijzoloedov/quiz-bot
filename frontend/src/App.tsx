import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout';
import {
  LoginPage,
  DashboardPage,
  NamesPage,
  QuizPage,
  QuizBuilderPage,
  AnalyticsPage,
  FilesPage,
  FailImagesPage,
} from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="names" element={<NamesPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="quiz-builder" element={<QuizBuilderPage />} />
              <Route path="fail-images" element={<FailImagesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="files" element={<FilesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
