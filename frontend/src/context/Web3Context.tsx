import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axiosInstance from '../utils/axiosInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contractConfig';

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
  allocatedAmount: number;
  donorAddress: string;
  campaignId: string;
  campaignName: string;
}

export type UserRole = 'guest' | 'donor' | 'ngo' | 'admin';

export interface Web3ContextType {
  // Wallet
  isWalletConnected: boolean;
  walletAddress: string;
  walletBalance: string;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  bindWalletToProfile: (customAddr?: string) => Promise<string | null>;
  refreshBalance: (addr?: string) => Promise<string>;

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
  donateToCampaign: (campaignId: string, amount: number) => Promise<{ success: boolean; hash?: string; error?: string }>;
  estimateDonationGasFee: (campaignId: string, amountEth: number) => Promise<string>;

  // Milestones & Proofs
  addMilestoneProof: (campaignId: string, milestoneId: string, proofText: string, proofDocName: string) => void;
  validateMilestoneProof: (campaignId: string, milestoneId: string, phaseIndex: number, ngoWallet: string, amountEth: number) => Promise<string | undefined>;

  // Transaction Ledger
  transactions: Transaction[];

  // Helpers
  resetState: () => void;
  refreshCampaigns: () => Promise<void>;
  refreshTransactions: (walletAddress?: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Helper function to request MetaMask network switch to Hardhat Localhost (127.0.0.1:8545)
export const ensureHardhatNetwork = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !(window as any).ethereum) return false;
  const ethereum = (window as any).ethereum;
  const targetChainIdHex = '0x539'; // 1337 in hex

  try {
    const currentChain = await ethereum.request({ method: 'eth_chainId' });
    if (currentChain === targetChainIdHex || currentChain === '0x7a69') {
      return true;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
      return true;
    } catch (switchErr: any) {
      if (switchErr?.code === 4902 || switchErr?.message?.includes('unrecognized') || switchErr?.message?.includes('Unknown')) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetChainIdHex,
                chainName: 'Hardhat Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545/'],
                nativeCurrency: {
                  name: 'Test ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
          return true;
        } catch (addErr) {
          console.warn('Network addition to MetaMask failed:', addErr);
        }
      }
    }
  } catch (err) {
    console.warn('Network switch check notice:', err);
  }
  return false;
};

