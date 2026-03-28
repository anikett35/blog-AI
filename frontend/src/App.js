import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { gsap } from 'gsap';

import ArchitecturePage from './pages/ArchitecturePage';
import EnginePage from './pages/EnginePage';
import DashboardPage from './pages/DashboardPage';
import BlogsPage from './pages/BlogsPage';
import SEOPage from './pages/SEOPage';

import './styles.css';

const NAV = [
  { to: '/', label: 'Architecture', end: true },
  { to: '/engine', label: 'Live Engine', badge: 'LIVE' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/blogs', label: 'Generate Blogs', badge: 'LIVE' },
  { to: '/seo', label: 'SEO Validation' },
];

function Navbar() {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current,
      { y: -58, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
    );
    gsap.fromTo('.nav-link',
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.3, ease: 'power2.out' }
    );
  }, []);

  return (
    <nav className="navbar" ref={ref}>
      <div className="navbar-brand">
        <div className="brand-dot">⚡</div>
        <div className="brand-name">Blogy<span>AI</span></div>
      </div>
      <div className="navbar-nav">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {n.label}
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function PageWrapper({ children }) {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const loc = useLocation();
  return (
    <main className="main-content">
      <PageWrapper>
        <Routes location={loc}>
          <Route path="/"         element={<ArchitecturePage />} />
          <Route path="/engine"   element={<EnginePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/blogs"    element={<BlogsPage />} />
          <Route path="/seo"      element={<SEOPage />} />
        </Routes>
      </PageWrapper>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff', color: '#0f1117',
              border: '1px solid #e8eaed',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px', fontWeight: 600,
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <Navbar />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
