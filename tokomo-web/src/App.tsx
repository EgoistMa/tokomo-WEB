import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/index';
import AuthPage from './pages/auth/index';
import ProfilePage from './pages/profile/index';
import SearchResultsPage from './pages/search/index';
import AdminGamesPage from './pages/admin/games/index';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="admin/games" element={<AdminGamesPage />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;