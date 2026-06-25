import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute/GuestRoute.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/home/Home.jsx';
import Course from './pages/course/Course.jsx';
import Cart from './pages/cart/Cart.jsx';
import Checkout from './pages/checkout/Checkout.jsx';
import Login from './pages/login/Login.jsx';
import Register from './pages/register/Register.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Lesson from './pages/lesson/Lesson.jsx';
import Profile from './pages/profile/Profile.jsx';
import Admin from './pages/admin/Admin.jsx';
import ForgotPassword from './pages/forgot-password/ForgotPassword.jsx';
import ResetPassword from './pages/reset-password/ResetPassword.jsx';
import VerifyEmail from './pages/verify-email/VerifyEmail.jsx';
import Privacy from './pages/legal/Privacy.jsx';
import Cookiebeleid from './pages/legal/Cookiebeleid.jsx';
import AlgemeneVoorwaarden from './pages/legal/AlgemeneVoorwaarden.jsx';
import NotFound from './pages/not-found/NotFound.jsx';
import ConsentBar from './components/ConsentBar/ConsentBar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <ConsentBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cursus/:slug" element={<Course />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/registreren" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/wachtwoord-vergeten" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/wachtwoord-reset" element={<ResetPassword />} />
          <Route path="/email-verificatie" element={<VerifyEmail />} />
          <Route path="/winkelwagen" element={<Cart />} />
          <Route path="/checkout/succes" element={<Checkout />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookie-policy" element={<Cookiebeleid />} />
          <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/cursus/:courseId/les/:lessonId" element={
            <ProtectedRoute><Lesson /></ProtectedRoute>
          } />
          <Route path="/profiel" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
