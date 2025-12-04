import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/index';
import AuthPage from './pages/auth/index';
import ProfilePage from './pages/profile/index';
import SearchResultsPage from './pages/search/index';
import LibraryPage from './pages/library/index';
import GameDetailPage from './pages/game/detail';
import AdminDashboardPage from './pages/admin/index';
import AdminUsersPage from './pages/admin/users/index';
import AdminGamesPage from './pages/admin/games/index';
import AdminConfigPage from './pages/admin/config/index';
import AdminPaymentCodePage from './pages/admin/paymentCode/index';
import AdminVipCodePage from './pages/admin/vipCode/index';
import AdminGroupsPage from './pages/admin/groups/index';
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
            <Route path="library" element={<LibraryPage />} />
            <Route path="game/:id" element={<GameDetailPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="games" element={<AdminGamesPage />} />
            <Route path="config" element={<AdminConfigPage />} />
            <Route path="paymentCode" element={<AdminPaymentCodePage />} />
            <Route path="vipCode" element={<AdminVipCodePage />} />
            <Route path="groups" element={<AdminGroupsPage />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;