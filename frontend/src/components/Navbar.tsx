import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, ShieldAlert, Award, User, RefreshCw, LayoutDashboard, Home, LogIn } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet, currentRole, resetState } = useWeb3();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

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

  // Truncate address helper
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 md:px-12 flex items-center justify-between ${
        isNavbarDark
          ? 'bg-slate-950/95 text-white backdrop-blur-md shadow-lg py-3'
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
            className={`font-heading font-extrabold text-lg tracking-tight transition-colors duration-200 ${
              isNavbarDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
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
        <button
          onClick={() => scrollToSection('hero')}
          className={`transition-colors duration-200 cursor-pointer ${
            activePage === 'home' && activeSection === 'hero'
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

        <button
          onClick={() => scrollToSection('goal')}
          className={`transition-colors duration-200 cursor-pointer ${
            activePage === 'home' && activeSection === 'goal'
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
          className={`transition-colors duration-200 cursor-pointer ${
            activePage === 'home' && activeSection === 'about'
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
          className={`transition-colors duration-200 cursor-pointer ${
            activePage === 'home' && activeSection === 'campaigns'
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
          className={`transition-colors duration-200 cursor-pointer ${
            activePage === 'home' && activeSection === 'contact'
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

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Workspace Link if logged in */}
        {currentRole !== 'guest' && (
          <button
            onClick={() => {
              if (currentRole === 'admin') setActivePage('admin-dashboard');
              else if (currentRole === 'ngo') setActivePage('ngo-dashboard');
              else setActivePage('donor-dashboard');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer ${
              isNavbarDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <LayoutDashboard size={14} className={isNavbarDark ? 'text-slate-300' : 'text-slate-600'} />
            <span>Workspace</span>
          </button>
        )}

        {/* Home Button if not on Home */}
        {activePage !== 'home' && (
          <button
            onClick={() => scrollToSection('hero')}
            className={`p-2 rounded-xl transition-colors duration-200 cursor-pointer ${
              isNavbarDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Go to Home"
          >
            <Home size={16} />
          </button>
        )}

        {/* Reset State Simulator */}
        <button
          onClick={resetState}
          className={`p-2 rounded-xl transition-all duration-300 hover:rotate-180 cursor-pointer ${
            isNavbarDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
          title="Reset Platform State"
        >
          <RefreshCw size={16} />
        </button>

        {/* Auth / Web3 Buttons */}
        {isWalletConnected ? (
          <div className="flex items-center gap-2">
            <div
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isNavbarDark
                  ? 'bg-slate-800 text-blue-400 border-slate-700'
                  : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}
            >
              {currentRole === 'admin' ? (
                <>
                  <ShieldAlert size={12} className="text-blue-500" />
                  <span>Admin</span>
                </>
              ) : currentRole === 'ngo' ? (
                <>
                  <Award size={12} className="text-blue-500" />
                  <span>NGO</span>
                </>
              ) : (
                <>
                  <User size={12} className="text-blue-500" />
                  <span>Donor</span>
                </>
              )}
            </div>

            <button
              onClick={disconnectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-heading text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer ${
                isNavbarDark
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 hover:border-red-500 hover:text-red-400'
                  : 'bg-white border border-slate-200 text-slate-800 hover:border-red-300 hover:text-red-600'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{truncateAddress(walletAddress)}</span>
            </button>
          </div>
        ) : currentRole !== 'guest' ? (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Wallet size={14} />
            <span>Connect Web3 Wallet</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            {/* Login button */}
            <button
              onClick={() => setActivePage('login')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activePage === 'login'
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
              className={`px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activePage === 'register'
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
    </nav>
  );
};
