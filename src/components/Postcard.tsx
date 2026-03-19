import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, doc, getDoc } from '../firebase';

interface PostcardProps {
  key?: React.Key;
  postcard: any;
  onClick: () => void;
}

export const Postcard = ({ postcard, onClick }: PostcardProps) => {
  const [author, setAuthor] = useState<any>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      const userRef = doc(db, 'users', postcard.authorId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setAuthor(userSnap.data());
      }
    };
    fetchAuthor();
  }, [postcard.authorId]);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotate: (postcard.rotation || 0) - 15 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        rotate: postcard.rotation || 0,
      }}
      whileHover={{ 
        scale: 1.1, 
        rotate: 0,
        zIndex: 50,
        filter: 'brightness(1.05) saturate(1.1)',
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        damping: 12, 
        stiffness: 100,
        filter: { duration: 0.2 }
      }}
      onClick={onClick}
      style={{
        left: postcard.x,
        top: postcard.y,
      }}
      className="absolute cursor-pointer group"
    >
      {/* Refined Memory Ripple Effect */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.4, 1.8],
              opacity: [0.4, 0.2, 0],
              backgroundColor: ['rgba(74, 222, 128, 0.2)', 'rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0)'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.3,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-lg blur-2xl"
          />
        ))}
      </div>

      {/* Physical Polaroid Style */}
      <motion.div 
        whileHover={{ backgroundColor: '#fff' }}
        className="bg-[#fdfcf8] p-2 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm transition-colors duration-300 relative overflow-hidden"
      >
        {/* Subtle Postmark Overlay */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none rotate-12 translate-x-4 -translate-y-4">
          <div className="w-full h-full border-2 border-black rounded-full flex items-center justify-center border-dashed">
            <span className="text-[6px] font-bold text-black text-center uppercase leading-none">
              Trippr<br/>Official
            </span>
          </div>
        </div>

        <div className="relative w-44 h-44 bg-zinc-100 overflow-hidden rounded-sm">
          <img
            src={postcard.coverImageUrl}
            className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500"
            alt=""
          />

          {/* Postage Stamp Avatar */}
          {author && (
            <div className="absolute top-3 right-3 w-10 h-10 bg-white p-1 shadow-lg rounded-sm rotate-3 group-hover:rotate-0 transition-transform">
              <img src={author.photoURL} className="w-full h-full object-cover rounded-sm" alt="" />
              <div className="absolute inset-0 border border-black/5 pointer-events-none" />
            </div>
          )}
          
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)] pointer-events-none" />
        </div>

        <div className="mt-4 px-1 space-y-1">
          <p className="text-[11px] font-display font-bold text-zinc-900 uppercase tracking-tight truncate">
            {postcard.locationName}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-zinc-400 font-mono tracking-tighter">
              {postcard.latitude.toFixed(3)}° / {postcard.longitude.toFixed(3)}°
            </p>
            <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
