import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import type { UserRole } from '../context/Web3Context';
import { ShieldAlert, Award, UserCheck, EyeOff, Info, X } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setCurrentRole, connectWallet, disconnectWallet, ngos, setActiveNgoId, setDonorProfile } = useWeb3();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleToggle = () => setIsVisible(prev => !prev);
    window.addEventListener('toggle-role-switcher', handleToggle);
    return () => window.removeEventListener('toggle-role-switcher', handleToggle);
  }, []);

  const handleRoleChange = (role: UserRole, ngoType?: 'verified' | 'pending') => {
    if (role === 'guest') {
      disconnectWallet();
    } else {
      // Force wallet connection first
      connectWallet();
      
      setCurrentRole(role);
      
      if (role === 'admin') {
        setActiveNgoId(null);
        setDonorProfile(null);
      } else if (role === 'ngo') {
        setDonorProfile(null);
        if (ngoType === 'verified') {
          // Global Care Alliance
          setActiveNgoId('ngo-1');
        } else {
          // Save the Green
          setActiveNgoId('ngo-2');
        }
      } else if (role === 'donor') {
        setActiveNgoId(null);
        setDonorProfile({
          name: 'Sarah Connor',
          email: 'sarah@skynet-resistance.io',
          wallet: '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a'
        });
      }
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-trust-blue transition-all duration-300 flex items-center justify-center cursor-pointer border border-slate-800"
        title="Open Simulation Control Tower"
      >
        <ShieldAlert size={16} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 cinematic-glass rounded-2xl p-4 shadow-xl border border-slate-200 w-80 max-w-xs transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-between gap-1.5 mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-trust-blue" />
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800">
            Simulation Control Tower
          </h4>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Minimize"
        >
          <X size={14} />
        </button>
      </div>
      
      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
        Toggle identities on-the-fly to test state-locked dashboards, approval workflows, and ledgers.
      </p>

      <div className="flex flex-col gap-2">
        {/* Guest */}
        <button
          onClick={() => handleRoleChange('guest')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            currentRole === 'guest'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <EyeOff size={14} />
            <span>Public Guest</span>
          </div>
          <span className="text-[9px] opacity-60">No Wallet</span>
        </button>

        {/* Donor */}
        <button
          onClick={() => handleRoleChange('donor')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            currentRole === 'donor'
              ? 'bg-trust-blue border-trust-blue text-white glow-blue'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck size={14} />
            <span>Donor (Sarah)</span>
          </div>
          <span className="text-[9px] opacity-60">Verified Donor</span>
        </button>

        {/* NGO - Verified */}
        <button
          onClick={() => handleRoleChange('ngo', 'verified')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            currentRole === 'ngo' && ngos.find(n => n.id === 'ngo-1')?.isVerified
              ? 'bg-milestone-green border-milestone-green text-white glow-green'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award size={14} />
            <span>NGO (Global Care)</span>
          </div>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">Verified</span>
        </button>

        {/* NGO - Pending */}
        <button
          onClick={() => handleRoleChange('ngo', 'pending')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            currentRole === 'ngo' && !ngos.find(n => n.id === 'ngo-2')?.isVerified
              ? 'bg-pending-gold border-pending-gold text-white glow-gold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award size={14} />
            <span>NGO (Save Green)</span>
          </div>
          <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Pending</span>
        </button>

        {/* Admin */}
        <button
          onClick={() => handleRoleChange('admin')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200 shadow-md'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>Admin Control Tower</span>
          </div>
          <span className="text-[9px] opacity-60">Full Access</span>
        </button>
      </div>
    </div>
  );
};
