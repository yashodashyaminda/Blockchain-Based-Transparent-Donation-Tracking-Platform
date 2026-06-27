import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface NGO {
  id: string;
  name: string;
  email: string;
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
  
  // Auth/Roles
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeNgoId: string | null;
  setActiveNgoId: (id: string | null) => void;
  donorProfile: { name: string; email: string; wallet: string } | null;
  setDonorProfile: (profile: { name: string; email: string; wallet: string } | null) => void;

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
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Initial Data Setup
const initialNGOs: NGO[] = [
  {
    id: 'ngo-1',
    name: 'Global Care Alliance',
    email: 'info@globalcare.org',
    documentName: 'registration_certificate.pdf',
    documentUrl: '/assets/images/3.png',
    isVerified: true,
    wallet: '0x3289F4eEc2f748F29Ed98D081D0bB59bB67C924c',
  },
  {
    id: 'ngo-2',
    name: 'Save the Green',
    email: 'contact@savethegreen.org',
    documentName: 'legal_declaration_2026.pdf',
    documentUrl: '/assets/images/3.png',
    isVerified: false,
    wallet: '0x81c7e9De7c46f332a67e91B3363e7782A7C31d59',
  }
];

const initialCampaigns: Campaign[] = [
  {
    id: 'proj-1',
    name: 'Pure Water Initiative',
    category: 'Health',
    description: 'Providing sustainable solar-powered clean water purification systems to remote rural villages experiencing critical water scarcity.',
    image: '/assets/images/4.png',
    target: 5000,
    raised: 3500,
    ngoId: 'ngo-1',
    ngoName: 'Global Care Alliance',
    milestones: [
      {
        id: 'ms-1-1',
        title: 'Geological Drilling & Pump Purchase',
        amount: 2000,
        status: 'Released',
        proofText: 'Successfully completed drilling up to 150m. Purchased solar pumping hardware.',
        proofDoc: 'drilling_invoice.pdf',
        transactionHash: '0x43b2f88ea285f2ea71ca84ae9db193bde7cf2b489aef41b6c08adcf259ab114a'
      },
      {
        id: 'ms-1-2',
        title: 'Water Filtration Units Deployment',
        amount: 2000,
        status: 'Approved',
        proofText: 'Filtration housing constructed. Sand filters installed.',
        proofDoc: 'filtration_completion_log.pdf',
        transactionHash: '0x89adeff7e9301bc24aaef8818c7ea8924b17b3892ae8cb080b0b81c7efcd829a'
      },
      {
        id: 'ms-1-3',
        title: 'Pipeline Integration & Training',
        amount: 1000,
        status: 'Pending'
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Tech Kids Academy',
    category: 'Education',
    description: 'Equipping underprivileged kids in municipal areas with coding kits, computers, and mentors to unlock digital age opportunities.',
    image: '/assets/images/4.png',
    target: 8000,
    raised: 4000,
    ngoId: 'ngo-1',
    ngoName: 'Global Care Alliance',
    milestones: [
      {
        id: 'ms-2-1',
        title: '15 Laptop Workstations Procurement',
        amount: 4000,
        status: 'Released',
        proofText: 'Procured 15 laptops and loaded curriculum materials.',
        proofDoc: 'laptops_delivery_receipt.pdf',
        transactionHash: '0xfaec47bc98129da47e091b6cf1b0a682da0892eb094a6e0c08decf276ab091b8'
      },
      {
        id: 'ms-2-2',
        title: 'Learning Lab Broadband & Mentors',
        amount: 4000,
        status: 'Pending'
      }
    ]
  }
];

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
  },
  {
    hash: '0x9ae8dfc47abec982cf091decf7c73a8e9db193bde7cf2b489aef41b6c08adcf2',
    date: '2026-06-23 11:22:18',
    amount: 4000,
    donorAddress: '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a',
    campaignId: 'proj-2',
    campaignName: 'Tech Kids Academy'
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

  // Connect wallet simulator
  const connectWallet = () => {
    setIsWalletConnected(true);
    // Standard mock MetaMask address
    const mockAddr = '0x71C4B4E512d22C6e4A73193e0bB7a17f6983A90a';
    setWalletAddress(mockAddr);
    
    // Auto-create donor profile if role is guest and connecting wallet to make it clean
    if (currentRole === 'guest') {
      setCurrentRole('donor');
      setDonorProfile({
        name: 'Sarah Connor',
        email: 'sarah@skynet-resistance.io',
        wallet: mockAddr
      });
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setCurrentRole('guest');
    setActiveNgoId(null);
    setDonorProfile(null);
  };

  // Register NGO (Path B)
  const registerNGO = (name: string, email: string, regId: string, docName: string, docDataUrl: string) => {
    const mockNgoWallet = '0x' + Math.random().toString(16).substring(2, 42);
    const newNGO: NGO = {
      id: regId || `ngo-${Math.random().toString(36).substring(2, 9)}`,
      name,
      email,
      documentName: docName || 'uploaded_document.pdf',
      documentUrl: docDataUrl || '/assets/images/3.png',
      isVerified: false,
      wallet: mockNgoWallet,
    };

    setNgos(prev => [...prev, newNGO]);
    setCurrentRole('ngo');
    setActiveNgoId(newNGO.id);
  };

  // Admin verifies NGO
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

  // Campaign Add/Edit/Delete (verified NGO or Admin)
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

    // Distribute milestones roughly (e.g. 3 phases: 40%, 40%, 20%)
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

  // Donate to Campaign (Donor)
  const donateToCampaign = async (campaignId: string, amount: number): Promise<boolean> => {
    if (!isWalletConnected) return false;
    
    // Simulate smart contract payment latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return false;

    // Update campaign raised funds
    setCampaigns(prev => 
      prev.map(c => {
        if (c.id === campaignId) {
          return { ...c, raised: c.raised + amount };
        }
        return c;
      })
    );

    // Create transaction log
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

  // Milestone Proof Submission (NGO)
  const addMilestoneProof = (campaignId: string, milestoneId: string, proofText: string, proofDocName: string) => {
    setCampaigns(prev => 
      prev.map(c => {
        if (c.id === campaignId) {
          const updatedMilestones = c.milestones.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: 'Approved', // Ready for admin release validation
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

  // Admin Validates Proof & Release Smart Contract Funds
  const validateMilestoneProof = async (campaignId: string, milestoneId: string) => {
    // Simulate blockchain transaction approval delay
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

  // Reset to original data
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
        currentRole,
        setCurrentRole,
        activeNgoId,
        setActiveNgoId,
        donorProfile,
        setDonorProfile,
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
        resetState
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