// All Initial Data Set to Empty Arrays (Mock Data Removed)
const initialNGOs: NGO[] = [];
const initialCampaigns: Campaign[] = [];
const initialTransactions: Transaction[] = [];

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet state
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(() => {
    return localStorage.getItem('wallet_connected') === 'true' || localStorage.getItem('isWalletConnected') === 'true';
  });
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    return localStorage.getItem('wallet_address') || '';
  });
  const [walletBalance, setWalletBalance] = useState<string>(() => {
    return localStorage.getItem('wallet_balance') || '0';
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

  const refreshBalance = useCallback(async (addr?: string): Promise<string> => {
    let target = addr || walletAddress || donorProfile?.wallet;

    if (!target && typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          target = accounts[0];
          setWalletAddress(target);
        }
      } catch (e) {
        console.warn('eth_accounts fetch notice:', e);
      }
    }

    if (!target) return '0.0000';

    let balanceWei = 0n;

    // 1. Try BrowserProvider (MetaMask)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        balanceWei = await provider.getBalance(target);
      } catch (err) {
        console.warn('Failed to fetch wallet balance via BrowserProvider:', err);
      }
    }

    // 2. If BrowserProvider returned 0 Wei or failed, check local Hardhat node (http://127.0.0.1:8545)
    if (balanceWei === 0n) {
      try {
        const localProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const localBal = await localProvider.getBalance(target);
        if (localBal > 0n) {
          balanceWei = localBal;
        }
      } catch (localErr) {
        // Local node not active
      }
    }

    const formatted = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
    setWalletBalance(formatted);
    return formatted;
  }, [walletAddress, donorProfile?.wallet]);

  const refreshCampaigns = useCallback(async () => {
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

  const refreshTransactions = useCallback(async (activeAddr?: string) => {
    const targetAddr = activeAddr || walletAddress;

    if (!isWalletConnected && !activeAddr) {
      setTransactions([]);
      return;
    }

    if (!targetAddr) {
      setTransactions([]);
      return;
    }

    try {
      const response = await axiosInstance.get(`/donations/wallet/${targetAddr}`);
      if (response.data && response.data.success) {
        const mapped = response.data.data.map((d: any) => ({
          hash: d.transactionHash,
          date: d.date ? new Date(d.date).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
          amount: d.amount,
          allocatedAmount: d.allocatedAmount || 0,
          donorAddress: d.donorId?.walletAddress || d.donorAddress || targetAddr,
          campaignId: d.campaignId?._id || d.campaignId,
          campaignName: d.campaignId?.title || 'Transparent Campaign'
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.warn('Backend wallet transactions fetch warning:', err);
      setTransactions([]);
    }
  }, [isWalletConnected, walletAddress]);

  useEffect(() => {
    refreshCampaigns();
    refreshTransactions();
  }, [refreshCampaigns, refreshTransactions]);

  // Auto check connected account on load ONLY if explicitly connected wallet previously
  useEffect(() => {
    const checkInitialConnection = async () => {
      const isExplicitlyConnected = localStorage.getItem('wallet_connected') === 'true' || localStorage.getItem('isWalletConnected') === 'true';
      if (!isExplicitlyConnected) {
        setIsWalletConnected(false);
        setWalletAddress('');
        setWalletBalance('0');
        return;
      }

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.send('eth_accounts', []);
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            const balanceWei = await provider.getBalance(addr);
            const formattedBal = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
            setWalletAddress(addr);
            setWalletBalance(formattedBal);
            setIsWalletConnected(true);
          } else {
            setIsWalletConnected(false);
            setWalletAddress('');
            setWalletBalance('0');
            localStorage.setItem('wallet_connected', 'false');
            localStorage.setItem('isWalletConnected', 'false');
          }
        } catch (e) {
          console.error('Error checking initial MetaMask connection:', e);
        }
      }
    };
    checkInitialConnection();
  }, []);
  // Handle MetaMask events (accountsChanged, chainChanged)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsWalletConnected(false);
          setWalletAddress('');
          setWalletBalance('0');
          localStorage.setItem('wallet_connected', 'false');
          localStorage.setItem('isWalletConnected', 'false');
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('wallet_balance');
          return;
        }

        const newAddr = accounts[0];
        setWalletAddress(newAddr);
        setIsWalletConnected(true);
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('isWalletConnected', 'true');
        localStorage.setItem('wallet_address', newAddr);
        try {
          const provider = new ethers.BrowserProvider(ethereum);
          const bal = await provider.getBalance(newAddr);
          setWalletBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
        } catch (e) {
          console.error('Error reading balance on account change:', e);
        }
      };

      const handleChainChanged = (_chainId: string) => {
        console.log('MetaMask chain updated to:', _chainId);
        if (walletAddress) {
          refreshBalance(walletAddress);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Sync state with LocalStorage
  useEffect(() => {
    localStorage.setItem('wallet_connected', String(isWalletConnected));
    localStorage.setItem('isWalletConnected', String(isWalletConnected));
    if (isWalletConnected && walletAddress) {
      localStorage.setItem('wallet_address', walletAddress);
      localStorage.setItem('wallet_balance', walletBalance);
    } else {
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_balance');
    }
    localStorage.setItem('user_role', currentRole);
    localStorage.setItem('active_ngo_id', activeNgoId || '');
    localStorage.setItem('donor_profile', donorProfile ? JSON.stringify(donorProfile) : '');
    localStorage.setItem('ngo_registry', JSON.stringify(ngos));
    localStorage.setItem('campaign_registry', JSON.stringify(campaigns));
    localStorage.setItem('transaction_registry', JSON.stringify(transactions));
  }, [isWalletConnected, walletAddress, walletBalance, currentRole, activeNgoId, donorProfile, ngos, campaigns, transactions]);

  // Web3 Connect Wallet via MetaMask
  const connectWallet = useCallback(async (): Promise<string | null> => {
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : undefined;

    if (!ethereum) {
      alert('MetaMask browser extension is not installed! Please install MetaMask extension in your browser to connect.');
      return null;
    }

    try {
      // Auto-switch MetaMask to Hardhat Localhost 8545 network if connected to mainnet/other chains
      await ensureHardhatNetwork();

      let accounts: string[] = [];
      try {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      } catch (permErr: any) {
        // If user explicitly rejected or closed the connection popup (code 4001), abort immediately!
        if (permErr?.code === 4001 || permErr?.message?.includes('rejected')) {
          console.log('User cancelled or closed MetaMask connection popup.');
          return null;
        }
      }

      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        let formattedBal = '0.0000';
        try {
          const provider = new ethers.BrowserProvider(ethereum);
          const balanceWei = await provider.getBalance(addr);
          formattedBal = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
        } catch (balErr) {
          console.warn('Balance fetch warning:', balErr);
        }

        setWalletAddress(addr);
        setWalletBalance(formattedBal);
        setIsWalletConnected(true);
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('isWalletConnected', 'true');
        localStorage.setItem('wallet_address', addr);
        localStorage.setItem('wallet_balance', formattedBal);

        if (currentRole === 'donor' && donorProfile) {
          setDonorProfile(prev => (prev ? { ...prev, wallet: addr } : prev));
        } else if (currentRole === 'ngo' && activeNgoId) {
          setNgos(prev =>
            prev.map(n => (n.id === activeNgoId ? { ...n, wallet: addr } : n))
          );
        }

        try {
          await axiosInstance.put('/users/bind-wallet', { walletAddress: addr });
          console.log('✅ Web3 wallet address successfully bound to user profile on backend:', addr);
        } catch (bindErr) {
          console.warn('⚠️ Wallet binding to backend user profile non-blocking notice:', bindErr);
        }

        refreshTransactions(addr);
        return addr;
      }
    } catch (err: any) {
      console.error('User rejected or failed wallet connection:', err);
      if (err?.code === -32002) {
        alert('MetaMask is already processing a connection request! Please open your MetaMask browser extension popup to approve the pending connection.');
      } else if (err?.code !== 4001) {
        alert(`MetaMask connection error: ${err?.message || 'Connection failed'}`);
      }
    }
    return null;
  }, [currentRole, donorProfile, activeNgoId, refreshTransactions]);

  const bindWalletToProfile = useCallback(async (customAddr?: string): Promise<string | null> => {
    if (customAddr) {
      const isExplicit = localStorage.getItem('isWalletConnected') === 'true' || localStorage.getItem('wallet_connected') === 'true';
      if (isExplicit) {
        setWalletAddress(customAddr);
        setIsWalletConnected(true);
        refreshBalance(customAddr);
        refreshTransactions(customAddr);
        if (currentRole === 'donor' && donorProfile) {
          setDonorProfile(prev => (prev ? { ...prev, wallet: customAddr } : prev));
        }
        return customAddr;
      }
      return null;
    }
    return await connectWallet();
  }, [connectWallet, currentRole, donorProfile, refreshBalance, refreshTransactions]);

  const disconnectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (err) {
        console.warn('Revoke permissions failed or not supported:', err);
      }
    }

    setIsWalletConnected(false);
    setWalletAddress('');
    setWalletBalance('0');
    localStorage.removeItem('isWalletConnected');
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_balance');
    localStorage.setItem('isWalletConnected', 'false');
    localStorage.setItem('wallet_connected', 'false');

    setDonorProfile(prev => (prev ? { ...prev, wallet: '' } : null));
  }, []);

  const loginUser = async (email: string, _password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    disconnectWallet();

    if (cleanEmail === 'admin@platform.org' || cleanEmail.includes('admin')) {
      setCurrentRole('admin');
      return { success: true, role: 'admin' as UserRole };
    }

    const matchingNgo = ngos.find(n => n.email.toLowerCase() === cleanEmail);
    if (matchingNgo) {
      setCurrentRole('ngo');
      setActiveNgoId(matchingNgo.id);
      return { success: true, role: 'ngo' as UserRole };
    }

    const donorName = cleanEmail.split('@')[0].replace('.', ' ');
    const formattedName = donorName.charAt(0).toUpperCase() + donorName.slice(1);

    const profile = {
      name: formattedName || 'Sarah Connor',
      email: cleanEmail,
      wallet: ''
    };

    setCurrentRole('donor');
    setDonorProfile(profile);

    return { success: true, role: 'donor' as UserRole };
  };

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
    setWalletBalance('0');
  };

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
      wallet: '',
    };

    setNgos(prev => [...prev, newNGO]);
    setCurrentRole('ngo');
    setActiveNgoId(newNGO.id);
    setIsWalletConnected(false);
    setWalletAddress('');
    setWalletBalance('0');
  };

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

  // 🚀 Estimate Gas Fee for Donation
  const estimateDonationGasFee = async (campaignId: string, amountEth: number): Promise<string> => {
    if (!isWalletConnected || !walletAddress || !CONTRACT_ADDRESS || typeof window === 'undefined' || !(window as any).ethereum) {
      return '0.00021'; // Default fallback
    }
    
    try {
      let numericCampaignId: bigint;
      const cleanHex = campaignId.replace(/[^0-9a-fA-F]/g, '');
      if (cleanHex.length >= 24) {
        numericCampaignId = BigInt("0x" + cleanHex.slice(0, 24));
      } else if (cleanHex.length > 0) {
        numericCampaignId = BigInt("0x" + cleanHex.padStart(24, '0'));
      } else {
        let hexStr = '';
        for (let i = 0; i < campaignId.length; i++) {
          hexStr += campaignId.charCodeAt(i).toString(16);
        }
        numericCampaignId = BigInt("0x" + hexStr.slice(0, 24).padStart(24, '0'));
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const valueWei = ethers.parseEther(amountEth.toString());
      
      const gasLimit = await contract.donate.estimateGas(numericCampaignId, { value: valueWei });
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits('1', 'gwei'); // Default to 1 gwei if unknown
      
      const estimatedFeeWei = gasLimit * gasPrice;
      return parseFloat(ethers.formatEther(estimatedFeeWei)).toFixed(6);
    } catch (error) {
      console.warn('Dynamic gas estimation failed, returning default:', error);
      return '0.00021';
    }
  };

  // 🚀 Real Smart Contract Execution (Ethers.js v6)
  const donateToCampaign = async (campaignId: string, amountEth: number): Promise<{ success: boolean; hash?: string; error?: string }> => {
    if (!isWalletConnected || !walletAddress) {
      return { success: false, error: 'Wallet is not connected. Please connect MetaMask.' };
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return { success: false, error: 'MetaMask extension is not installed in your browser.' };
    }

    if (!CONTRACT_ADDRESS) {
      return { success: false, error: 'Smart Contract Address is not configured in contractConfig.ts!' };
    }

    try {
      // Auto-switch MetaMask to Hardhat Localhost 8545 network before transaction execution
      await ensureHardhatNetwork();

      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return { success: false, error: 'Campaign not found' };

      // 1. Convert MongoDB 24-char hex ObjectId to uint256 BigInt
      let numericCampaignId: bigint;
      const cleanHex = campaignId.replace(/[^0-9a-fA-F]/g, '');
      if (cleanHex.length >= 24) {
        numericCampaignId = BigInt("0x" + cleanHex.slice(0, 24));
      } else if (cleanHex.length > 0) {
        numericCampaignId = BigInt("0x" + cleanHex.padStart(24, '0'));
      } else {
        let hexStr = '';
        for (let i = 0; i < campaignId.length; i++) {
          hexStr += campaignId.charCodeAt(i).toString(16);
        }
        numericCampaignId = BigInt("0x" + hexStr.slice(0, 24).padStart(24, '0'));
      }

      // 2. Initialize Signer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // 3. Instantiate Contract Instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const valueWei = ethers.parseEther(amountEth.toString());

      // 4. Gas limit fallback to ensure contract execution succeeds
      let gasLimit: bigint;
      try {
        gasLimit = await contract.donate.estimateGas(numericCampaignId, { value: valueWei });
      } catch (gasErr) {
        console.warn('Gas estimation fallback used:', gasErr);
        gasLimit = 350000n;
      }

      // 5. Explicitly invoke contract.donate(uint256)
      const tx = await contract.donate(numericCampaignId, {
        value: valueWei,
        gasLimit: gasLimit
      });

      console.log('Transaction broadcasted successfully:', tx.hash);

      // 6. Wait for block mining
      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx.hash;
      const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Update local campaign raised state
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            return { ...c, raised: c.raised + amountEth };
          }
          return c;
        })
      );

      const newTx: Transaction = {
        hash: txHash,
        date: dateStr,
        amount: amountEth,
        donorAddress: walletAddress,
        campaignId,
        campaignName: campaign.name
      };

      setTransactions(prev => [newTx, ...prev]);

      // Sync with MongoDB backend
      try {
        await axiosInstance.post('/donations', {
          campaignId: campaignId,
          donorAddress: walletAddress,
          amount: amountEth,
          transactionHash: txHash
        });
      } catch (backendErr) {
        console.warn('Backend REST sync notice:', backendErr);
      }

      // Refresh balances, campaigns, and transaction ledger strictly for active wallet
      await refreshBalance(walletAddress);
      await refreshCampaigns();
      await refreshTransactions(walletAddress);

      return { success: true, hash: txHash };
    } catch (err: any) {
      console.error('On-chain donation failed:', err);
      return {
        success: false,
        error: err?.reason || err?.message || 'Transaction was cancelled or rejected in MetaMask'
      };
    }
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

  const validateMilestoneProof = async (campaignId: string, milestoneId: string, phaseIndex: number, ngoWallet: string, amountEth: number): Promise<string | undefined> => {
    if (!isWalletConnected || !walletAddress) {
      throw new Error("Wallet not connected");
    }

    try {
      const isCorrectNetwork = await ensureHardhatNetwork();
      if (!isCorrectNetwork) {
        throw new Error("Please switch MetaMask to the local Hardhat network (1337).");
      }

      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const exactAmountStr = Number(amountEth).toFixed(6);
      const amountWei = ethers.parseEther(exactAmountStr);

      // The contract expects campaignId as a uint256. If it's a MongoDB ID, you might need a mapping,
      // but assuming the contract uses a numeric representation or we fallback to 0 if it fails parsing:
      const numericCampaignId = parseInt(campaignId.replace(/[^0-9]/g, '')) || 0;

      const tx = await contract.releaseMilestonePayout(
        numericCampaignId,
        phaseIndex,
        ngoWallet,
        amountWei
      );

      const receipt = await tx.wait();

      setCampaigns(prev =>
        prev.map(c => {
          if (c.id === campaignId) {
            const updatedMilestones = c.milestones.map(m => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  status: 'Released',
                  transactionHash: receipt.hash
                } as Milestone;
              }
              return m;
            });
            return { ...c, milestones: updatedMilestones };
          }
          return c;
        })
      );

      return receipt.hash;
    } catch (error: any) {
      console.error("Failed to release payout on-chain:", error);
      throw error;
    }
  };

  const resetState = () => {
    localStorage.clear();
    localStorage.setItem('wallet_connected', 'false');
    setIsWalletConnected(false);
    setWalletAddress('');
    setWalletBalance('0');
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
        walletBalance,
        connectWallet,
        disconnectWallet,
        bindWalletToProfile,
        refreshBalance,
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
        estimateDonationGasFee,
        addMilestoneProof,
        validateMilestoneProof,
        transactions,
        resetState,
        refreshCampaigns,
        refreshTransactions
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
