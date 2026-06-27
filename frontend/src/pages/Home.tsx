import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { CinematicHero } from '../components/CinematicHero';
import { BookOpen, Activity, AlertCircle, Send, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

interface HomeProps {
  setActivePage: (page: string) => void;
  setSelectedCampaignId: (id: string | null) => void;
}

export const Home: React.FC<HomeProps> = ({ setActivePage, setSelectedCampaignId }) => {
  const { campaigns, currentRole, isWalletConnected } = useWeb3();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      // If NGO, redirect to NGO workspace
      setActivePage('ngo-dashboard');
    } else if (currentRole === 'admin') {
      setActivePage('admin-dashboard');
    }
  };

  // Icon mapping helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Education':
        return <BookOpen size={16} className="text-blue-500" />;
      case 'Health':
        return <Activity size={16} className="text-emerald-500" />;
      default:
        return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="w-full">
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

      {/* SECTION 2: OUR GOAL */}
      <section id="goal" className="py-20 px-6 md:px-12 bg-alabaster border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="md:col-span-5 flex flex-col gap-4"
          >
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-trust-blue">
              Autonomous Governance
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight leading-[1.1]">
              Zero Corruption, Full Accountability
            </h2>
            <div className="w-20 h-1 bg-trust-blue rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="md:col-span-7 text-slate-600 text-sm md:text-base leading-relaxed flex flex-col gap-6"
          >
            <p>
              Traditional philanthropy suffers from administrative opacity, high transaction fee overheads, and misallocation of project budgets.
              <strong> ChainTrust</strong> bridges this trust gap by utilizing smart contract logic that locks charity capital in decentralized vaults.
            </p>
            <p className="border-l-4 border-milestone-green pl-4 italic text-slate-700 font-medium">
              "NGOs request funding releases by providing cryptographic validation documents, receipts, and photos. Funds are released strictly upon administrator checkmarks, rendering intermediate project fraud mathematically impossible."
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: ABOUT US */}
      <section id="about" className="py-20 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-milestone-green">
              Architectural Security
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight">
              A Tripartite Auditing Vault
            </h2>
            <p className="text-slate-500 max-w-lg text-sm">
              We connect three critical actors in a secure off-chain and on-chain verification cycle.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-12 items-center">
            {/* Split cards list */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {[
                {
                  title: "Smart Contract Locking",
                  desc: "All donations are secured within a milestone-escrow contract. Capital is distributed strictly in fractional tranches according to verified tasks.",
                  color: "border-blue-100 hover:border-trust-blue",
                  iconBg: "bg-blue-50 text-trust-blue"
                },
                {
                  title: "NGO Legal Auditing",
                  desc: "NGO profiles undergo comprehensive background verification, document registration checks, and tax clearance audits before they can claim active campaigns.",
                  color: "border-amber-100 hover:border-pending-gold",
                  iconBg: "bg-amber-50 text-pending-gold"
                },
                {
                  title: "Immutable Fund Map",
                  desc: "Donors trace their money down to individual bricks, notebooks, or water pipes via a chronological milestone progress tracker map.",
                  color: "border-emerald-100 hover:border-milestone-green",
                  iconBg: "bg-emerald-50 text-milestone-green"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: idx * 0.15 }}
                  className={`p-6 rounded-2xl border bg-slate-50/50 hover:bg-white transition-all duration-300 group cursor-default flex gap-4 items-start ${item.color}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${item.iconBg}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-trust-blue transition-colors duration-200 mb-1">
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
              initial={{ opacity: 0, scale: 0.9, rotate: 1 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              className="md:col-span-5 relative group"
            >
              <div className="absolute inset-0 bg-trust-blue rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
              <img
                src="/assets/images/4.png"
                alt="Humanitarian efforts"
                className="w-full aspect-[4/3] object-cover rounded-3xl shadow-xl border border-slate-100 group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute bottom-6 left-6 cinematic-glass rounded-2xl p-4 max-w-[80%] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-milestone-green flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
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

      {/* ACTIVE CAMPAIGNS HUB */}
      <section id="campaigns" className="py-24 px-6 md:px-12 bg-alabaster border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-trust-blue">
                Live Campaign Registry
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight">
                Active Projects Ledger
              </h2>
            </div>
            <p className="text-slate-500 max-w-sm text-xs md:text-sm">
              All campaigns are launched by verified non-profits. Select a campaign below to direct your wallet donations.
            </p>
          </div>

          {/* Campaign cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {campaigns.map((campaign, idx) => {
              const percentage = Math.min(100, Math.round((campaign.raised / campaign.target) * 100));
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, delay: idx * 0.15 }}
                  className="group relative bg-white rounded-3xl border border-slate-100 hover:border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Image showcase */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <img
                      src={campaign.image}
                      alt={campaign.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category badge */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 border border-white/60 shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                      {getCategoryIcon(campaign.category)}
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-700">
                        {campaign.category}
                      </span>
                    </div>

                    {/* NGO Tag */}
                    <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-slate-950/70 text-white text-[10px] font-semibold backdrop-blur-sm">
                      NGO: {campaign.ngoName}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 md:p-8 flex flex-col flex-grow gap-5">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900 group-hover:text-trust-blue transition-colors duration-200">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {campaign.description}
                      </p>
                    </div>

                    {/* Progress Slider bar */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Fund Progress</span>
                        <span className="text-trust-blue">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-trust-blue to-cyan-500 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="font-bold text-slate-800">${campaign.raised.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">raised</span></span>
                        <span className="font-medium text-slate-500">Target: ${campaign.target.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Donate Now Button */}
                    <button
                      onClick={() => handleDonateNow(campaign.id)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-heading text-xs font-bold text-slate-950 border border-slate-200 bg-white hover:bg-slate-950 hover:text-white hover:border-slate-950 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Donate Now</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: CONTACT US */}
      <section id="contact" className="py-24 px-6 md:px-12 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-trust-blue">
              Audit Request Panel
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight">
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
            className="p-8 md:p-10 rounded-3xl border border-slate-100 bg-slate-50/50 backdrop-blur-md relative"
          >
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
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
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-subject" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Subject Matter
                  </label>
                  <select
                    id="contact-subject"
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-sm"
                  >
                    <option>General Inquiries</option>
                    <option>NGO Partnership Verification</option>
                    <option>System Security & Auditing</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
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
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-all duration-200 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-heading text-xs font-bold text-white bg-slate-900 hover:bg-trust-blue disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
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

