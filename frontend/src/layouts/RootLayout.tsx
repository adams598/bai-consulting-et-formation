import React, { useEffect } from 'react';
import Navbar from "../components/Navbar";
import { Toaster } from "../components/ui/toaster";
import { AuthProvider } from "../providers/auth-provider";
import Chatbot from "../components/Chatbot";
import { useTheme } from "../contexts/ThemeContext";
import { useLocation } from 'react-router-dom';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const { theme } = useTheme();
  const location = useLocation();
  
  // Ne pas afficher la navbar sur les pages admin
  const isAdminPage = location.pathname.startsWith('/admin');

  // Gestion du scroll fluide
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const navbar = document.querySelector('nav');
      if (navbar) {
        if (scrollPosition > 50) {
          navbar.classList.add('shadow-lg', 'bg-white/95', 'dark:bg-dark-bg-primary/95', 'backdrop-blur-sm');
        } else {
          navbar.classList.remove('shadow-lg', 'bg-white/95', 'dark:bg-dark-bg-primary/95', 'backdrop-blur-sm');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestion du thème
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
      {!isAdminPage && <Navbar />}
      <AuthProvider>
        <main className="flex-1">
          {children}
        </main>
        {!isAdminPage && <Chatbot />}
        <Toaster />
      </AuthProvider>
    </div>
  );
} 