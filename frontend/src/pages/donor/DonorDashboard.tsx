import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import type { Campaign } from '../../context/Web3Context';
import { Search, Wallet, FileText, CheckCircle, Clock, Link as LinkIcon, AlertCircle, RefreshCw, ArrowRight, LogOut } from 'lucide-react';
import { DonationModal } from '../../components/DonationModal';

interface DonorDashboardProps {
  preSelectedCampaignId: string | null;
  setPreSelectedCampaignId: (id: string | null) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ preSelectedCampaignId, setPreSelectedCampaignId }) => {
  const { campaigns, isWalletConnected, walletAddress, walletBalance, connectWallet, disconnectWallet, transactions, refreshCampaigns } = useWeb3();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'map' | 'ledger'>('browse');
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(() => campaigns.length === 0);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (campaigns.length === 0) {
        setLoadingCampaigns(true);
      }
      try {
        await refreshCampaigns();
      } catch (err) {
        console.error('Failed to refresh campaigns in DonorDashboard:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, [refreshCampaigns, campaigns.length]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Donate modal states
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fund Map active project selection
  const [mapCampaignId, setMapCampaignId] = useState<string>('');
  const [activeMilestoneNode, setActiveMilestoneNode] = useState<any>(null);

  // Set default map campaign ID once campaigns are loaded
  useEffect(() => {
    if (campaigns.length > 0 && !mapCampaignId) {
      setMapCampaignId(campaigns[0].id);
    }
  }, [campaigns, mapCampaignId]);

  // Load preselected campaign from landing page
  useEffect(() => {
    if (preSelectedCampaignId) {
      const found = campaigns.find(c => c.id === preSelectedCampaignId);
      if (found) {
        setSelectedCampaign(found);
        setActiveTab('browse');
        setPreSelectedCampaignId(null);
      }
    }
  }, [preSelectedCampaignId, campaigns, setPreSelectedCampaignId]);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ngoName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transactions for the connected wallet address strictly
  const myTransactions = transactions.filter(t =>
    isWalletConnected &&
    walletAddress &&
    t.donorAddress.toLowerCase() === walletAddress.toLowerCase()
  );

  const selectedMapCampaign = campaigns.find(c => c.id === mapCampaignId) || campaigns[0];

  const formatTruncatedAddress = (addr: string) => {
    if (!addr) return 'Not Connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-6 md:px-12 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-trust-blue-light blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-milestone-green-light blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">

        {/* Header Profile Dashboard */}
        <div className="cinematic-glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-trust-blue flex items-center justify-center text-white shadow-sm shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900">
                Donor Tracking Room
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Account: <span className="font-semibold text-slate-800">{user?.name || 'Donor Profile'}</span> ({user?.email || 'donor@platform.org'})
                {isWalletConnected && (
                  <>
                    {' • '}
                    Wallet: <span className="font-mono text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200" title={walletAddress}>
                      {formatTruncatedAddress(walletAddress)}
                    </span>
                    <button
                      onClick={disconnectWallet}
                      className="ml-2 font-bold text-red-500 hover:text-red-700 hover:underline text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                      title="Disconnect MetaMask Wallet"
                    >
                      (Disconnect)
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${activeTab === 'browse' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Browse Campaigns
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${activeTab === 'map' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Visual Fund Tracker
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${activeTab === 'ledger' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                My Ledger ({myTransactions.length})
              </button>
            </div>
          </div>
        </div>

        {/* WEB3 WALLET BINDING BANNER (Hidden automatically when wallet is connected) */}
        {!isWalletConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-900/50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-trust-blue/20 border border-trust-blue/40 flex items-center justify-center text-trust-blue shadow-inner shrink-0">
                <Wallet size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-lg text-white">Connect MetaMask Wallet for Transparent ETH Donations</h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Connect your Web3 wallet (MetaMask) to view your ETH balance, broadcast smart contract donations on-chain, and record your verified ledger history.
                </p>
              </div>
            </div>
            <button
              onClick={() => connectWallet()}
              className="px-6 py-3.5 rounded-2xl bg-trust-blue hover:bg-trust-blue-hover text-white font-heading text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg glow-blue shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              <span>Connect MetaMask Wallet</span>
            </button>
          </motion.div>
        )}

        {/* WORKSPACE SWITCHER */}
        <div className="min-h-[480px]">
          <AnimatePresence mode="wait">

            {/* TAB 1: BROWSE CAMPAIGNS */}
            {activeTab === 'browse' && (
              <motion.div
                key="browse-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by keyword, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200 bg-white"
                  />
                </div>

                {/* Campaigns Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loadingCampaigns && campaigns.length === 0 ? (
                    <div className="col-span-3 py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RefreshCw className="animate-spin text-trust-blue" size={32} />
                      <span className="text-sm font-medium">Loading campaigns from system...</span>
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="col-span-3 py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <AlertCircle size={32} className="text-slate-300" />
                      <span className="text-sm font-medium">No campaigns found matching your query.</span>
                    </div>
                  ) : (
                    filteredCampaigns.map(c => {
                      const percent = Math.min(100, Math.round((c.raised / c.target) * 100));
                      return (
                        <div key={c.id} className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
                          {/* Compact Media Showcase */}
                          <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Category badge */}
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 border border-white/60 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                              <span className="text-[9px] font-bold tracking-wide text-slate-700">
                                {c.category}
                              </span>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 sm:p-5 flex flex-col flex-grow gap-2.5">
                            <div>
                              <h3 className="font-heading font-extrabold text-sm md:text-base text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-1">
                                {c.name}
                              </h3>
                              <p className="text-[10px] text-slate-400 mt-0.5">NGO: {c.ngoName}</p>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                              {c.description}
                            </p>

                            {/* Bottom metrics + action */}
                            <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-100">
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {c.raised} ETH
                                </span>
                                <span className="text-[9px] text-slate-400">Target: {c.target} ETH</span>
                              </div>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <button
                                onClick={() => setSelectedCampaign(c)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-heading text-[10px] font-bold text-white bg-slate-900 hover:bg-blue-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap"
                              >
                                <span>DONATE</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: VISUAL FUND TRACKER MAP */}
            {activeTab === 'map' && (
              <motion.div
                key="map-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col gap-4 shadow-sm h-fit">
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">Active Proposals Ledger</h3>
                  <div className="flex flex-col gap-2.5">
                    {campaigns.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setMapCampaignId(c.id);
                          setActiveMilestoneNode(null);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all duration-200 cursor-pointer ${mapCampaignId === c.id
                          ? 'bg-trust-blue-light border-trust-blue text-trust-blue shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                          }`}
                      >
                        <span className="block font-bold text-slate-900 mb-0.5">{c.name}</span>
                        <span className="text-[10px] text-slate-500">NGO Partner: {c.ngoName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-8 shadow-sm justify-between">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-slate-900">{selectedMapCampaign?.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Escrow Milestone Auditing Map. Select nodes to view certificates.</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
                      Smart Contract Escrow
                    </span>
                  </div>

                  <div className="relative py-12 flex justify-between items-center px-4 overflow-x-auto min-h-[220px]">
                    <div className="absolute left-[8%] right-[8%] top-[50%] -translate-y-1/2 z-0 h-1">
                      <svg className="w-full h-2 overflow-visible" fill="none">
                        <line
                          x1="0" y1="2" x2="100%" y2="2"
                          stroke="#e2e8f0" strokeWidth="3"
                        />
                        <line
                          x1="0" y1="2" x2="100%" y2="2"
                          stroke="#2563eb" strokeWidth="3"
                          className="animate-flow-line"
                        />
                      </svg>
                    </div>

                    {selectedMapCampaign?.milestones.map((m, idx) => {
                      const isReleased = m.status === 'Released';
                      const isApproved = m.status === 'Approved';

                      return (
                        <motion.div
                          key={m.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setActiveMilestoneNode({ ...m, index: idx + 1 })}
                          className="relative z-10 flex flex-col items-center cursor-pointer select-none group shrink-0 w-28 text-center"
                        >
                          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isReleased
                            ? 'bg-emerald-500 border-emerald-200 text-white shadow-lg glow-green'
                            : isApproved
                              ? 'bg-amber-400 border-amber-200 text-white shadow-lg glow-gold'
                              : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                            {isReleased ? (
                              <CheckCircle size={20} />
                            ) : isApproved ? (
                              <Clock size={20} />
                            ) : (
                              <span className="font-heading font-extrabold text-sm">{idx + 1}</span>
                            )}
                          </div>

                          <div className="mt-3">
                            <span className="block text-[10px] font-bold text-slate-800 line-clamp-1 group-hover:text-trust-blue">
                              {m.title}
                            </span>
                            <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">
                              {m.amount} ETH
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="min-h-[120px]">
                    <AnimatePresence mode="wait">
                      {activeMilestoneNode ? (
                        <motion.div
                          key={activeMilestoneNode.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-extrabold text-trust-blue tracking-wider">
                                Milestone Node Phase {activeMilestoneNode.index} Details
                              </span>
                              <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${activeMilestoneNode.status === 'Released'
                                ? 'bg-emerald-100 text-emerald-700'
                                : activeMilestoneNode.status === 'Approved'
                                  ? 'bg-amber-100 text-amber-700 animate-pulse'
                                  : 'bg-slate-200 text-slate-600'
                                }`}>
                                {activeMilestoneNode.status === 'Released' ? 'Released' : activeMilestoneNode.status === 'Approved' ? 'Pending Admin Audit' : 'Locked Escrow'}
                              </span>
                            </div>
                            <h4 className="font-heading font-bold text-sm text-slate-900 mt-1">{activeMilestoneNode.title}</h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xl">
                              {activeMilestoneNode.proofText || 'This milestone has not been submitted by the NGO yet. Escrow payout remains locked.'}
                            </p>
                          </div>

                          <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto md:text-right">
                            {/* Total Cost */}
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Milestone Cost</span>
                              <span className="font-heading font-extrabold text-lg text-slate-800">{activeMilestoneNode.amount} ETH</span>
                            </div>

                            {/* Your Contribution (FIFO Logic Display) */}
                            <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-left md:text-right">
                              <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Your Contribution Used</span>
                              <span className="font-heading font-extrabold text-base text-emerald-500">
                                {activeMilestoneNode.donorContribution || '0'} ETH
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 mt-1">
                              {activeMilestoneNode.proofDoc && (
                                <a
                                  href="/assets/images/3.png"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-center md:justify-end gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                                >
                                  <FileText size={12} className="text-slate-500" />
                                  <span>Inspect Receipt</span>
                                  <LinkIcon size={10} className="text-slate-400" />
                                </a>
                              )}
                              {activeMilestoneNode.transactionHash && (
                                <div className="text-[9px] text-slate-400 font-mono select-all truncate max-w-[200px] bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                  Tx: {activeMilestoneNode.transactionHash}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle size={16} className="text-slate-400" />
                          <span>Click any milestone bubble above to trace documentation and audit payouts.</span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: TRANSACTION HISTORY LEDGER */}
            {activeTab === 'ledger' && (
              <motion.div
                key="ledger-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-slate-900">Immutable Ledger Records</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Cryptographic transaction logs linked to connected wallet address.</p>
                  </div>
                </div>

                {myTransactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <FileText size={24} className="text-slate-300" />
                    <span>No donation records found. Complete a campaign contribution to generate ledger records.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="px-6 py-4">Transaction Hash</th>
                          <th className="px-6 py-4">Date Stamp</th>
                          <th className="px-6 py-4">Destination Campaign</th>
                          <th className="px-6 py-4 text-right">Value (ETH)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {myTransactions.map(tx => (
                          <tr key={tx.hash} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-mono text-[10px] text-slate-500 font-medium select-all max-w-[180px] truncate" title={tx.hash}>
                              {tx.hash}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium shrink-0">{tx.date}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800">{tx.campaignName}</span>
                              <span className="block text-[8px] text-slate-400 mt-0.5">ID: {tx.campaignId}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-heading font-extrabold text-trust-blue">{tx.amount} ETH</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* DONATE MODAL */}
        <DonationModal selectedCampaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />

      </div>
    </div>
  );
};