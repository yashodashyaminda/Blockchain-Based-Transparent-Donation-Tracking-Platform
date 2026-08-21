import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import type { Campaign } from '../../context/Web3Context';
import { Award, AlertTriangle, Plus, ShieldCheck, FileText, UploadCloud, CheckCircle, RefreshCw, Wallet } from 'lucide-react';

export const NgoDashboard: React.FC = () => {
  const { campaigns, addCampaign, addMilestoneProof, isWalletConnected, walletAddress, bindWalletToProfile } = useWeb3();
  const { user, login } = useAuth();

  const isVerified = user?.isVerified || false;

  // Filter campaigns created by this NGO
  const myCampaigns = campaigns.filter(c => c.ngoId === user?.id);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resubmit state for rejected verification
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Sync profile details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        if (res.data && res.data.success) {
          login(localStorage.getItem('token') || '', res.data.data);
        }
      } catch (err) {
        console.error('Failed to sync profile status:', err);
      }
    };
    fetchProfile();
  }, []);

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

  // Trigger file selection programmatically when user clicks container
  const triggerProofUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setProofFileName(file.name);
      setProofUploadState('completed');
    }
  };

  // Milestone submit handler using FormData
  const handleMilestoneProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !selectedMilestoneId || !proofText || !selectedFile) return;

    setProofUploadState('uploading');
    setProofUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('campaignId', selectedCampaignId);
      formData.append('title', proofText); // Serves as title in proof model schema
      formData.append('file', selectedFile);

      setProofUploadProgress(50);

      const response = await axiosInstance.post('/proofs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProofUploadProgress(100);

      if (response.data && response.data.success) {
        // Also call Web3 local context sync to update UI state
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
        setSelectedFile(null);
        setProofUploadState('idle');

        setTimeout(() => setProofSubmittedSuccess(false), 4000);
      }
    } catch (err: any) {
      setProofUploadState('completed');
      alert(err.response?.data?.message || 'Failed to upload proof document');
    }
  };

  // Handle verification document re-submission when rejected
  const handleResubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitFile) return;

    setIsResubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', resubmitFile);

      const response = await axiosInstance.put('/auth/resubmit-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        alert('Document re-submitted successfully. Pending Admin review.');
        if (user) {
          login(localStorage.getItem('token') || '', {
            ...user,
            verificationStatus: 'Pending',
          });
        }
        setResubmitFile(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to re-submit document');
    } finally {
      setIsResubmitting(false);
    }
  };

  if (!isVerified) {
    const isRejected = user?.verificationStatus === 'Rejected';

    return (
      <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-6 md:px-12 relative flex items-center justify-center">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-trust-blue-light blur-[100px]" />
          <div className="absolute bottom-[30%] right-[5%] w-[300px] h-[300px] rounded-full bg-milestone-green-light blur-[100px]" />
        </div>

        {isRejected ? (
          <div className="max-w-md w-full bg-white border border-red-200 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-xl relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={32} className="animate-bounce" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">Registration Document Rejected</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your Registration Document was Rejected by Admin. Please upload a valid legal PDF or image verification document to request a re-audit.
              </p>
            </div>

            <form onSubmit={handleResubmitDocument} className="w-full flex flex-col gap-4">
              <input
                type="file"
                accept=".pdf,image/*"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.size > 1024 * 1024) {
                      alert('Verification document size must not exceed 1MB. Please select a smaller file.');
                      e.target.value = '';
                      setResubmitFile(null);
                      return;
                    }
                    setResubmitFile(file);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 border border-slate-200 rounded-xl p-1 bg-slate-50"
              />

              <button
                type="submit"
                disabled={!resubmitFile || isResubmitting}
                className="w-full py-3 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-red-600 shadow-md transition-all duration-300 disabled:bg-slate-300 cursor-pointer"
              >
                {isResubmitting ? 'Uploading to IPFS...' : 'Re-submit Verification Document'}
              </button>
            </form>

            <div className="w-full h-px bg-slate-100" />
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[10px] font-bold uppercase tracking-wider text-red-700">
              Current Status: Action Required (Rejected)
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full bg-white border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-xl glow-gold relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={32} className="animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">NGO Verification Pending</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your registration documents are currently being audited by System Administrators. You cannot create campaigns or upload milestone proofs until an Admin approves your organization's profile.
              </p>
            </div>
            <div className="w-full h-px bg-slate-100" />
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100/50 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Current Status: Auditing Profile Queue
            </div>
          </div>
        )}
      </div>
    );
  }

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
                  {user?.name || 'My NGO Hub'}
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
                Official Email: {user?.email || 'N/A'} • Bound NGO Wallet: <span className="font-mono text-slate-700 font-semibold">{walletAddress || user?.walletAddress || 'Unbound'}</span>
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

        {/* WORKSPACE AREA */}
        <div className="relative">
          {/* MAIN COMPONENTS GRID */}
          <div className="grid lg:grid-cols-12 gap-8">
            
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
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                      />
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
