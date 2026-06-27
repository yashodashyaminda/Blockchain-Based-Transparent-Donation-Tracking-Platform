import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react';

interface CinematicHeroProps {
  onDonateClick: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onDonateClick }) => {
  // Parallax mouse coordinates
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();

  // Scroll animations for cinematic fade-out
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);
  const videoY = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMouseCoords({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Text animations
  const line1 = "TRANSPARENT GIVING";
  const line2 = "ANCHORED ON THE BLOCKCHAIN";

  const letterVariants = {
    hidden: { y: 120, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.2
      }
    }
  };

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-white">
      {/* Autoplay Fullscreen Video with Parallax Scroll */}
      <motion.div 
        style={{ y: videoY, scale }}
        className="absolute inset-0 w-full h-full"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/videos/1b.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Soft, premium overlay gradient to enforce readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/40 to-white" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50" />
      </motion.div>

      {/* Main Hero Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center gap-6"
      >
        {/* Web3 Anchor Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-white/60 shadow-sm backdrop-blur-md"
        >
          <ShieldCheck size={14} className="text-trust-blue" />
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-slate-800">
            Immutable Audit System v1.0
          </span>
        </motion.div>

        {/* Cinematic Heading Text */}
        <div className="overflow-hidden py-2">
          <motion.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-heading font-extrabold text-4xl md:text-7xl lg:text-8xl tracking-tighter leading-none text-slate-900"
          >
            {/* Row 1 */}
            <span className="block mb-2 overflow-hidden">
              {line1.split(" ").map((word, i) => (
                <span key={i} className="inline-block mr-4 overflow-hidden">
                  {word.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
              ))}
            </span>

            {/* Row 2 */}
            <span className="block text-trust-blue overflow-hidden">
              {line2.split(" ").map((word, i) => (
                <span key={i} className="inline-block mr-4 overflow-hidden">
                  {word.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      variants={letterVariants}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>
              ))}
            </span>
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, type: 'spring', stiffness: 120, damping: 20 }}
          className="text-base md:text-lg text-slate-700 max-w-2xl font-medium tracking-wide mt-2"
        >
          Anchor your kindness on the blockchain. Real-time auditing tracks every dollar from your wallet to local humanitarian milestones.
        </motion.p>

        {/* CTA Section with Mouse Parallax Trigger */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 150, damping: 20 }}
          style={{
            x: mouseCoords.x * 25,
            y: mouseCoords.y * 25,
          }}
          className="mt-6"
        >
          <button
            onClick={onDonateClick}
            className="flex items-center gap-3 bg-slate-900 hover:bg-trust-blue text-white px-8 py-4 rounded-2xl font-heading font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 glow-blue cursor-pointer"
          >
            <span>Explore Active Campaigns</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </motion.div>

      {/* Bouncing Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-10"
        onClick={() => {
          document.getElementById('goal')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-slate-500">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-8 h-8 rounded-full bg-slate-100/80 border border-slate-200/50 flex items-center justify-center text-slate-600 shadow-sm"
        >
          <ArrowDown size={14} />
        </motion.div>
      </motion.div>
    </section>
  );
};
