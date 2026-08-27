import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import type { Campaign } from '../../context/Web3Context';
import { Award, AlertTriangle, AlertCircle, Plus, ShieldCheck, FileText, UploadCloud, CheckCircle, RefreshCw, Wallet } from 'lucide-react';

export const NgoDashboard: React.FC = () => {
  const { addMilestoneProof, isWalletConnected, walletAddress, connectWallet, disconnectWallet, refreshCampaigns } = useWeb3();
  const { user, login } = useAuth();

  const isVerified = user?.isVerified || false;

  const [fetchedCampaigns, setFetchedCampaigns] = useState<Campaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(true);

  const fetchCampaignsData = async () => {
    setIsLoadingCampaigns(true);
    try {
      const response = await axiosInstance.get('/campaigns');
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((c: any) => ({
          id: c._id,
          name: c.title,
          category: c.category || 'Education',
          description: c.description,
          image: c.coverImageIPFSHash ? `https://gateway.pinata.cloud/ipfs/${c.coverImageIPFSHash}` : '/assets/images/4.png',
          target: c.targetAmount || 0,
          raised: c.raisedAmount || 0,
          ngoId: c.ngoId?._id || c.ngoId,
          ngoName: c.ngoId?.name || 'Verified NGO',
          milestones: c.milestones || [],
        }));
        setFetchedCampaigns(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns in NgoDashboard:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const [ngoProofs, setNgoProofs] = useState<any[]>([]);
  const [isRejectedPopupOpen, setIsRejectedPopupOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);

  const fetchProofsData = async () => {
    try {
      const response = await axiosInstance.get('/proofs/ngo');
      if (response.data && response.data.success) {
        setNgoProofs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch NGO proofs:', err);
    }
  };

  useEffect(() => {
    fetchCampaignsData();
    fetchProofsData();
  }, [user]);

  // Filter campaigns created by this NGO
  const myCampaigns = fetchedCampaigns.filter(c => c.ngoId === user?.id);
  const rejectedProofs = ngoProofs.filter((p: any) => p.isRejected);

  // Form states: Add Project
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTarget, setProjTarget] = useState('');
  const [projCat, setProjCat] = useState<Campaign['category']>('Education');
  const [projectCreatedSuccess, setProjectCreatedSuccess] = useState(false);
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignFileName, setCampaignFileName] = useState('');
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const campaignFileInputRef = useRef<HTMLInputElement>(null);

  // Form states: Milestone Proof Submission
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [milestonePhase, setMilestonePhase] = useState('Phase 1: Initial Allocation');
  const [amountRequested, setAmountRequested] = useState('');
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
          const profileData = {
            ...res.data.data,
            id: res.data.data._id || res.data.data.id
          };
          login(localStorage.getItem('token') || '', profileData);
        }
      } catch (err) {
        console.error('Failed to sync profile status:', err);
      }
    };
    fetchProfile();
  }, []);


  // Project creation submit handler
  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projDesc || !projTarget) {
      alert('Please fill out all fields');
      return;
    }

    if (!campaignFile) {
      alert('Please upload a cover image file for the campaign proposal');
      return;
    }

    setIsLaunchingCampaign(true);
    try {
      const formData = new FormData();
      formData.append('title', projName);
      formData.append('description', projDesc);
      formData.append('targetAmount', projTarget);
      formData.append('category', projCat);
      formData.append('file', campaignFile);

      const response = await axiosInstance.post('/campaigns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setProjectCreatedSuccess(true);
        setProjName('');
        setProjDesc('');
        setProjTarget('');
        setProjCat('Education');
        setCampaignFile(null);
        setCampaignFileName('');

        // Reload the dynamic campaigns list to update "My Projects" counts instantly
        await refreshCampaigns();
        await fetchCampaignsData();

        alert('Campaign Proposal Launched successfully!');
        setTimeout(() => setProjectCreatedSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to launch campaign proposal');
    } finally {
      setIsLaunchingCampaign(false);
    }
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
    if (!selectedCampaignId || !milestonePhase || !amountRequested || !proofText || !selectedFile) return;

    setProofUploadState('uploading');
    setProofUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('campaignId', selectedCampaignId);
      formData.append('milestonePhase', milestonePhase);
      formData.append('amountRequested', amountRequested);
      formData.append('title', proofText);
      
      const activeWallet = (isWalletConnected && walletAddress ? walletAddress : user?.walletAddress || '').toLowerCase();
      if (activeWallet) {
        formData.append('ngoWallet', activeWallet);
      }
      
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
        const campaign = fetchedCampaigns.find(c => c.id === selectedCampaignId);
        const matchedMilestone = campaign?.milestones.find(m => m.title.toLowerCase().includes(milestonePhase.toLowerCase()));
        const targetMilestoneId = matchedMilestone?.id || (campaign?.milestones[0]?.id) || 'm1';

        addMilestoneProof(
          selectedCampaignId,
          targetMilestoneId,
          proofText,
          proofFileName
        );
        await fetchCampaignsData();
        await fetchProofsData();

        setProofSubmittedSuccess(true);
        setSelectedCampaignId('');
        setMilestonePhase('Phase 1: Initial Allocation');
        setAmountRequested('');
        setProofText('');
        setProofFileName('');
        setSelectedFile(null);
        setProofUploadState('idle');

        setTimeout(() => setProofSubmittedSuccess(false), 4000);
      }
    } catch (err: any) {
      setProofUploadState('completed');
      const msg = err.response?.data?.message || 'Failed to upload proof document';
      setErrorModalMessage(msg);
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
                  NGO Tracking Room
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isVerified
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                  {isVerified ? 'VERIFIED PARTNER' : 'VERIFICATION PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Account: <span className="font-semibold text-slate-800">{user?.name || 'My NGO Hub'}</span> ({user?.email || 'ngo@email.com'})
                {isWalletConnected && (
                  <>
                    {' • '}
                    Bound NGO Wallet: <span className="font-mono text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200" title={walletAddress || user?.walletAddress}>
                      {(walletAddress || user?.walletAddress || '').slice(0, 6)}...{(walletAddress || user?.walletAddress || '').slice(-4)}
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

          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-center shrink-0 flex flex-col items-center justify-center relative">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">My Projects</span>
              <div className="flex items-center gap-2 justify-center">
                {rejectedProofs.length > 0 && (
                  <button
                    onClick={() => setIsRejectedPopupOpen(true)}
                    className="text-red-500 hover:text-red-600 transition-colors animate-pulse cursor-pointer flex items-center justify-center"
                    title="Click to view rejected milestone proofs details"
                  >
                    <AlertTriangle size={15} />
                  </button>
                )}
                <span className="font-heading font-extrabold text-lg text-slate-800">{myCampaigns.length}</span>
              </div>
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
              onClick={connectWallet}
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
            <div className="lg:col-span-6 flex flex-col gap-6">
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
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target Fund Cap (ETH)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        disabled={!isVerified}
                        placeholder="e.g. 5000"
                        maxLength={10}
                        value={projTarget}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 10 && /^[0-9]*\.?[0-9]*$/.test(val)) {
                            setProjTarget(val);
                          }
                        }}
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
                    <div
                      onClick={() => campaignFileInputRef.current?.click()}
                      className="border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100/50 transition-colors duration-200"
                    >
                      <UploadCloud size={14} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {campaignFileName ? `Selected: ${campaignFileName}` : 'Select Campaign Cover Image (Max 1MB)'}
                      </span>
                    </div>
                    <input
                      type="file"
                      ref={campaignFileInputRef}
                      accept="image/*"
                      disabled={!isVerified}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          if (file.size > 1024 * 1024) {
                            alert('Campaign cover image must not exceed 1MB. Please select a smaller file.');
                            e.target.value = '';
                            setCampaignFile(null);
                            setCampaignFileName('');
                            return;
                          }
                          setCampaignFile(file);
                          setCampaignFileName(file.name);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isVerified || projectCreatedSuccess || isLaunchingCampaign}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-trust-blue shadow-md transition-all duration-300 mt-2 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {isLaunchingCampaign ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-white" />
                        <span>Launching & Uploading to IPFS...</span>
                      </>
                    ) : projectCreatedSuccess ? (
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
            <div className="lg:col-span-6 flex flex-col gap-6">

              <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-milestone-green" />
                    <span>Milestone Proof Dispatcher</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Upload milestone evidence to unlock the next fund allocation.</p>
                </div>

                <form onSubmit={handleMilestoneProofSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5" title={!isWalletConnected ? "Connect wallet firstly" : undefined}>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Select Campaign</label>
                    <select
                      required
                      disabled={!isVerified || !isWalletConnected}
                      value={selectedCampaignId}
                      onChange={(e) => {
                        setSelectedCampaignId(e.target.value);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!isWalletConnected ? '-- Connect Wallet Firstly --' : '-- Choose Campaign --'}
                      </option>
                      {myCampaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5" title={!isWalletConnected ? "Connect wallet firstly" : undefined}>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target Milestone Phase</label>
                      {(() => {
                        const selectedCampaignProofs = ngoProofs.filter((p: any) =>
                          (p.campaignId?._id === selectedCampaignId || p.campaignId === selectedCampaignId) && !p.isRejected
                        );
                        const hasPhase1Submitted = selectedCampaignProofs.some((p: any) =>
                          p.milestonePhase && p.milestonePhase.toLowerCase().includes('phase 1')
                        );
                        const hasPhase2Submitted = selectedCampaignProofs.some((p: any) =>
                          p.milestonePhase && p.milestonePhase.toLowerCase().includes('phase 2')
                        );

                        return (
                          <select
                            required
                            disabled={!isVerified || !isWalletConnected || !selectedCampaignId}
                            value={milestonePhase}
                            onChange={(e) => setMilestonePhase(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="Phase 1: Initial Allocation">Phase 1: Initial Allocation</option>
                            <option value="Phase 2: Intermediate Progress" disabled={!hasPhase1Submitted}>
                              Phase 2: Intermediate Progress {!hasPhase1Submitted ? '(Must complete Phase 1 first)' : ''}
                            </option>
                            <option value="Phase 3: Final Completion" disabled={!hasPhase1Submitted || !hasPhase2Submitted}>
                              Phase 3: Final Completion {!hasPhase1Submitted || !hasPhase2Submitted ? '(Must complete Phase 1 & 2 first)' : ''}
                            </option>
                            <option value="Emergency / Unplanned Expense">Emergency / Unplanned Expense (Anytime)</option>
                          </select>
                        );
                      })()}
                    </div>

                    <div className="flex flex-col gap-1.5" title={!isWalletConnected ? "Connect wallet firstly" : undefined}>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Requested Amount (ETH)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        disabled={!isVerified || !isWalletConnected || !selectedCampaignId}
                        placeholder="e.g. 5000"
                        maxLength={10}
                        value={amountRequested}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 10 && /^[0-9]*\.?[0-9]*$/.test(val)) {
                            setAmountRequested(val);
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5" title={!isWalletConnected ? "Connect wallet firstly" : undefined}>
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Proof Evidence Details</label>
                      <span className="text-[9px] text-slate-400 font-medium">{proofText.length}/100</span>
                    </div>
                    <textarea
                      required
                      rows={3}
                      maxLength={100}
                      disabled={!isVerified || !isWalletConnected || !selectedCampaignId}
                      placeholder="Describe work completed, lists items purchased, and details milestones reached (max 100 chars)..."
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-xs transition-all duration-200 bg-white resize-none disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5" title={!isWalletConnected ? "Connect wallet firstly" : undefined}>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Upload Receipts / Document Proof</label>

                    <div
                      onClick={() => {
                        if (isVerified && isWalletConnected && selectedCampaignId) {
                          triggerProofUpload();
                        }
                      }}
                      className={`border border-dashed rounded-xl p-4 text-center bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors duration-200 ${!isVerified || !isWalletConnected || !selectedCampaignId
                          ? 'opacity-40 cursor-not-allowed bg-slate-100/50 border-slate-200'
                          : proofUploadState === 'completed'
                            ? 'border-milestone-green bg-emerald-50/10 cursor-pointer'
                            : 'border-slate-200 hover:bg-slate-100/50 cursor-pointer'
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
                        <div className="flex flex-col items-center gap-1">
                          <UploadCloud size={14} className="text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {proofFileName ? `Selected: ${proofFileName}` : 'Select Milestone Proof Document (Max 1MB)'}
                          </span>
                        </div>
                      )}

                      {proofUploadState === 'uploading' && (
                        <div className="flex flex-col items-center gap-2.5 w-full max-w-[80%]">
                          <RefreshCw className="animate-spin text-trust-blue" size={14} />
                          <div className="w-full flex flex-col gap-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-500">
                              <span>DEPLOYING TO IPFS...</span>
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
                          <FileText size={14} className="text-emerald-600 animate-pulse" />
                          <div className="flex-grow min-w-0">
                            <span className="block text-[10px] font-bold text-slate-800 truncate">{proofFileName}</span>
                            <span className="block text-[8px] text-slate-400 truncate">IPFS CID: QmYwAPJzn5KSXn...</span>
                          </div>
                          <CheckCircle className="text-emerald-500 shrink-0" size={14} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isVerified || !isWalletConnected || !selectedCampaignId || !milestonePhase || !amountRequested || proofUploadState !== 'completed' || proofSubmittedSuccess}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-milestone-green shadow-md transition-all duration-300 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                    title={!isWalletConnected ? "Connect wallet firstly" : undefined}
                  >
                    {!isWalletConnected ? (
                      <>
                        <Wallet size={14} />
                        <span>Connect Wallet Firstly</span>
                      </>
                    ) : proofSubmittedSuccess ? (
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

          {isLoadingCampaigns ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-trust-blue" />
              <span>Loading campaigns...</span>
            </div>
          ) : myCampaigns.length === 0 ? (
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
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">ID: ...{c.id.slice(-5)}</span>
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
                            <span className="font-medium text-slate-700 line-clamp-1">{idx + 1}. {m.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-500">${m.amount.toLocaleString()}</span>
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${m.status === 'Released'
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

      {/* REJECTED PROOFS POPUP MODAL */}
      <AnimatePresence>
        {isRejectedPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRejectedPopupOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full relative z-10 flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900">Rejected Milestone Proofs</h3>
                  <p className="text-[10px] text-slate-400">Administrators rejected the following fund release requests.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[300px] pr-1">
                {ngoProofs.filter((p: any) => p.isRejected).map((p: any) => (
                  <div key={p._id} className="p-4 rounded-2xl border border-red-100 bg-red-50/20 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-grow">
                        <h4 className="font-heading font-bold text-xs text-slate-900 truncate">{p.campaignId?.title || 'My Campaign'}</h4>
                        <span className="text-[9px] uppercase font-bold text-red-600 tracking-wider mt-0.5 block">{p.milestonePhase}</span>
                      </div>
                      <span className="font-heading font-extrabold text-xs text-slate-800 shrink-0 ml-2">${p.amountRequested?.toLocaleString() || '0'}</span>
                    </div>

                    <div className="text-xs bg-white border border-red-50/50 p-3 rounded-xl text-slate-600 leading-relaxed">
                      <span className="block text-[8px] font-bold text-red-500 mb-1 uppercase tracking-wider">Rejection Reason</span>
                      {p.rejectionReason}
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.delete(`/proofs/${p._id}`);
                          setNgoProofs(prev => prev.filter(proof => proof._id !== p._id));
                          alert('Rejection acknowledged. You can now re-submit your proof claim.');
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to acknowledge rejection');
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-heading text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer shadow-sm text-center"
                    >
                      Acknowledge & Clear Claim
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsRejectedPopupOpen(false)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-heading text-xs font-bold transition-colors duration-200 cursor-pointer text-center"
              >
                Close Viewer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM MODAL POPUP FOR VALIDATION WARNINGS & ERRORS */}
      <AnimatePresence>
        {errorModalMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center gap-5 relative z-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">
                  Validation Warning
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {errorModalMessage}
                </p>
              </div>
              <button
                onClick={() => setErrorModalMessage(null)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-heading text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
