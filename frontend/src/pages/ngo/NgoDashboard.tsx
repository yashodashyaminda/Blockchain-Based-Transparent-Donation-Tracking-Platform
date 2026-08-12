import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import type { Campaign } from '../../context/Web3Context';
import { Award, AlertTriangle, Plus, ShieldCheck, FileText, UploadCloud, CheckCircle, RefreshCw, Wallet } from 'lucide-react';

export const NgoDashboard: React.FC = () => {
  const { activeNgoId, ngos, campaigns, addCampaign, addMilestoneProof, isWalletConnected, walletAddress, bindWalletToProfile } = useWeb3();

  // Find active NGO profile details
  const activeNgo = ngos.find(n => n.id === activeNgoId) || ngos[0]; // fallback
  const isVerified = activeNgo?.isVerified || false;

  // Filter campaigns created by this NGO
  const myCampaigns = campaigns.filter(c => c.ngoId === activeNgo?.id);

  // Form states: Add Project
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTarget, setProjTarget] = useState('');
  const [projCat, setProjCat] = useState<Campaign['category']>('Education');
  const [projectCreatedSuccess, setProjectCreatedSuccess] = useState(false);

  // Form states: Milestone Proof Submission
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [proofText, setProofText] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [proofUploadState, setProofUploadState] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [proofSubmittedSuccess, setProofSubmittedSuccess] = useState(false);

  // Selected Campaign milestones lookup helper
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const pendingMilestones = selectedCampaign?.milestones.filter(m => m.status === 'Pending') || [];

  // Project creation submit handler
  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projDesc || !projTarget) return;

    addCampaign(
      projName,
      projCat,
      projDesc,
      '/assets/images/4.png',
      parseFloat(projTarget)
    );

    setProjectCreatedSuccess(true);
    setProjName('');
    setProjDesc('');
    setProjTarget('');
    setProjCat('Education');

    setTimeout(() => setProjectCreatedSuccess(false), 4000);
  };

  // Drag over proof upload helper
  const triggerProofUpload = () => {
    if (proofUploadState !== 'idle') return;
    setProofUploadState('uploading');
    setProofUploadProgress(0);
    setProofFileName('milestone_contract_invoice_IPFS.pdf');

    const interval = setInterval(() => {
      setProofUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProofUploadState('completed');
          return 100;
        }
        return prev + 20;
      });
    }, 1500);
  };

  // Milestone submit handler
  const handleMilestoneProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !selectedMilestoneId || !proofText || proofUploadState !== 'completed') return;

    addMilestoneProof(
      selectedCampaignId,
      selectedMilestoneId,
      proofText,
      proofFileName
    );

    setProofSubmittedSuccess(true);
    setSelectedCampaignId('');
    setSelectedMilestoneId('');
    setProofText('');
    setProofFileName('');
    setProofUploadState('idle');

    setTimeout(() => setProofSubmittedSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-6 md:px-12 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-trust-blue-light blur-[100px]" />
        <div className="absolute bottom-[30%] right-[5%] w-[300px] h-[300px] rounded-full bg-milestone-green-light blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* NGO Profile Header Banner */}
        <div className="cinematic-glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-trust-blue flex items-center justify-center text-white shadow-md">
              <Award size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900">
                  {activeNgo?.name || 'My NGO Hub'}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isVerified 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official Email: {activeNgo?.email || 'N/A'} • Bound NGO Wallet: <span className="font-mono text-slate-700 font-semibold">{walletAddress || activeNgo?.wallet || 'Unbound'}</span>
              </p>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center shrink-0">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">My Projects</span>
              <span className="font-heading font-extrabold text-lg text-slate-800">{myCampaigns.length}</span>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center shrink-0">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Audit Status</span>
              <span className={`font-heading font-extrabold text-sm ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isVerified ? 'Clear' : 'Auditing'}
              </span>
            </div>
          </div>
        </div>

        {/* POST-LOGIN WEB3 WALLET BINDING BANNER */}
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
                  <h3 className="font-heading font-extrabold text-lg text-white">Bind NGO Web3 Wallet</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-trust-blue/20 text-blue-300 border border-blue-400/30">Action Needed</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Connect your organizational wallet address to receive milestone payouts automatically when milestone proofs are audited and released by system administrators.
                </p>
              </div>
            </div>
            <button
              onClick={() => bindWalletToProfile()}
              className="px-6 py-3.5 rounded-2xl bg-trust-blue hover:bg-trust-blue-hover text-white font-heading text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg glow-blue shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              <span>Connect & Bind NGO Wallet</span>
            </button>
          </motion.div>
        )}

        {/* WORKSPACE AREA WITH STATE LOCK OVERLAY */}
        <div className="relative">
          <AnimatePresence>
            {!isVerified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-white/60 backdrop-blur-[4px] rounded-3xl flex items-center justify-center p-6 border border-slate-100/50 shadow-inner"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className="max-w-md bg-white border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-xl glow-gold"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
                    <AlertTriangle size={24} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading font-extrabold text-lg text-slate-900">NGO Verification Pending</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your registration documents are currently being audited by System Administrators. Campaign creation and milestone proof submission will activate automatically once approved.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100/50 text-[10px] font-semibold text-amber-700">
                    Audit queue position: #2 in progress
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN COMPONENTS GRID */}
          <div className={`grid lg:grid-cols-12 gap-8 ${!isVerified ? 'pointer-events-none select-none filter blur-[1px]' : ''}`}>
            
            {/* MODULE A: ADD PROJECT PLATFORM FORM */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Plus size={18} className="text-trust-blue" />
                    <span>Launch Campaign Proposal</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Initiate a legal ledger donation contract.</p>
                </div>

                <form onSubmit={handleAddProjectSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Project Name</label>
                    <input
                      type="text"
                      required
                      disabled={!isVerified}
                      placeholder="e.g. Clean Energy Grid"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target Fund Cap ($)</label>
                      <input
                        type="number"
                        required
                        disabled={!isVerified}
                        placeholder="e.g. 5000"
                        value={projTarget}
                        onChange={(e) => setProjTarget(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Category badge</label>
                      <select
                        value={projCat}
                        disabled={!isVerified}
                        onChange={(e) => setProjCat(e.target.value as Campaign['category'])}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white"
                      >
                        <option value="Education">Education</option>
                        <option value="Health">Health</option>
                        <option value="Disaster Relief">Disaster Relief</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Detailed Description</label>
                    <textarea
                      required
                      rows={3}
                      disabled={!isVerified}
                      placeholder="Explain the scope and fund usage..."
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Campaign Image Showcase</label>
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100/50 transition-colors duration-200">
                      <UploadCloud size={14} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium">Automatic placeholder assigned (heartwarming photograph)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isVerified || projectCreatedSuccess}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-trust-blue shadow-md transition-all duration-300 mt-2 cursor-pointer"
                  >
                    {projectCreatedSuccess ? (
                      <>
                        <CheckCircle size={14} className="text-emerald-300" />
                        <span>Campaign Launched Successfully</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Launch Campaign</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* MODULE B: ADD MILESTONE PROOF DISPATCHER */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-milestone-green" />
                    <span>Milestone Proof Dispatcher</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Upload milestone evidence to unlock the next fund allocation.</p>
                </div>

                <form onSubmit={handleMilestoneProofSubmit} className="flex flex-col gap-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Select Campaign</label>
                      <select
                        required
                        disabled={!isVerified}
                        value={selectedCampaignId}
                        onChange={(e) => {
                          setSelectedCampaignId(e.target.value);
                          setSelectedMilestoneId('');
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white"
                      >
                        <option value="">-- Choose Campaign --</option>
                        {myCampaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target Milestone Phase</label>
                      <select
                        required
                        disabled={!isVerified || !selectedCampaignId}
                        value={selectedMilestoneId}
                        onChange={(e) => setSelectedMilestoneId(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white disabled:opacity-50"
                      >
                        <option value="">-- Choose Milestone --</option>
                        {pendingMilestones.map(m => (
                          <option key={m.id} value={m.id}>{m.title} (${m.amount.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Proof Evidence Details</label>
                    <textarea
                      required
                      rows={3}
                      disabled={!isVerified || !selectedMilestoneId}
                      placeholder="Describe work completed, lists items purchased, and details milestones reached..."
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Upload Receipts / Document Proof</label>
                    
                    <div
                      onClick={triggerProofUpload}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[120px] ${
                        !selectedMilestoneId
                          ? 'opacity-40 pointer-events-none bg-slate-100/50 border-slate-200'
                          : proofUploadState === 'completed'
                          ? 'border-milestone-green bg-emerald-50/10'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-trust-blue'
                      }`}
                    >
                      {proofUploadState === 'idle' && (
                        <div className="flex flex-col items-center gap-1.5">
                          <UploadCloud size={18} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">Click to upload milestone invoice / proof document</span>
                          <span className="text-[9px] text-slate-400">Simulates decentralized IPFS uploading node</span>
                        </div>
                      )}

                      {proofUploadState === 'uploading' && (
                        <div className="flex flex-col items-center gap-2.5 w-full max-w-[80%]">
                          <RefreshCw className="animate-spin text-trust-blue" size={18} />
                          <div className="w-full flex flex-col gap-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-500">
                              <span>DEPLOYING TO INTERPLANETARY FILE SYSTEM (IPFS)...</span>
                              <span>{proofUploadProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                              <div className="h-full bg-trust-blue" style={{ width: `${proofUploadProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {proofUploadState === 'completed' && (
                        <div className="flex items-center gap-3 w-full px-4 text-left">
                          <FileText size={16} className="text-emerald-600" />
                          <div className="flex-grow">
                            <span className="block text-[10px] font-bold text-slate-800">{proofFileName}</span>
                            <span className="block text-[8px] text-slate-400">IPFS CID: QmYwAPJzn5KSXn...</span>
                          </div>
                          <CheckCircle className="text-emerald-500" size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isVerified || !selectedMilestoneId || proofUploadState !== 'completed' || proofSubmittedSuccess}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-milestone-green shadow-md transition-all duration-300 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {proofSubmittedSuccess ? (
                      <>
                        <CheckCircle size={14} className="text-emerald-300" />
                        <span>Proof Dispatched to System Auditors</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Milestone Proof</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

        {/* ACTIVE PROJECTS LISTINGS */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900">My Campaign Registries</h3>
            <p className="text-xs text-slate-400 mt-1">Review active contracts and milestone releases.</p>
          </div>

          {myCampaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
              No campaign profiles created. Launch a campaign proposal above to see them in this ledger.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {myCampaigns.map(c => {
                const percent = Math.min(100, Math.round((c.raised / c.target) * 100));
                return (
                  <div key={c.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-base text-slate-900">{c.name}</h4>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">ID: {c.id}</span>
                      </div>
                      <span className="text-xs font-bold text-trust-blue bg-white border border-slate-200 px-3 py-1 rounded-xl">
                        Target: ${c.target.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>Fundraising Progress</span>
                        <span>{percent}% ({c.raised.toLocaleString()} raised)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full bg-trust-blue" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Milestone Audit Steps</span>
                      <div className="flex flex-col gap-1.5">
                        {c.milestones.map((m, idx) => (
                          <div key={m.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                            <span className="font-medium text-slate-700 line-clamp-1">{idx+1}. {m.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500">${m.amount.toLocaleString()}</span>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                m.status === 'Released'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : m.status === 'Approved'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {m.status === 'Released' ? 'Released' : m.status === 'Approved' ? 'Pending Approval' : 'Locked'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
