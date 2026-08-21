import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { CinematicHero } from '../components/CinematicHero';
import { BookOpen, Activity, AlertCircle, Send, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import type { Campaign } from '../context/Web3Context';

interface HomeProps {
  setActivePage: (page: string) => void;
  setSelectedCampaignId: (id: string | null) => void;
}

export const Home: React.FC<HomeProps> = ({ setActivePage, setSelectedCampaignId }) => {
  const { currentRole, isWalletConnected } = useWeb3();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Carousel sliding state index
  const [campaignStartIndex, setCampaignStartIndex] = useState(0);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
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
        console.error('Failed to load campaigns in Home:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Form submission handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
      setMessage('');
      setTimeout(() => setIsSubmitted(false), 4000);
    }, 1500);
  };

  // Donation button router
  const handleDonateNow = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    if (currentRole === 'guest' || !isWalletConnected) {
      setActivePage('register');
    } else if (currentRole === 'donor') {
      setActivePage('donor-dashboard');
    } else if (currentRole === 'ngo') {
      setActivePage('ngo-dashboard');
    } else if (currentRole === 'admin') {
      setActivePage('admin-dashboard');
    }
  };

  // Icon mapping helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Education':
        return <BookOpen size={14} className="text-blue-500" />;
      case 'Health':
        return <Activity size={14} className="text-emerald-500" />;
      default:
        return <AlertCircle size={14} className="text-amber-500" />;
    }
  };

  // Carousel calculation constants
  const maxCampaignIndex = Math.max(0, campaigns.length - 3);
  const visibleCampaigns = campaigns.slice(campaignStartIndex, campaignStartIndex + 3);

  const handlePrevCampaign = () => {
    setCampaignStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextCampaign = () => {
    setCampaignStartIndex((prev) => Math.min(maxCampaignIndex, prev + 1));
  };


  return (
    <div className="w-full overflow-x-hidden">
      {/* SECTION 1: HERO */}
      <CinematicHero
        onDonateClick={() => {
          document.getElementById('campaigns')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onGetStartedClick={() => {
          if (isWalletConnected) {
            if (currentRole === 'admin') setActivePage('admin-dashboard');
            else if (currentRole === 'ngo') setActivePage('ngo-dashboard');
            else setActivePage('donor-dashboard');
          } else {
            setActivePage('register');
          }
        }}
      />

      {/* SECTION 2: OUR GOAL (System-Matching Dark Blue Gradient Theme with Scroll Margin Fix) */}
      <section
        id="goal"
        className="scroll-mt-16 py-28 px-6 md:px-12 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white border-y border-slate-800/80 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="md:col-span-5 flex flex-col gap-4"
          >
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-400">
              Autonomous Governance
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-[1.1]">
              Zero Corruption, Full Accountability
            </h2>
            <div className="w-20 h-1 bg-blue-500 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="md:col-span-7 text-slate-300 text-sm md:text-base leading-relaxed flex flex-col gap-6"
          >
            <p>
              Traditional philanthropy suffers from administrative opacity, high transaction fee overheads, and misallocation of project budgets.
              <strong> ChainTrust</strong> bridges this trust gap by utilizing smart contract logic that locks charity capital in decentralized vaults.
            </p>
            <p className="border-l-4 border-emerald-500 pl-4 italic text-slate-200 font-medium">
              "NGOs request funding releases by providing cryptographic validation documents, receipts, and photos. Funds are released strictly upon administrator checkmarks, rendering intermediate project fraud mathematically impossible."
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: ABOUT US (Fixed Viewport Height & Soft Off-White Background) */}
      <section
        id="about"
        className="scroll-mt-16 min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6 md:px-12 bg-slate-50 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-12 w-full">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-600">
              Architectural Security
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight">
              A Tripartite Auditing Vault
            </h2>
            <p className="text-slate-500 max-w-lg text-sm">
              We connect three critical actors in a secure off-chain and on-chain verification cycle.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-10 items-center">
            {/* Split cards list */}
            <div className="md:col-span-7 flex flex-col gap-5">
              {[
                {
                  title: "Smart Contract Locking",
                  desc: "All donations are secured within a milestone-escrow contract. Capital is distributed strictly in fractional tranches according to verified tasks.",
                  color: "border-blue-100 hover:border-blue-500",
                  iconBg: "bg-blue-50 text-blue-600"
                },
                {
                  title: "NGO Legal Auditing",
                  desc: "NGO profiles undergo comprehensive background verification, document registration checks, and tax clearance audits before they can claim active campaigns.",
                  color: "border-amber-100 hover:border-amber-500",
                  iconBg: "bg-amber-50 text-amber-600"
                },
                {
                  title: "Immutable Fund Map",
                  desc: "Donors trace their money down to individual bricks, notebooks, or water pipes via a chronological milestone progress tracker map.",
                  color: "border-emerald-100 hover:border-emerald-500",
                  iconBg: "bg-emerald-50 text-emerald-600"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: idx * 0.15 }}
                  className={`p-5 rounded-2xl border bg-white hover:shadow-md transition-all duration-300 group cursor-default flex gap-4 items-start ${item.color}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${item.iconBg}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors duration-200 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Media side banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              className="md:col-span-5 relative group"
            >
              <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
              <img
                src="/assets/images/4.png"
                alt="Humanitarian efforts"
                className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl border border-slate-100 group-hover:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute bottom-5 left-5 cinematic-glass rounded-2xl p-3.5 max-w-[80%] flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-slate-900">Project Certified</h4>
                  <p className="text-[10px] text-slate-500">Milestone audit verified.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ACTIVE CAMPAIGNS HUB (Fixed Viewport Height, Pure White Background, Slider with Arrows) */}
      <section
        id="campaigns"
        className="scroll-mt-16 min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6 md:px-12 bg-white border-y border-slate-100 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-600">
                Live Campaign Registry
              </span>
              <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-slate-900 tracking-tight">
                Active Projects Ledger
              </h2>
            </div>
            <p className="text-slate-500 max-w-sm text-xs md:text-sm">
              All campaigns are launched by verified non-profits. Select a campaign below to direct your wallet donations.
            </p>
          </div>

          {/* Slider Layout with Navigation Side Arrows */}
          <div className="relative px-2">
            {/* Left side navigation arrow */}
            <button
              onClick={handlePrevCampaign}
              disabled={campaignStartIndex === 0}
              className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white text-slate-800 border border-slate-200 shadow-md hover:bg-slate-50 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
              aria-label="Previous campaigns"
            >
              <span className="text-lg font-bold font-mono">{"<"}</span>
            </button>

            {/* Carousel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="animate-spin text-blue-600" size={32} />
                  <span className="text-sm font-medium">Loading campaigns...</span>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="col-span-3 py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <AlertCircle size={32} className="text-slate-300" />
                  <span className="text-sm font-medium">No campaigns available currently.</span>
                </div>
              ) : (
                visibleCampaigns.map((campaign) => {
                  const percentage = Math.min(100, Math.round((campaign.raised / campaign.target) * 100));
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      {/* Compact Media Showcase */}
                      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                        <img
                          src={campaign.image}
                          alt={campaign.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Category badge */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 border border-white/60 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                          {getCategoryIcon(campaign.category)}
                          <span className="text-[9px] font-bold tracking-wide text-slate-700">
                            {campaign.category}
                          </span>
                        </div>
                      </div>

                      {/* Card Content with p-4 sm:p-5 padding */}
                      <div className="p-4 sm:p-5 flex flex-col flex-grow gap-2.5">
                        <h3 className="font-heading font-extrabold text-sm md:text-base text-slate-900 group-hover:text-blue-600 transition-colors duration-200 leading-snug line-clamp-1">
                          {campaign.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {campaign.description}
                        </p>

                        {/* Bottom metrics + action */}
                        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-100">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900">
                              ${campaign.raised.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400">Target: ${campaign.target.toLocaleString()}</span>
                          </div>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <button
                            onClick={() => handleDonateNow(campaign.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-heading text-[10px] font-bold text-white bg-slate-900 hover:bg-blue-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap"
                          >
                            <span>Donate Now</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Right side navigation arrow */}
            <button
              onClick={handleNextCampaign}
              disabled={campaignStartIndex === maxCampaignIndex}
              className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white text-slate-800 border border-slate-200 shadow-md hover:bg-slate-50 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
              aria-label="Next campaigns"
            >
              <span className="text-lg font-bold font-mono">{">"}</span>
            </button>
          </div>

          {/* Carousel dots pagination */}
          {maxCampaignIndex > 0 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: maxCampaignIndex + 1 }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCampaignStartIndex(dotIdx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    campaignStartIndex === dotIdx ? 'bg-blue-600 w-5' : 'bg-slate-300 hover:bg-slate-450'
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: CONTACT US (Adjusted Viewport Height to Show Footer) */}
      <section
        id="contact"
        className="scroll-mt-16 min-h-[calc(100vh-16rem)] flex flex-col justify-center pt-8 pb-4 px-6 md:px-12 bg-slate-100 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-10 w-full">
          <div className="text-center flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-blue-600">
              Audit Request Panel
            </span>
            <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-slate-900 tracking-tight">
              Get in Touch
            </h2>
            <p className="text-slate-500 max-w-sm text-xs">
              Reach out to our system auditors or request custom blockchain charity reports.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="p-6 md:p-8 rounded-3xl border border-slate-100 bg-white shadow-sm relative"
          >
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Representative Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@corporate.com"
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Subject Matter
                  </label>
                  <select
                    id="contact-subject"
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-xs"
                  >
                    <option>General Inquiries</option>
                    <option>NGO Partnership Verification</option>
                    <option>System Security & Auditing</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Inquiry Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-trust-blue disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Transmitting Dispatch...</span>
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span>Message Dispatched Successfully</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Transmit Message</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
