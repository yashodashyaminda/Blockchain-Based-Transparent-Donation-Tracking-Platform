import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { User, Award, FileText, UploadCloud, CheckCircle, RefreshCw, Lock, Mail, Phone, Building } from 'lucide-react';

interface RegisterProps {
  setActivePage: (page: string) => void;
  selectedCampaignId?: string | null;
}

export const Register: React.FC<RegisterProps> = ({ setActivePage }) => {
  const { registerDonorUser, registerNgoUser } = useWeb3();
  const [selectedRole, setSelectedRole] = useState<'donor' | 'ngo'>('donor');
  const [errorMessage, setErrorMessage] = useState('');

  // Donor form state
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPassword, setDonorPassword] = useState('');
  const [donorConfirmPassword, setDonorConfirmPassword] = useState('');

  // NGO form state
  const [ngoName, setNgoName] = useState('');
  const [ngoRegNumber, setNgoRegNumber] = useState('');
  const [ngoContactInfo, setNgoContactInfo] = useState('');
  const [ngoEmail, setNgoEmail] = useState('');
  const [ngoPassword, setNgoPassword] = useState('');
  const [ngoConfirmPassword, setNgoConfirmPassword] = useState('');

  // Upload status state for NGO PDF
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'completed'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);

  // File upload simulation
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
        return prev + 20;
      });
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateFileUpload(e.dataTransfer.files[0].name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateFileUpload(e.target.files[0].name);
    }
  };

  // Donor registration submit
  const handleDonorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (donorPassword !== donorConfirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!donorName || !donorEmail || !donorPassword) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    registerDonorUser({
      name: donorName,
      email: donorEmail,
      password: donorPassword
    });

    // Auto-redirect post registration to donor dashboard
    setActivePage('donor-dashboard');
  };

  // NGO registration submit
  const handleNgoRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (ngoPassword !== ngoConfirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!ngoName || !ngoRegNumber || !ngoEmail || !ngoPassword || uploadState !== 'completed') {
      setErrorMessage('Please complete all form fields and upload verification PDF');
      return;
    }

    registerNgoUser({
      name: ngoName,
      registrationNumber: ngoRegNumber,
      contactInfo: ngoContactInfo,
      email: ngoEmail,
      password: ngoPassword,
      documentName: uploadedFile?.name || 'document.pdf',
      documentUrl: '/assets/images/3.png'
    });

    // Auto-redirect post registration to NGO dashboard
    setActivePage('ngo-dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 md:px-12 relative overflow-hidden">
      {/* Background decoration */}
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
        {/* Top Role Selection Switcher Radio */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
            Select Account Category
          </span>
          
          <div className="grid grid-cols-2 gap-3 w-full max-w-md p-1.5 bg-slate-200/60 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('donor');
                setErrorMessage('');
              }}
              className={`py-3 px-4 rounded-xl text-xs font-heading font-extrabold tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'donor'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User size={16} className={selectedRole === 'donor' ? 'text-trust-blue' : ''} />
              <span>Register as Donor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('ngo');
                setErrorMessage('');
              }}
              className={`py-3 px-4 rounded-xl text-xs font-heading font-extrabold tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'ngo'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={16} className={selectedRole === 'ngo' ? 'text-trust-blue' : ''} />
              <span>Register as NGO</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          {errorMessage && (
            <div className="p-3.5 mb-6 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl font-semibold flex items-center gap-2">
              <Lock size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {selectedRole === 'donor' ? (
              <motion.div
                key="donor-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                    Create Donor Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Track donations transparently and follow real-time project milestone releases.
                  </p>
                </div>

                <form onSubmit={handleDonorRegister} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        placeholder="Sarah Connor"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        required
                        placeholder="sarah@donor.org"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={donorPassword}
                          onChange={(e) => setDonorPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={donorConfirmPassword}
                          onChange={(e) => setDonorConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-trust-blue text-white font-heading text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue cursor-pointer"
                  >
                    Complete Donor Registration
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="ngo-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                    Register NGO Workspace
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit organizational details & compliance documents to launch transparent campaigns.
                  </p>
                </div>

                <form onSubmit={handleNgoRegister} className="flex flex-col gap-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Organization Name
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          placeholder="Global Care Alliance"
                          value={ngoName}
                          onChange={(e) => setNgoName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="REG-2026-881A"
                        value={ngoRegNumber}
                        onChange={(e) => setNgoRegNumber(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Contact Info / Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="+1 (555) 019-2831"
                          value={ngoContactInfo}
                          onChange={(e) => setNgoContactInfo(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Official NGO Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          placeholder="info@globalcare.org"
                          value={ngoEmail}
                          onChange={(e) => setNgoEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={ngoPassword}
                          onChange={(e) => setNgoPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={ngoConfirmPassword}
                          onChange={(e) => setNgoConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue text-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification document upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Verification Document (Audit PDF)
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[140px] ${
                        isDragOver
                          ? 'border-milestone-green bg-emerald-50/20'
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
                        <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                            <UploadCloud size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Click or Drag PDF audit file here</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Accepts registration certificate PDF (Max size 10MB)</p>
                          </div>
                        </label>
                      )}

                      {uploadState === 'uploading' && (
                        <div className="flex flex-col items-center gap-3 w-full max-w-[80%]">
                          <RefreshCw className="animate-spin text-trust-blue" size={20} />
                          <div className="w-full flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500">
                              <span>PROCESSING PDF...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                              <div className="h-full bg-trust-blue transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadState === 'completed' && uploadedFile && (
                        <div className="flex items-center gap-3 w-full px-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="text-left flex-grow min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                            <p className="text-[9px] text-slate-400">{uploadedFile.size} • Audit PDF Ready</p>
                          </div>
                          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadState !== 'completed'}
                    className="w-full py-4 rounded-xl bg-slate-900 hover:bg-trust-blue disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-heading text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 mt-2 glow-blue cursor-pointer"
                  >
                    Submit NGO Registration
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Footer Switch Link */}
          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="text-trust-blue hover:underline font-bold cursor-pointer ml-1"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
