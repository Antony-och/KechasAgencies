import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import FleetPage from './pages/FleetPage';
import ServicesPage from './pages/ServicesPage';
import DestinationsPage from './pages/DestinationsPage';
import BookPage from './pages/BookPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { RequireAdminRoute } from './components/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminFleetPage from './pages/admin/AdminFleetPage';
import AdminDriversPage from './pages/admin/AdminDriversPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminContentPage from './pages/admin/AdminContentPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function PublicShell() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Portal Routes (protected inside AdminLayout / RequireAdminRoute) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminOverviewPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/fleet" element={<AdminFleetPage />} />
        <Route path="/admin/drivers" element={<AdminDriversPage />} />
        <Route
          path="/admin/finance"
          element={
            <RequireAdminRoute>
              <AdminFinancePage />
            </RequireAdminRoute>
          }
        />
        <Route
          path="/admin/clients"
          element={
            <RequireAdminRoute>
              <AdminClientsPage />
            </RequireAdminRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <RequireAdminRoute>
              <AdminContentPage />
            </RequireAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RequireAdminRoute>
              <AdminSettingsPage />
            </RequireAdminRoute>
          }
        />

        {/* Public Website Routes */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
