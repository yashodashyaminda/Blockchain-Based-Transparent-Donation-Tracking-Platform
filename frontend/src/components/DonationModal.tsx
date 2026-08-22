import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3, type Campaign } from '../context/Web3Context';
import { RefreshCw, CheckCircle, Wallet, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface DonationModalProps {
  selectedCampaign: Campaign | null;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ selectedCampaign, onClose }) => {
  const { donateToCampaign, isWalletConnected, walletAddress, walletBalance, connectWallet, refreshBalance } = useWeb3();
  const [donationAmount, setDonationAmount] = useState('0.01');
  const [estimatedGasFee] = useState('0.00021');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refresh balance when modal opens or wallet connects
  useEffect(() => {
    if (selectedCampaign && isWalletConnected && walletAddress) {
      refreshBalance(walletAddress);
    }
    setErrorMessage(null);
    setDonationSuccess(false);
  }, [selectedCampaign, isWalletConnected, walletAddress, refreshBalance]);

  const numericAmount = parseFloat(donationAmount) || 0;
  const numericGas = parseFloat(estimatedGasFee) || 0.00021;
  const totalEthRequired = numericAmount + numericGas;
  const currentBalance = parseFloat(walletBalance) || 0;
  const hasEnoughBalance = currentBalance >= totalEthRequired;

  const handleConnectWallet = async () => {
    setErrorMessage(null);
    await connectWallet();
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!selectedCampaign || numericAmount <= 0) return;

    if (!isWalletConnected) {
      await connectWallet();
      return;
    }

    if (!hasEnoughBalance) {
      setErrorMessage(`Insufficient balance: You need ${totalEthRequired.toFixed(4)} ETH (Amount + Gas), but your wallet balance is ${currentBalance.toFixed(4)} ETH.`);
      return;
    }

    setIsDonating(true);
    const result = await donateToCampaign(selectedCampaign.id, numericAmount);
    setIsDonating(false);
    
    if (result.success) {
      setDonationSuccess(true);
      setTimeout(() => {
        setDonationSuccess(false);
        onClose();
        setDonationAmount('0.01');
      }, 2000);
    } else {
      setErrorMessage(result.error || 'Transaction was rejected or failed in MetaMask.');
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-trust-blue">Campaign On-Chain Contribution</span>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 mt-1 line-clamp-1">{selectedCampaign.name}</h3>
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
              
              {/* Donation Amount Input in ETH */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Donation Amount (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.0001"
                    min="0.0001"
                    disabled={isDonating || donationSuccess}
                    value={donationAmount}
                    onChange={(e) => {
                      setDonationAmount(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue font-heading font-bold text-lg text-slate-900 bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-heading font-extrabold text-sm text-slate-400">ETH</span>
                </div>
              </div>

              {/* Wallet & Transaction Details (Shown when Connected) */}
              {isWalletConnected ? (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Connected Wallet</span>
                    <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200" title={walletAddress}>
                      {formatAddress(walletAddress)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Available Balance</span>
                    <span className="font-bold text-slate-900">{currentBalance.toFixed(4)} ETH</span>
                  </div>

                  <div className="border-t border-slate-200/80 my-0.5" />

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Estimated Gas Fee</span>
                    <span className="text-slate-600 font-semibold">{estimatedGasFee} ETH</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold pt-1 text-slate-900">
                    <span>Total Required Amount</span>
                    <span className="text-trust-blue text-sm">{totalEthRequired.toFixed(4)} ETH</span>
                  </div>
                </div>
              ) : null}

              {/* Error / Warning Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {!isWalletConnected && !hasEnoughBalance && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Wallet size={16} className="text-amber-600 shrink-0" />
                  <span>Connect your MetaMask wallet to check ETH balance and proceed with donation.</span>
                </div>
              )}

              {/* Action Button: Connect Wallet OR Confirm Transaction */}
              {!isWalletConnected ? (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="w-full py-4 rounded-xl font-heading text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet size={16} />
                  <span>Connect MetaMask Wallet</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isDonating || donationSuccess || !hasEnoughBalance || numericAmount <= 0}
                  className={`w-full py-4 rounded-xl font-heading text-xs font-bold text-white shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    !hasEnoughBalance
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
                      : donationSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-trust-blue shadow-md hover:shadow-lg glow-blue'
                  }`}
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
                  ) : (
                    <>
                      <span>Confirm Transaction</span>
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </button>
              )}

              {/* Insufficient balance message under button if disabled */}
              {isWalletConnected && !hasEnoughBalance && (
                <p className="text-[11px] text-center font-bold text-red-600 bg-red-50 py-2 rounded-lg border border-red-200">
                  ⚠️ Insufficient ETH balance to cover total amount ({totalEthRequired.toFixed(4)} ETH)
                </p>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
