import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3, type Campaign } from '../context/Web3Context';
import { ShieldCheck, RefreshCw, CheckCircle, Wallet } from 'lucide-react';

interface DonationModalProps {
  selectedCampaign: Campaign | null;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ selectedCampaign, onClose }) => {
  const { donateToCampaign, isWalletConnected, bindWalletToProfile } = useWeb3();
  const [donationAmount, setDonationAmount] = useState('100');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !donationAmount || parseFloat(donationAmount) <= 0) return;

    if (!isWalletConnected) {
      bindWalletToProfile();
      return;
    }

    setIsDonating(true);
    const success = await donateToCampaign(selectedCampaign.id, parseFloat(donationAmount));
    setIsDonating(false);
    
    if (success) {
      setDonationSuccess(true);
      setTimeout(() => {
        setDonationSuccess(false);
        onClose();
        setDonationAmount('100');
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-trust-blue">Confirm Escrow Deposit</span>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 mt-1">{selectedCampaign.name}</h3>
              </div>
              <button
                onClick={onClose}
                disabled={isDonating}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDonationSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Donation Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  min="1"
                  disabled={isDonating || donationSuccess}
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue font-heading font-bold text-lg text-slate-900 bg-white"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Escrow Security Protocols</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <ShieldCheck size={14} className="text-trust-blue" />
                    <span>Locked in multi-sig smart contract</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <ShieldCheck size={14} className="text-trust-blue" />
                    <span>Released only on approved milestones</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isDonating || donationSuccess}
                className="w-full py-4 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-trust-blue disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDonating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Broadcasting to Blockchain...</span>
                  </>
                ) : donationSuccess ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-300" />
                    <span>Transaction Completed & Logged</span>
                  </>
                ) : !isWalletConnected ? (
                  <>
                    <Wallet size={14} />
                    <span>Connect & Bind Wallet to Donate</span>
                  </>
                ) : (
                  <>
                    <span>Approve & Transfer Funds</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
