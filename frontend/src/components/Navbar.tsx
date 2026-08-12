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

  // Scroll listener for sticky transparent-to-solid transition effect
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

  // Truncate address helper
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 md:px-12 flex items-center justify-between ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      {/* Brand logo */}
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setActivePage('home')}
      >
        <div className="w-10 h-10 rounded-xl bg-trust-blue flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
          Ξ
        </div>
        <div>
          <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            ChainTrust
          </span>
          <span className="block text-[9px] tracking-[0.2em] uppercase font-semibold text-trust-blue">
            Donation Ledger
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium text-slate-600">
        <button
          onClick={() => { setActivePage('home'); setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          className={`hover:text-trust-blue transition-colors duration-200 cursor-pointer ${activePage === 'home' ? 'text-trust-blue font-semibold' : ''}`}
        >
          Home
        </button>
        <button
          onClick={() => { setActivePage('home'); setTimeout(() => document.getElementById('goal')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          className="hover:text-trust-blue transition-colors duration-200 cursor-pointer"
        >
          Our Goal
        </button>
        <button
          onClick={() => { setActivePage('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          className="hover:text-trust-blue transition-colors duration-200 cursor-pointer"
        >
          About Us
        </button>
        <button
          onClick={() => { setActivePage('home'); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
          className="hover:text-trust-blue transition-colors duration-200 cursor-pointer"
        >
          Contact
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Dashboard Link if logged in */}
        {currentRole !== 'guest' && (
          <button
            onClick={() => {
              if (currentRole === 'admin') setActivePage('admin-dashboard');
              else if (currentRole === 'ngo') setActivePage('ngo-dashboard');
              else setActivePage('donor-dashboard');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 transition-colors duration-200 cursor-pointer"
          >
            <LayoutDashboard size={14} className="text-slate-500" />
            <span>Workspace</span>
          </button>
        )}

        {/* Home Button if not on Home */}
        {activePage !== 'home' && (
          <button
            onClick={() => setActivePage('home')}
            className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 transition-colors duration-200 cursor-pointer"
            title="Go to Landing Page"
          >
            <Home size={16} />
          </button>
        )}

        {/* Reset State Simulator */}
        <button
          onClick={resetState}
          className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 transition-all duration-300 hover:rotate-180 cursor-pointer"
          title="Reset Platform State"
        >
          <RefreshCw size={16} />
        </button>

        {/* Web2.5 Auth & Wallet Header Navigation */}
        {isWalletConnected ? (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-trust-blue-light text-trust-blue text-xs font-semibold border border-blue-100">
              {currentRole === 'admin' ? (
                <>
                  <ShieldAlert size={12} className="text-trust-blue" />
                  <span>Admin</span>
                </>
              ) : currentRole === 'ngo' ? (
                <>
                  <Award size={12} className="text-trust-blue" />
                  <span>NGO</span>
                </>
              ) : (
                <>
                  <User size={12} className="text-trust-blue" />
                  <span>Donor</span>
                </>
              )}
            </div>

            <button
              onClick={disconnectWallet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-semibold bg-white border border-slate-200 shadow-sm hover:border-red-300 hover:text-red-600 transition-all duration-200 glow-blue cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-milestone-green animate-ping" />
              <span>{truncateAddress(walletAddress)}</span>
            </button>
          </div>
        ) : currentRole !== 'guest' ? (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 bg-trust-blue hover:bg-trust-blue-hover text-white px-4 py-2 rounded-xl font-heading text-xs font-semibold transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Wallet size={14} />
            <span>Connect Web3 Wallet</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('login')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-heading text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activePage === 'login'
                  ? 'bg-trust-blue text-white shadow-sm'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-800'
              }`}
            >
              <LogIn size={14} />
              <span>Log In</span>
            </button>

            <button
              onClick={() => setActivePage('register')}
              className={`px-4 py-2 rounded-xl font-heading text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activePage === 'register'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-trust-blue text-white hover:bg-trust-blue-hover shadow-sm'
              }`}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
