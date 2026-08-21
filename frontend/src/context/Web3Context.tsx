import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

// Types
export interface NGO {
  id: string;
  name: string;
  email: string;
  registrationNumber?: string;
  contactInfo?: string;
  documentName: string;
  documentUrl: string;
  isVerified: boolean;
  wallet: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Released';
  proofText?: string;
  proofDoc?: string;
  transactionHash?: string;
}

export interface Campaign {
  id: string;
  name: string;
  category: 'Education' | 'Health' | 'Disaster Relief';
  description: string;
  image: string;
  target: number;
  raised: number;
  ngoId: string;
  ngoName: string;
  milestones: Milestone[];
}

export interface Transaction {
  hash: string;
  date: string;
  amount: number;
  donorAddress: string;
  campaignId: string;
  campaignName: string;
}

export type UserRole = 'guest' | 'donor' | 'ngo' | 'admin';

interface Web3ContextType {
  // Wallet
  isWalletConnected: boolean;
  walletAddress: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  bindWalletToProfile: (customAddr?: string) => void;
  
  // Auth/Roles (Web2.5)
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeNgoId: string | null;
  setActiveNgoId: (id: string | null) => void;
  donorProfile: { name: string; email: string; wallet: string } | null;
  setDonorProfile: (profile: { name: string; email: string; wallet: string } | null) => void;
  
  loginUser: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  registerDonorUser: (data: { name: string; email: string; password?: string }) => void;
  registerNgoUser: (data: { name: string; registrationNumber: string; contactInfo?: string; email: string; password?: string; documentName: string; documentUrl: string }) => void;

  // NGO Data & Management
  ngos: NGO[];
  registerNGO: (name: string, email: string, regId: string, docName: string, docDataUrl: string) => void;
  verifyNGO: (id: string, approve: boolean) => void;

  // Campaigns & Donations
  campaigns: Campaign[];
  addCampaign: (name: string, category: Campaign['category'], description: string, image: string, target: number) => void;
  deleteCampaign: (id: string) => void;
  editCampaign: (id: string, updated: Partial<Campaign>) => void;
  donateToCampaign: (campaignId: string, amount: number) => Promise<boolean>;
  
  // Milestones & Proofs
  addMilestoneProof: (campaignId: string, milestoneId: string, proofText: string, proofDocName: string) => void;
  validateMilestoneProof: (campaignId: string, milestoneId: string) => Promise<void>;

  // Transaction Ledger
  transactions: Transaction[];

