import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { User, ShieldAlert, Award, FileText, UploadCloud, CheckCircle, RefreshCw, Wallet } from 'lucide-react';

interface RegisterProps {
  setActivePage: (page: string) => void;
  selectedCampaignId: string | null;
}

export const Register: React.FC<RegisterProps> = ({ setActivePage }) => {
  const { connectWallet, isWalletConnected, registerNGO, setCurrentRole, setDonorProfile, walletAddress } = useWeb3();
  const [activeTab, setActiveTab] = useState<'donor' | 'ngo'>('donor');

  // Donor form states
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPassword, setDonorPassword] = useState('');

  // NGO form states
  const [ngoName, setNgoName] = useState('');
  const [ngoEmail, setNgoEmail] = useState('');
  const [ngoRegId, setNgoRegId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  
  // Upload status states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);

  // Form submission: Donor
  const handleDonorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !donorEmail || !donorPassword) return;

    // Simulate MetaMask auto-connection if not connected
    if (!isWalletConnected) {
      connectWallet();
    }

    setDonorProfile({
      name: donorName,
      email: donorEmail,
      wallet: walletAddress || '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a',
    });

    setCurrentRole('donor');
    setActivePage('donor-dashboard');
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const simulateFileUpload = (fileName: string) => {
    setUploadState('uploading');
    setUploadProgress(0);
    setUploadedFile({ name: fileName, size: '2.4 MB' });

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      simulateFileUpload(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateFileUpload(file.name);
    }
  };

  // Form submission: NGO
  const handleNgoRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoName || !ngoEmail || !ngoRegId || uploadState !== 'completed') return;

    // Register inside context with pending verified status
    // Use default certificate /assets/images/3.png as uploaded preview url
    registerNGO(ngoName, ngoEmail, ngoRegId, uploadedFile?.name || 'document.pdf', '/assets/images/3.png');
    
    // Automatically transition to NGO Dashboard (locked banner state)
    setActivePage('ngo-dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28 pb-16 px-4 md:px-12">
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-trust-blue-light blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-milestone-green-light blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-2xl bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden relative z-10"
      >
        {/* Registration header switches */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('donor')}
            className={`flex-1 py-5 text-center font-heading text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'donor'
                ? 'bg-white border-b-2 border-trust-blue text-trust-blue'
                : 'bg-slate-50/50 text-slate-400 hover:text-slate-600'
            }`}
          >
            <User size={14} />
            <span>Donor Account Portal</span>
          </button>
          
          <button
            onClick={() => setActiveTab('ngo')}
            className={`flex-1 py-5 text-center font-heading text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ngo'
                ? 'bg-white border-b-2 border-trust-blue text-trust-blue'
                : 'bg-slate-50/50 text-slate-400 hover:text-slate-600'
            }`}
          >
            <Award size={14} />
            <span>NGO Verification Desk</span>
          </button>
        </div>

        {/* Tab content wrappers */}
        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'donor' ? (
              <motion.div
                key="donor-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-2 mb-6">
                  <h3 className="font-heading font-extrabold text-2xl text-slate-900">
                    Register as Donor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instantly browse campaign ledgers, lock donations in smart contracts, and track fund usage.
                  </p>
                </div>

                <form onSubmit={handleDonorRegister} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@email.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Secure Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={donorPassword}
                      onChange={(e) => setDonorPassword(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                    />
                  </div>

                  {/* Connect Wallet Helper */}
                  <div className="p-4 rounded-2xl bg-trust-blue-light border border-blue-100 flex items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-trust-blue shadow-sm">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Web3 Ledger Mapping</h4>
                        <p className="text-[10px] text-slate-500">Links account history to decentralized addresses.</p>
                      </div>
                    </div>
                    {isWalletConnected ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        Address Connected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={connectWallet}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-trust-blue hover:bg-trust-blue-hover text-white transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-trust-blue text-white font-heading text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue cursor-pointer"
                  >
                    Complete Donor Onboarding
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="ngo-panel"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-2 mb-6">
                  <h3 className="font-heading font-extrabold text-2xl text-slate-900">
                    Register NGO Workspace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Launch charity proposal cycles and publish transparent milestone evidence.
                  </p>
                </div>

                <form onSubmit={handleNgoRegister} className="flex flex-col gap-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        NGO Corporate Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Green Earth Foundation"
                        value={ngoName}
                        onChange={(e) => setNgoName(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Legal Registry ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="NGO-9941A"
                        value={ngoRegId}
                        onChange={(e) => setNgoRegId(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Corporate Representative Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="compliance@greenearth.org"
                      value={ngoEmail}
                      onChange={(e) => setNgoEmail(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                    />
                  </div>

                  {/* Legal file drop zone field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      NGO Verification Document (PDF)
                    </label>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[160px] ${
                        isDragOver 
                          ? 'border-milestone-green bg-emerald-50/20 shadow-inner' 
                          : uploadState === 'completed'
                          ? 'border-milestone-green bg-emerald-50/10'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        id="document-upload"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {uploadState === 'idle' && (
                        <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-sm">
                            <UploadCloud size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Drag & Drop certificate files</p>
                            <p className="text-[9px] text-slate-400 mt-1">Accepts PDF audits (Max size 10MB)</p>
                          </div>
                        </label>
                      )}

                      {uploadState === 'uploading' && (
                        <div className="flex flex-col items-center gap-3 w-full max-w-[80%]">
                          <RefreshCw className="animate-spin text-trust-blue" size={24} />
                          <div className="w-full flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                              <span>INDEXING PDF METADATA...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                              <div className="h-full bg-trust-blue transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadState === 'completed' && uploadedFile && (
                        <div className="flex items-center gap-4 w-full px-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="text-left flex-grow">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{uploadedFile.name}</p>
                            <p className="text-[9px] text-slate-400">{uploadedFile.size} • Uploaded & Certified</p>
                          </div>
                          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Locked State Warning info */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-700">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Regulatory Auditing Notice</h4>
                      <p className="text-[9px] leading-relaxed text-amber-600/90 mt-0.5">
                        Your workspace features (campaign launching and milestones) will be locked under a semi-translucent backdrop screen until system administrators review and verify your uploaded legal PDFs.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadState !== 'completed'}
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-trust-blue disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-heading text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue cursor-pointer"
                  >
                    Submit Verification File
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
