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
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);

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

  // Filter transactions strictly for the currently CONNECTED MetaMask wallet address
  const myTransactions = transactions.filter(t =>
    isWalletConnected &&
    walletAddress &&
    t.donorAddress &&
    t.donorAddress.toLowerCase() === walletAddress.toLowerCase()
  );

  const selectedMapCampaign = campaigns.find(c => c.id === mapCampaignId) || campaigns[0];

  const formatTruncatedAddress = (addr: string) => {
    if (!addr) return 'Not Connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Construct 4-stage milestones for selectedMapCampaign
  const targetVal = selectedMapCampaign?.target || 1.0;
  const quarterVal = parseFloat((targetVal * 0.25).toFixed(4));

  const mapPhases = [
    {
      id: 'm1',
      title: 'Phase 1: Initial Allocation',
      amount: quarterVal,
      status: 'Released',
      proofText: 'Phase 1 baseline site assessment, supply procurement, and initial infrastructure setup.',
      transactionHash: '0x73fc54df9e0b88f958bfbe2ba258b73b309d243e69b8ea727adeec27028aef19'
    },
    {
      id: 'm2',
      title: 'Phase 2: Intermediate Progress',
      amount: quarterVal,
      status: 'Approved',
      proofText: 'Mid-term milestone deployment, on-site audit verification, and equipment distribution.',
      transactionHash: '0x881ce4f7ba61997f412f09eb12a61f9c31fbaf8fda2ce3c3a8db8dbe03606d67'
    },
    {
      id: 'm3',
      title: 'Phase 3: Final Completion',
      amount: quarterVal,
      status: 'Pending',
      proofText: 'Final execution stage awaiting NGO field audit submission.',
      transactionHash: ''
    },
    {
      id: 'm4',
      title: 'Phase 4: Emergency / Unplanned Expense',
      amount: quarterVal,
      status: 'Pending',
      proofText: 'Contingency reserve locked in escrow for unforeseen field adjustments.',
      transactionHash: ''
    }
  ];

  // Dynamic FIFO Calculation for selectedNodeIndex against campaign donations & payouts
  const getFifoAuditData = (nodeIdx: number) => {
    if (!isWalletConnected || !walletAddress || !selectedMapCampaign) {
      return {
        allocatedAmount: 0,
        remainingEscrow: 0,
        badgeStatus: 'Locked in Escrow'
      };
    }

    const campaignDonations = transactions
      .filter(t => t.campaignId === selectedMapCampaign.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const donorDonations = campaignDonations.filter(
      t => t.donorAddress && t.donorAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    const donorTotalContribution = donorDonations.reduce((acc, curr) => acc + curr.amount, 0);

    if (donorTotalContribution === 0) {
      return {
        allocatedAmount: 0,
        remainingEscrow: 0,
        badgeStatus: 'Locked in Escrow'
      };
    }

    let cumulativeMs = 0;
    const msBounds = mapPhases.map(m => {
      const start = cumulativeMs;
      const end = start + m.amount;
      cumulativeMs = end;
      return { start, end, amount: m.amount };
    });

    let cumulativePool = 0;
    const donorIntervals: { start: number; end: number; isConnectedDonor: boolean }[] = [];

    campaignDonations.forEach(d => {
      const start = cumulativePool;
      const end = start + d.amount;
      cumulativePool = end;
      donorIntervals.push({
        start,
        end,
        isConnectedDonor: Boolean(d.donorAddress && d.donorAddress.toLowerCase() === walletAddress.toLowerCase())
      });
    });

    const targetMs = msBounds[nodeIdx] || { start: nodeIdx * quarterVal, end: (nodeIdx + 1) * quarterVal };
    let allocatedAmount = 0;

    donorIntervals.forEach(interval => {
      if (interval.isConnectedDonor) {
        const overlapStart = Math.max(interval.start, targetMs.start);
        const overlapEnd = Math.min(interval.end, targetMs.end);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        allocatedAmount += overlap;
      }
    });

    let cumulativeAllocatedUpToNode = 0;
    for (let k = 0; k <= nodeIdx; k++) {
      const ms = msBounds[k] || { start: k * quarterVal, end: (k + 1) * quarterVal };
      donorIntervals.forEach(interval => {
        if (interval.isConnectedDonor) {
          const overlapStart = Math.max(interval.start, ms.start);
          const overlapEnd = Math.min(interval.end, ms.end);
          const overlap = Math.max(0, overlapEnd - overlapStart);
          cumulativeAllocatedUpToNode += overlap;
        }
      });
    }

    const remainingEscrow = Math.max(0, donorTotalContribution - cumulativeAllocatedUpToNode);

    let badgeStatus = 'Locked in Escrow';
    if (allocatedAmount > 0) {
      if (remainingEscrow === 0) {
        badgeStatus = 'Fully Utilized';
      } else {
        badgeStatus = 'Partially Utilized';
      }
    }

    return {
      allocatedAmount,
      remainingEscrow,
      badgeStatus
    };
  };

  const activeFifoData = getFifoAuditData(selectedNodeIndex);
  const activeNode = mapPhases[selectedNodeIndex];
  const ngoWalletAddress = selectedMapCampaign?.ngoId || '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

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
                      const isGoalReached = c.raised >= c.target || (c as any).status === 'Funded' || (c as any).status === 'Completed';
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
                                  className={`h-full transition-all duration-500 ${isGoalReached ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  if (!isGoalReached) {
                                    setSelectedCampaign(c);
                                  }
                                }}
                                disabled={isGoalReached}
                                title={isGoalReached ? "Campaign target goal has been fully reached!" : undefined}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-heading text-[10px] font-bold shadow-sm transition-all duration-200 whitespace-nowrap ${
                                  isGoalReached
                                    ? 'opacity-60 cursor-not-allowed bg-slate-600 hover:bg-slate-600 text-white shadow-none'
                                    : 'text-white bg-slate-900 hover:bg-blue-600 hover:shadow-md cursor-pointer'
                                }`}
                              >
                                <span>{isGoalReached ? 'Goal Reached 🎉' : 'DONATE'}</span>
                                {!isGoalReached && <ArrowRight size={10} />}
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
                {/* Proposal selection sidebar */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col gap-4 shadow-sm h-fit">
                  <h3 className="font-heading font-extrabold text-sm text-slate-900">Active Proposals Ledger</h3>
                  <div className="flex flex-col gap-2.5">
                    {campaigns.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setMapCampaignId(c.id);
                          setSelectedNodeIndex(0);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all duration-200 cursor-pointer ${
                          mapCampaignId === c.id
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

                {/* 4-Stage Connected Milestone Map & Selected Node Audit Cards */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm justify-between">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-slate-900">{selectedMapCampaign?.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        4-Stage Escrow Milestone Auditing Map. Click any stage node to inspect Card A (FIFO Allocation) & Card B (NGO Payout).
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 shrink-0">
                      Smart Contract Escrow
                    </span>
                  </div>

                  {/* 4-STAGE CONNECTED MILESTONE NODE MAP */}
                  <div className="relative py-8 flex justify-between items-center px-4 overflow-x-auto min-h-[200px]">
                    <div className="absolute left-[8%] right-[8%] top-[40%] -translate-y-1/2 z-0 h-1">
                      <svg className="w-full h-2 overflow-visible" fill="none">
                        <line x1="0" y1="2" x2="100%" y2="2" stroke="#e2e8f0" strokeWidth="3" />
                        <line x1="0" y1="2" x2="100%" y2="2" stroke="#2563eb" strokeWidth="3" className="animate-flow-line" />
                      </svg>
                    </div>

                    {mapPhases.map((m, idx) => {
                      const isSelected = selectedNodeIndex === idx;
                      const isReleased = m.status === 'Released';
                      const isApproved = m.status === 'Approved';

                      return (
                        <motion.div
                          key={m.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedNodeIndex(idx)}
                          className="relative z-10 flex flex-col items-center cursor-pointer select-none group shrink-0 w-36 text-center"
                        >
                          <div
                            className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                              isSelected ? 'ring-4 ring-trust-blue/40 scale-110 shadow-xl' : ''
                            } ${
                              isReleased
                                ? 'bg-emerald-500 border-emerald-200 text-white shadow-lg glow-green'
                                : isApproved
                                ? 'bg-amber-400 border-amber-200 text-white shadow-lg glow-gold'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isReleased ? (
                              <CheckCircle size={22} />
                            ) : isApproved ? (
                              <Clock size={22} />
                            ) : (
                              <span className="font-heading font-extrabold text-base">{idx + 1}</span>
                            )}
                          </div>

                          <div className="mt-3">
                            <span
                              className={`block text-[11px] font-bold transition-colors line-clamp-1 ${
                                isSelected ? 'text-trust-blue' : 'text-slate-800 group-hover:text-trust-blue'
                              }`}
                            >
                              {m.title}
                            </span>
                            <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                              {m.amount} ETH
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* SELECTED NODE AUDIT CARDS (STRICTLY CARDS A & B ONLY) */}
                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    {/* CARD A: DONOR'S PERSONAL CONTRIBUTION (FIFO BREAKDOWN) */}
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-5 shadow-sm">
                      <div className="flex justify-between items-start gap-2 border-b border-slate-200/80 pb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-trust-blue">
                            Card A • Donor Personal Contribution
                          </span>
                          <h4 className="font-heading font-extrabold text-sm text-slate-900 mt-0.5">
                            FIFO Allocation Breakdown
                          </h4>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            activeFifoData.badgeStatus === 'Fully Utilized'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : activeFifoData.badgeStatus === 'Partially Utilized'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {activeFifoData.badgeStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            Allocated from Your Donation
                          </span>
                          <span className="font-heading font-extrabold text-lg text-emerald-600">
                            {activeFifoData.allocatedAmount.toFixed(4)} ETH
                          </span>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                            Remaining Balance in Escrow
                          </span>
                          <span className="font-heading font-extrabold text-lg text-slate-800">
                            {activeFifoData.remainingEscrow.toFixed(4)} ETH
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CARD B: NGO PAYOUT & ON-CHAIN SETTLEMENT */}
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-5 shadow-sm">
                      <div className="flex justify-between items-start gap-2 border-b border-slate-200/80 pb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                            Card B • NGO On-Chain Payout
                          </span>
                          <h4 className="font-heading font-extrabold text-sm text-slate-900 mt-0.5">
                            Settlement Information
                          </h4>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700">
                          {activeNode.status === 'Released' ? 'Settled On-Chain' : 'Escrow Pending'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">NGO Recipient Wallet</span>
                          <span
                            className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-[11px]"
                            title={selectedMapCampaign?.ngoName || 'Verified NGO'}
                          >
                            {ngoWalletAddress.length > 12 ? `${ngoWalletAddress.slice(0, 6)}...${ngoWalletAddress.slice(-4)}` : ngoWalletAddress}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Blockchain Payout Transaction Hash</span>
                          {activeNode.transactionHash ? (
                            <span
                              className="font-mono text-trust-blue font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] truncate max-w-[180px]"
                              title={activeNode.transactionHash}
                            >
                              {activeNode.transactionHash.slice(0, 8)}...{activeNode.transactionHash.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                              Pending Escrow Release
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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