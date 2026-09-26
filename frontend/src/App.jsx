import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import MyCourses from './pages/MyCourses';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Instructor from './pages/Instructor';
import Pricing from './pages/Pricing';
import LiveClasses from './pages/LiveClasses';
import TestSeries from './pages/TestSeries';
import Recordings from './pages/Recordings';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/batches" element={<Courses batchesMode />} />
          <Route path="/test-series" element={<TestSeries />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/instructor/:id" element={<Instructor />} />
          <Route path="/lessons/:id" element={
            <ProtectedRoute><LessonView /></ProtectedRoute>
          } />
          <Route path="/my-courses" element={
            <ProtectedRoute><MyCourses /></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute><Cart /></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><Wishlist /></ProtectedRoute>
          } />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/live-classes" element={<LiveClasses />} />
          <Route path="/recordings" element={
            <ProtectedRoute><Recordings /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute roles={['TEACHER', 'ADMIN']}><TeacherDashboard /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
    </ErrorBoundary>
  );
}
