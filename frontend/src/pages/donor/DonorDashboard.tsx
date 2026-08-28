import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import type { Campaign } from '../../context/Web3Context';
import { Search, Wallet, FileText, CheckCircle, Clock, Link as LinkIcon, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { DonationModal } from '../../components/DonationModal';

interface DonorDashboardProps {
  preSelectedCampaignId: string | null;
  setPreSelectedCampaignId: (id: string | null) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ preSelectedCampaignId, setPreSelectedCampaignId }) => {
  const { campaigns, isWalletConnected, walletAddress, connectWallet, disconnectWallet, transactions, refreshCampaigns } = useWeb3();
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
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [campaignProofs, setCampaignProofs] = useState<any[]>([]);

  // Reset carousel when node changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedNodeIndex]);

  // Set default map campaign ID once campaigns are loaded
  useEffect(() => {
    if (campaigns.length > 0 && !mapCampaignId) {
      setMapCampaignId(campaigns[0].id);
    }
  }, [campaigns, mapCampaignId]);

  const selectedMapCampaign = campaigns.find(c => c.id === mapCampaignId) || campaigns[0];

  // Fetch NGO Proof Requests for the selected visual tracker campaign
  useEffect(() => {
    const targetId = mapCampaignId || selectedMapCampaign?.id;
    if (targetId) {
      axiosInstance.get(`/proofs/campaign/${targetId}`)
        .then(res => {
          if (res.data && res.data.success) {
            setCampaignProofs(res.data.data);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch campaign proof requests in DonorDashboard:', err);
        });
    }
  }, [mapCampaignId, selectedMapCampaign?.id, activeTab]);

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

  const formatTruncatedAddress = (addr: string) => {
    if (!addr) return 'Not Connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Construct 4-stage connected milestones linked to real NGO proof requests
  const targetVal = selectedMapCampaign?.target || 1.0;

  // Helper to flexibly match proof phase strings (e.g., Emergency / Unplanned Expense vs Phase 4: Emergency...)
  const isPhaseMatch = (proofPhase: string, targetPhaseTitle: string) => {
    if (!proofPhase || !targetPhaseTitle) return false;
    const normProof = proofPhase.toLowerCase().trim();
    const normTarget = targetPhaseTitle.toLowerCase().trim();

    if (normProof === normTarget) return true;
    if (normTarget.includes('emergency') && normProof.includes('emergency')) return true;
    if (normTarget.includes('phase 1') && normProof.includes('phase 1')) return true;
    if (normTarget.includes('phase 2') && normProof.includes('phase 2')) return true;
    if (normTarget.includes('phase 3') && normProof.includes('phase 3')) return true;

    return false;
  };

  // Rule 1: Phase 3 Dynamic Cap = Target - (Phase 1 + Phase 2 + Phase 4)
  const getPhaseClaimedTotal = (phaseTitle: string) => {
    return campaignProofs
      .filter((p: any) => p.milestonePhase && isPhaseMatch(p.milestonePhase, phaseTitle) && !p.isRejected)
      .reduce((sum: number, p: any) => sum + (p.amountRequested || 0), 0);
  };

  const p1Claimed = getPhaseClaimedTotal('Phase 1: Initial Allocation');
  const p2Claimed = getPhaseClaimedTotal('Phase 2: Intermediate Progress');
  const p4Claimed = getPhaseClaimedTotal('Emergency / Unplanned Expense');
  const phase3DynamicCap = Math.max(0, targetVal - (p1Claimed + p2Claimed + p4Claimed));

  const phaseConfig = [
    { id: 'm1', title: 'Phase 1: Initial Allocation', capAmount: parseFloat((targetVal * 0.25).toFixed(4)) },
    { id: 'm2', title: 'Phase 2: Intermediate Progress', capAmount: parseFloat((targetVal * 0.25).toFixed(4)) },
    { id: 'm3', title: 'Phase 3: Final Completion', capAmount: parseFloat(phase3DynamicCap.toFixed(4)) },
    { id: 'm4', title: 'Phase 4: Emergency / Unplanned Expense', capAmount: parseFloat((targetVal * 0.25).toFixed(4)) },
  ];

  const mapPhases = phaseConfig.map((phase) => {
    const capAmount = phase.capAmount;

    // Match proof requests for this phase flexibly
    const matchingProofs = campaignProofs.filter((p: any) =>
      p.milestonePhase && isPhaseMatch(p.milestonePhase, phase.title)
    );

    const approvedProofs = matchingProofs.filter((p: any) => p.isApproved);
    const pendingProofs = matchingProofs.filter((p: any) => !p.isApproved && !p.isRejected);
    const allRelevantProofs = [...approvedProofs, ...pendingProofs];

    const approvedProof = approvedProofs[0];
    const pendingProof = pendingProofs[0];
    const activeProof = approvedProof || pendingProof || matchingProofs[0];

    // Sum of requested/released amounts from NGO proof claims
    const totalAmountRequested = matchingProofs.reduce((sum: number, p: any) => sum + (p.amountRequested || 0), 0);
    const totalAmountApproved = approvedProofs.reduce((sum: number, p: any) => sum + (p.amountRequested || 0), 0);

    const displayRequested = approvedProof
      ? totalAmountApproved
      : (pendingProof || matchingProofs.length > 0)
      ? totalAmountRequested
      : 0;

    let status = 'Pending';
    if (approvedProof) {
      status = 'Released'; // Green / Checkmark badge
    } else if (pendingProof || matchingProofs.length > 0) {
      status = 'Approved'; // Yellow / Clock badge
    }

    const proofText = activeProof?.title || activeProof?.description || 'Milestone execution awaiting proof upload.';
    const transactionHash = activeProof?.payoutTxHash || activeProof?.transactionHash || '';
    const ngoWallet = activeProof?.ngoWallet || (typeof selectedMapCampaign?.ngoId === 'string' && selectedMapCampaign.ngoId.startsWith('0x') ? selectedMapCampaign.ngoId : ((selectedMapCampaign as any)?.ngoWallet || ''));

    return {
      id: phase.id,
      title: phase.title,
      amount: capAmount,
      capAmount,
      displayRequested,
      status,
      isApproved: Boolean(approvedProof),
      isPending: Boolean(pendingProof),
      activeProof,
      allRelevantProofs,
      proofText,
      transactionHash,
      ngoWallet: ngoWallet || '',
    };
  });

  // Dynamic Calculation for campaign donations & payouts
  const getFifoAuditData = (nodeIdx: number) => {
    if (!isWalletConnected || !walletAddress || !selectedMapCampaign) {
      return {
        allocatedAmount: 0,
        remainingEscrow: 0,
        badgeStatus: '100% LOCKED IN ESCROW'
      };
    }

    const campaignDonations = transactions.filter(t => t.campaignId === selectedMapCampaign.id);
    const donorDonations = campaignDonations.filter(
      t => t.donorAddress && t.donorAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    const donorTotalContribution = donorDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const donorTotalAllocated = donorDonations.reduce((acc, curr) => acc + (curr.allocatedAmount || 0), 0);

    if (donorTotalContribution === 0) {
      return {
        allocatedAmount: 0,
        remainingEscrow: 0,
        badgeStatus: '100% LOCKED IN ESCROW'
      };
    }

    const remainingEscrow = Math.max(0, donorTotalContribution - donorTotalAllocated);

    let badgeStatus = '100% LOCKED IN ESCROW';
    if (donorTotalAllocated > 0) {
      if (remainingEscrow === 0) {
        badgeStatus = 'FULLY UTILIZED';
      } else {
        badgeStatus = 'PARTIALLY UTILIZED';
      }
    }

    return {
      allocatedAmount: donorTotalAllocated,
      remainingEscrow,
      badgeStatus
    };
  };

  const activeFifoData = getFifoAuditData(selectedNodeIndex);
  const activeNode = mapPhases[selectedNodeIndex];

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
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm justify-between relative overflow-hidden">
                  
                  {/* Subtle Light Blur Overlay ONLY on Smart Contract Escrow Audit Box when disconnected */}
                  {(!isWalletConnected || !walletAddress) && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-slate-900/5 backdrop-blur-[3px] rounded-3xl">
                      <span className="font-heading font-extrabold text-sm md:text-base text-slate-800 bg-white/90 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm tracking-wide">
                        Must Connect Wallet
                      </span>
                    </div>
                  )}

                  {/* Inner Audit Card Content (Subtle blur when disconnected) */}
                  <div className={`flex flex-col gap-6 h-full justify-between transition-all duration-300 ${(!isWalletConnected || !walletAddress) ? 'filter blur-[3px] opacity-50 select-none pointer-events-none' : ''}`}>
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
                      const isReleased = m.isApproved;
                      const isPending = m.isPending;

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
                                : isPending
                                ? 'bg-amber-400 border-amber-200 text-white shadow-lg glow-gold animate-pulse'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isReleased ? (
                              <CheckCircle size={22} />
                            ) : isPending ? (
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
                            <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                              {m.displayRequested > 0 ? `${m.displayRequested}` : `0`} / {m.capAmount} Cap
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
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            activeNode.isApproved && activeNode.transactionHash
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : activeNode.activeProof
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}>
                            {activeNode.isApproved && activeNode.transactionHash
                              ? 'SETTLED ON-CHAIN'
                              : activeNode.activeProof
                              ? 'AWAITING ADMIN APPROVAL'
                              : 'PHASE LOCKED'}
                          </span>
                          {activeNode.allRelevantProofs && activeNode.allRelevantProofs.length > 1 && (
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                                disabled={carouselIndex === 0}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-[10px] cursor-pointer"
                              >
                                ←
                              </button>
                              <span className="text-[10px] font-bold text-slate-500">
                                {carouselIndex + 1} / {activeNode.allRelevantProofs.length}
                              </span>
                              <button
                                onClick={() => setCarouselIndex((prev) => Math.min(activeNode.allRelevantProofs.length - 1, prev + 1))}
                                disabled={carouselIndex === activeNode.allRelevantProofs.length - 1}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-[10px] cursor-pointer"
                              >
                                →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const displayedProof = activeNode.allRelevantProofs && activeNode.allRelevantProofs.length > 0
                          ? activeNode.allRelevantProofs[carouselIndex]
                          : activeNode.activeProof;
                        
                        const displayedTxHash = displayedProof?.payoutTxHash || displayedProof?.transactionHash || activeNode.transactionHash;
                        const displayedWallet = displayedProof?.ngoWallet || activeNode.ngoWallet;
                        const isDisplayedApproved = displayedProof?.isApproved || (displayedProof === undefined && activeNode.isApproved);

                        return (
                          <div className="flex flex-col gap-3.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-semibold">NGO Recipient Wallet</span>
                              {displayedWallet && displayedWallet.startsWith('0x') ? (
                                <span
                                  className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-[11px]"
                                  title={displayedWallet}
                                >
                                  {displayedWallet.length > 12 ? `${displayedWallet.slice(0, 6)}...${displayedWallet.slice(-4)}` : displayedWallet}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px] bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60">
                                  Pending NGO Claim Submission
                                </span>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-semibold">Blockchain Payout Transaction Hash</span>
                              {isDisplayedApproved && displayedTxHash ? (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${displayedTxHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-trust-blue hover:underline font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] truncate max-w-[180px] flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title={`View on Explorer: ${displayedTxHash}`}
                                >
                                  <span>{displayedTxHash.slice(0, 8)}...{displayedTxHash.slice(-6)}</span>
                                  <LinkIcon size={11} className="shrink-0 text-trust-blue" />
                                </a>
                              ) : displayedProof ? (
                                <span className="text-amber-700 font-bold italic text-[11px] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                                  Awaiting Admin Release
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px] bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60">
                                  Awaiting Proof Upload
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
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