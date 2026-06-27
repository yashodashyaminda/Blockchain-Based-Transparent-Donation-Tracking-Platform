import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, ShieldAlert, Award, User, RefreshCw, LayoutDashboard, Home } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet, currentRole, resetState } = useWeb3();

  // Truncate address helper
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50 cinematic-glass rounded-2xl px-6 py-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200 cursor-pointer"
          >
            <LayoutDashboard size={14} className="text-slate-500" />
            <span>Workspace</span>
          </button>
        )}

        {/* Home Button if not on Home */}
        {activePage !== 'home' && (
          <button
            onClick={() => setActivePage('home')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200 cursor-pointer"
            title="Go to Landing Page"
          >
            <Home size={16} />
          </button>
        )}

        {/* Web3 Reset Simulator Button */}
        <button
          onClick={resetState}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-300 hover:rotate-180 cursor-pointer"
          title="Reset Simulation Ledger"
        >
          <RefreshCw size={16} />
        </button>

        {/* Connect Wallet */}
        {isWalletConnected ? (
          <div className="flex items-center gap-2">
            {/* Identity Badge */}
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

            {/* Wallet Address Display */}
            <button
              onClick={disconnectWallet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-semibold bg-white border border-slate-200 shadow-sm hover:border-red-300 hover:text-red-600 transition-all duration-200 glow-blue cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-milestone-green animate-ping" />
              <span>{truncateAddress(walletAddress)}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 bg-trust-blue hover:bg-trust-blue-hover text-white px-5 py-2.5 rounded-xl font-heading text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 glow-blue cursor-pointer"
          >
            <Wallet size={14} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </nav>
  );
};
