import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Home, LogIn, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { currentRole } = useWeb3();
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Force active dark scrolled navbar layout on login and register pages immediately
  const isNavbarDark = isScrolled || activePage === 'login' || activePage === 'register';

  // Sticky navbar scroll state transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver Scroll-Spy for section tracking
  useEffect(() => {
    if (activePage !== 'home') return;

    const sectionIds = ['hero', 'goal', 'about', 'campaigns', 'contact'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -45% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [activePage]);

  // Smooth scroll handler helper
  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    setActivePage('home');
    setActiveSection(sectionId);

    setTimeout(() => {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 50);
  };



  // Unified logout triggers Web2 logout and Web3 context resets
  const handleLogout = () => {
    logout();
    setActivePage('home');
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 md:px-12 flex items-center justify-between ${isNavbarDark
        ? 'bg-slate-950/95 backdrop-blur-md text-white border-b border-slate-800 py-3'
        : 'bg-transparent py-5'
        }`}
    >
      {/* Brand logo container - Clicking ANY part scrolls smoothly to top of Home */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => scrollToSection('hero')}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md group-hover:scale-105 group-hover:bg-blue-700 transition-all duration-300">
          Ξ
        </div>
        <div>
          <span
            className={`font-heading font-extrabold text-lg tracking-tight transition-colors duration-200 ${isNavbarDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
              }`}
          >
            ChainTrust
          </span>
          <span className="block text-[9px] tracking-[0.2em] uppercase font-bold text-blue-500">
            Donation Ledger
          </span>
        </div>
      </div>

      {/* Nav Links with Scroll-Spy Active Highlighting */}
      <div className="hidden md:flex items-center gap-8 font-sans text-sm">
        {currentRole === 'guest' && (
          <button
            onClick={() => scrollToSection('hero')}
            className={`transition-colors duration-200 cursor-pointer ${activePage === 'home' && activeSection === 'hero'
              ? isNavbarDark
                ? 'text-blue-400 font-bold border-b-2 border-blue-400 pb-0.5'
                : 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5'
              : isNavbarDark
                ? 'text-slate-200 hover:text-blue-400 font-medium'
                : 'text-slate-800 hover:text-blue-600 font-medium'
              }`}
          >
            Home
          </button>
        )}

        <button
          onClick={() => scrollToSection('goal')}
          className={`transition-colors duration-200 cursor-pointer ${activePage === 'home' && activeSection === 'goal'
            ? isNavbarDark
              ? 'text-blue-400 font-bold border-b-2 border-blue-400 pb-0.5'
              : 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5'
            : isNavbarDark
              ? 'text-slate-200 hover:text-blue-400 font-medium'
              : 'text-slate-800 hover:text-blue-600 font-medium'
            }`}
        >
          Our Goal
        </button>

        <button
          onClick={() => scrollToSection('about')}
          className={`transition-colors duration-200 cursor-pointer ${activePage === 'home' && activeSection === 'about'
            ? isNavbarDark
              ? 'text-blue-400 font-bold border-b-2 border-blue-400 pb-0.5'
              : 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5'
            : isNavbarDark
              ? 'text-slate-200 hover:text-blue-400 font-medium'
              : 'text-slate-800 hover:text-blue-600 font-medium'
            }`}
        >
          About Us
        </button>

        <button
          onClick={() => scrollToSection('campaigns')}
          className={`transition-colors duration-200 cursor-pointer ${activePage === 'home' && activeSection === 'campaigns'
            ? isNavbarDark
              ? 'text-blue-400 font-bold border-b-2 border-blue-400 pb-0.5'
              : 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5'
            : isNavbarDark
              ? 'text-slate-200 hover:text-blue-400 font-medium'
              : 'text-slate-800 hover:text-blue-600 font-medium'
            }`}
        >
          Campaigns
        </button>

        <button
          onClick={() => scrollToSection('contact')}
          className={`transition-colors duration-200 cursor-pointer ${activePage === 'home' && activeSection === 'contact'
            ? isNavbarDark
              ? 'text-blue-400 font-bold border-b-2 border-blue-400 pb-0.5'
              : 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5'
            : isNavbarDark
              ? 'text-slate-200 hover:text-blue-400 font-medium'
              : 'text-slate-800 hover:text-blue-600 font-medium'
            }`}
        >
          Contact
        </button>
      </div>

      
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden flex items-center">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`p-2 rounded-xl transition-colors ${isNavbarDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'}`}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden lg:flex items-center gap-3">

        {/* Workspace Link if logged in */}
        {currentRole !== 'guest' && (
          <button
            onClick={() => {
              if (currentRole === 'admin') setActivePage('admin-dashboard');
              else if (currentRole === 'ngo') setActivePage('ngo-dashboard');
              else setActivePage('donor-dashboard');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer ${isNavbarDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
          >
            <LayoutDashboard size={14} className={isNavbarDark ? 'text-slate-300' : 'text-slate-600'} />
            <span>Workspace</span>
          </button>
        )}

        {/* Home Button if not on Home */}
        {activePage !== 'home' && currentRole === 'guest' && (
          <button
            onClick={() => scrollToSection('hero')}
            className={`p-2 rounded-xl transition-colors duration-200 cursor-pointer ${isNavbarDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            title="Go to Home"
          >
            <Home size={16} />
          </button>
        )}


        {/* Auth / Simplified Logged In Controls */}
        {currentRole !== 'guest' ? (
          <div className="flex items-center gap-2">

            {/* Explicit Logout Button */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-heading text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer ${isNavbarDark
                ? 'bg-slate-800 border border-slate-700 text-slate-100 hover:border-red-500 hover:text-red-400 hover:bg-red-950/20'
                : 'bg-white border border-slate-200 text-slate-800 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                }`}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            {/* Login button */}
            <button
              onClick={() => setActivePage('login')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${activePage === 'login'
                ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg border border-blue-600 font-semibold'
                : isNavbarDark
                  ? 'border border-slate-700 shadow-sm bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-blue-400 font-semibold hover:shadow-md'
                  : 'border border-slate-200 shadow-sm bg-white/60 hover:bg-white text-slate-800 hover:text-blue-600 font-semibold hover:shadow-md'
                }`}
            >
              <LogIn size={14} />
              <span>Login</span>
            </button>

            {/* Register button */}
            <button
              onClick={() => setActivePage('register')}
              className={`px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${activePage === 'register'
                ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg border border-blue-600 font-semibold'
                : isNavbarDark
                  ? 'border border-slate-700 shadow-sm bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-blue-400 font-semibold hover:shadow-md'
                  : 'border border-slate-200 shadow-sm bg-white/60 hover:bg-white text-slate-800 hover:text-blue-600 font-semibold hover:shadow-md'
                }`}
            >
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    
      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-slate-950 border-l border-slate-800 z-[101] shadow-2xl flex flex-col p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-heading font-bold text-lg text-white">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                {['hero', 'goal', 'about', 'campaigns', 'contact'].map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className={`text-left text-lg font-medium px-4 py-3 rounded-xl transition-colors ${
                      activeSection === section ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {section === 'hero' ? 'Home' : section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>

              {/* Mobile Auth Controls */}
              <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-3">
                {currentRole !== 'guest' ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (currentRole === 'admin') setActivePage('admin-dashboard');
                        else if (currentRole === 'ngo') setActivePage('ngo-dashboard');
                        else setActivePage('donor-dashboard');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 text-slate-100 hover:bg-slate-700"
                    >
                      <LayoutDashboard size={18} />
                      <span>Workspace</span>
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setActivePage('login'); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 text-slate-100 hover:bg-slate-700"
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setActivePage('register'); }}
                      className="flex items-center justify-center px-4 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    >
                      <span>Register</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>

  );
};