  // Helpers
  resetState: () => void;
  refreshCampaigns: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Initial Mock NGO Data Setup
const initialNGOs: NGO[] = [
  {
    id: 'ngo-1',
    name: 'Global Care Alliance',
    email: 'info@globalcare.org',
    registrationNumber: 'REG-2026-881A',
    contactInfo: '+1 (555) 019-2831',
    documentName: 'registration_certificate.pdf',
    documentUrl: '/assets/images/3.png',
    isVerified: true,
    wallet: '0x3289F4eEc2f748F29Ed98D081D0bB59bB67C924c',
  },
  {
    id: 'ngo-2',
    name: 'Save the Green',
    email: 'contact@savethegreen.org',
    registrationNumber: 'REG-2026-994B',
    contactInfo: '+1 (555) 019-9942',
    documentName: 'legal_declaration_2026.pdf',
    documentUrl: '/assets/images/3.png',
    isVerified: false,
    wallet: '',
  }
];

const initialCampaigns: Campaign[] = [];

const initialTransactions: Transaction[] = [
  {
    hash: '0x32bafe091c78b27cf89eaef8325c9b1932ea489dcfb18ae72e2cf89daef389cb',
    date: '2026-06-22 14:32:05',
    amount: 1500,
    donorAddress: '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a',
    campaignId: 'proj-1',
    campaignName: 'Pure Water Initiative'
  },
  {
    hash: '0x7b23af89dcaebf412ea789acde1b63ef2b89adcfb28aefc08a9adbc8e7cfa12b',
    date: '2026-06-23 09:15:42',
    amount: 2000,
    donorAddress: '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a',
    campaignId: 'proj-1',
    campaignName: 'Pure Water Initiative'
  }
];

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(() => {
    return localStorage.getItem('wallet_connected') === 'true';
  });
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    return localStorage.getItem('wallet_address') || '';
  });

  // Auth states
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('user_role') as UserRole) || 'guest';
  });
  const [activeNgoId, setActiveNgoId] = useState<string | null>(() => {
    return localStorage.getItem('active_ngo_id') || null;
  });
  const [donorProfile, setDonorProfile] = useState<{ name: string; email: string; wallet: string } | null>(() => {
    const saved = localStorage.getItem('donor_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Main collections
  const [ngos, setNgos] = useState<NGO[]>(() => {
    const saved = localStorage.getItem('ngo_registry');
    return saved ? JSON.parse(saved) : initialNGOs;
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('campaign_registry');
    return saved ? JSON.parse(saved) : initialCampaigns;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transaction_registry');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const refreshCampaigns = React.useCallback(async () => {
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
        setCampaigns(mapped);
      }
    } catch (err) {
      console.error('Failed to load campaigns in Web3Context:', err);
    }
  }, []);

  useEffect(() => {
    refreshCampaigns();
  }, []);

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem('wallet_connected', String(isWalletConnected));
    localStorage.setItem('wallet_address', walletAddress);
    localStorage.setItem('user_role', currentRole);
    localStorage.setItem('active_ngo_id', activeNgoId || '');
    localStorage.setItem('donor_profile', donorProfile ? JSON.stringify(donorProfile) : '');
    localStorage.setItem('ngo_registry', JSON.stringify(ngos));
    localStorage.setItem('campaign_registry', JSON.stringify(campaigns));
    localStorage.setItem('transaction_registry', JSON.stringify(transactions));
  }, [isWalletConnected, walletAddress, currentRole, activeNgoId, donorProfile, ngos, campaigns, transactions]);

  // Unified Web2 Login handler
  const loginUser = async (email: string, _password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if matching Admin credentials
    if (cleanEmail === 'admin@platform.org' || cleanEmail.includes('admin')) {
      setCurrentRole('admin');
      return { success: true, role: 'admin' as UserRole };
    }

    // Check if matching registered NGO email
    const matchingNgo = ngos.find(n => n.email.toLowerCase() === cleanEmail);
    if (matchingNgo) {
      setCurrentRole('ngo');
      setActiveNgoId(matchingNgo.id);
      if (matchingNgo.wallet) {
        setIsWalletConnected(true);
        setWalletAddress(matchingNgo.wallet);
      } else {
        setIsWalletConnected(false);
        setWalletAddress('');
      }
      return { success: true, role: 'ngo' as UserRole };
    }

    // Fallback/Default Donor login simulation
    const donorName = cleanEmail.split('@')[0].replace('.', ' ');
    const formattedName = donorName.charAt(0).toUpperCase() + donorName.slice(1);
    
    const profile = {
      name: formattedName || 'Sarah Connor',
      email: cleanEmail,
      wallet: donorProfile?.wallet || walletAddress || ''
    };

    setCurrentRole('donor');
    setDonorProfile(profile);
    
    if (profile.wallet) {
      setIsWalletConnected(true);
      setWalletAddress(profile.wallet);
    } else {
      setIsWalletConnected(false);
      setWalletAddress('');
    }

    return { success: true, role: 'donor' as UserRole };
  };

  // Web2 Donor Registration
  const registerDonorUser = (data: { name: string; email: string; password?: string }) => {
    const newProfile = {
      name: data.name,
      email: data.email,
      wallet: ''
    };
    setDonorProfile(newProfile);
    setCurrentRole('donor');
    setIsWalletConnected(false);
    setWalletAddress('');
  };

  // Web2 NGO Registration (with Email and Password)
  const registerNgoUser = (data: { name: string; registrationNumber: string; contactInfo?: string; email: string; password?: string; documentName: string; documentUrl: string }) => {
    const newNGO: NGO = {
      id: `ngo-${Math.random().toString(36).substring(2, 9)}`,
      name: data.name,
      email: data.email,
      registrationNumber: data.registrationNumber,
      contactInfo: data.contactInfo,
      documentName: data.documentName || 'verification_document.pdf',
      documentUrl: data.documentUrl || '/assets/images/3.png',
      isVerified: false,
      wallet: '', // Unbound initially
    };

    setNgos(prev => [...prev, newNGO]);
    setCurrentRole('ngo');
    setActiveNgoId(newNGO.id);
    setIsWalletConnected(false);
    setWalletAddress('');
  };

  // Post-Login Web3 Wallet Connection & Profile Binding
  const bindWalletToProfile = (customAddr?: string) => {
    const boundAddress = customAddr || '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a';
    setIsWalletConnected(true);
    setWalletAddress(boundAddress);

    if (currentRole === 'donor' && donorProfile) {
      setDonorProfile({ ...donorProfile, wallet: boundAddress });
    } else if (currentRole === 'ngo' && activeNgoId) {
      setNgos(prev =>
        prev.map(n => (n.id === activeNgoId ? { ...n, wallet: boundAddress } : n))
      );
    }
  };

  const connectWallet = () => {
    bindWalletToProfile();
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setCurrentRole('guest');
    setActiveNgoId(null);
    setDonorProfile(null);
  };

  // Backward compatible registerNGO handler
  const registerNGO = (name: string, email: string, regId: string, docName: string, docDataUrl: string) => {
    registerNgoUser({
      name,
      email,
      registrationNumber: regId,
      documentName: docName,
      documentUrl: docDataUrl
    });
  };

  const verifyNGO = (id: string, approve: boolean) => {
    setNgos(prev => 
      prev.map(ngo => {
        if (ngo.id === id) {
          return { ...ngo, isVerified: approve };
        }
        return ngo;
      })
    );
  };

  const addCampaign = (name: string, category: Campaign['category'], description: string, image: string, target: number) => {
    let ngoName = 'System Admin';
    let ngoId = 'admin';
    
    if (currentRole === 'ngo' && activeNgoId) {
      const activeNgo = ngos.find(n => n.id === activeNgoId);
      if (activeNgo) {
        ngoName = activeNgo.name;
        ngoId = activeNgo.id;
      }
    }

    const ms1 = Math.round(target * 0.4);
    const ms2 = Math.round(target * 0.4);
    const ms3 = target - ms1 - ms2;

    const newCampaign: Campaign = {
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      name,
      category,
      description,
      image: image || '/assets/images/4.png',
      target,
      raised: 0,
      ngoId,
      ngoName,
      milestones: [
        {
          id: `ms-${Math.random().toString(36).substring(2, 5)}`,
          title: 'Phase 1 Setup & Groundwork',
          amount: ms1,
          status: 'Pending'
        },
        {
          id: `ms-${Math.random().toString(36).substring(2, 5)}`,
          title: 'Phase 2 Construction & Delivery',
          amount: ms2,
          status: 'Pending'
        },
        {
          id: `ms-${Math.random().toString(36).substring(2, 5)}`,
          title: 'Phase 3 Verification & Handover',
          amount: ms3,
          status: 'Pending'
        }
      ]
    };

    setCampaigns(prev => [...prev, newCampaign]);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const editCampaign = (id: string, updated: Partial<Campaign>) => {
    setCampaigns(prev => 
      prev.map(c => (c.id === id ? { ...c, ...updated } as Campaign : c))
    );
  };

  const donateToCampaign = async (campaignId: string, amount: number): Promise<boolean> => {
    if (!isWalletConnected) return false;
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return false;

    setCampaigns(prev => 
      prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, raised: c.raised + amount };
        }
        return c;
      })
    );

    const newTx: Transaction = {
      hash: txHash,
      date: dateStr,
      amount,
      donorAddress: walletAddress,
      campaignId,
      campaignName: campaign.name
    };

    setTransactions(prev => [newTx, ...prev]);
    return true;
  };

  const addMilestoneProof = (campaignId: string, milestoneId: string, proofText: string, proofDocName: string) => {
    setCampaigns(prev => 
      prev.map(c => {
        if (c.id === campaignId) {
          const updatedMilestones = c.milestones.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: 'Approved',
                proofText,
                proofDoc: proofDocName || 'receipt_ipfs.pdf'
              } as Milestone;
            }
            return m;
          });
          return { ...c, milestones: updatedMilestones };
        }
        return c;
      })
    );
  };

  const validateMilestoneProof = async (campaignId: string, milestoneId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    setCampaigns(prev => 
      prev.map(c => {
        if (c.id === campaignId) {
          const updatedMilestones = c.milestones.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: 'Released',
                transactionHash: txHash
              } as Milestone;
            }
            return m;
          });
          return { ...c, milestones: updatedMilestones };
        }
        return c;
      })
    );
  };

  const resetState = () => {
    localStorage.clear();
    setIsWalletConnected(false);
    setWalletAddress('');
    setCurrentRole('guest');
    setActiveNgoId(null);
    setDonorProfile(null);
    setNgos(initialNGOs);
    setCampaigns(initialCampaigns);
    setTransactions(initialTransactions);
  };

  return (
    <Web3Context.Provider
      value={{
        isWalletConnected,
        walletAddress,
        connectWallet,
        disconnectWallet,
        bindWalletToProfile,
        currentRole,
        setCurrentRole,
        activeNgoId,
        setActiveNgoId,
        donorProfile,
        setDonorProfile,
        loginUser,
        registerDonorUser,
        registerNgoUser,
        ngos,
        registerNGO,
        verifyNGO,
        campaigns,
        addCampaign,
        deleteCampaign,
        editCampaign,
        donateToCampaign,
        addMilestoneProof,
        validateMilestoneProof,
        transactions,
        resetState,
        refreshCampaigns
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
