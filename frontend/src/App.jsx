import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import './i18n';

const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <h1 className="text-6xl font-bold text-slate-800 mb-4">404</h1>
    <p className="text-xl text-slate-600 mb-8">الصفحة التي تبحث عنها غير موجودة.</p>
    <a href="/" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors">العودة للرئيسية</a>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          
          {/* Standalone Survey Route (No standard Header/Footer to keep focus on survey) */}
          <Route path="/survey/:id" element={<SurveyPage />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
