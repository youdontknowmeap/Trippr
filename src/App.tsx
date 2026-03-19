import React, { useState } from 'react';
import { MapView } from './components/MapView';
import { JourneyDive } from './components/JourneyDive';
import { AddPostcard } from './components/AddPostcard';
import { FriendsView } from './components/FriendsView';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Map as MapIcon, Users, Plus, Heart, Compass, User as UserIcon } from 'lucide-react';

const AppContent = () => {
  const { user, loading, signIn, signOut } = useFirebase();
  const [selectedPostcard, setSelectedPostcard] = useState<any>(null);
  const [isAddingPostcard, setIsAddingPostcard] = useState(false);
  const [isViewingFriends, setIsViewingFriends] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0d1410] flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#0d1410] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 tapestry-grid opacity-30" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-700/20 rounded-full blur-[120px]" 
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full glass-dark p-12 rounded-[40px] shadow-2xl relative z-10 text-center"
        >
          <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
            <Compass className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-4 tracking-tight">Trippr</h1>
          <p className="text-zinc-400 mb-10 leading-relaxed text-lg">
            A private social map for your Inner Circle. <br/>
            Pin memories, tag friends, and weave your collective tapestry.
          </p>
          
          <button
            onClick={() => signIn()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0d1410] font-bold py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-500/30 group"
          >
            <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            <span className="text-lg">Enter the Tapestry</span>
          </button>
          
          <div className="mt-10 flex items-center justify-center gap-6 opacity-30">
            <div className="h-px w-12 bg-white" />
            <p className="text-[10px] text-white uppercase tracking-[0.3em] font-bold">
              Private • Secure • Collaborative
            </p>
            <div className="h-px w-12 bg-white" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0d1410] text-white font-sans overflow-hidden">
      <MapView onPostcardClick={setSelectedPostcard} />
      
      {/* Top Navigation / User Profile */}
      <div className="fixed top-8 left-8 right-8 flex items-center justify-between z-40 pointer-events-none">
        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 pointer-events-auto">
          <Compass className="w-5 h-5 text-emerald-400" />
          <span className="font-display font-bold tracking-tight text-lg">Trippr</span>
        </div>

        <div className="relative pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-12 h-12 rounded-2xl glass overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-colors"
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
            ) : (
              <UserIcon className="w-full h-full p-3 text-zinc-400" />
            )}
          </motion.button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-4 w-64 glass-dark rounded-3xl shadow-2xl overflow-hidden p-2"
              >
                <div className="p-4 border-b border-white/5">
                  <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 p-4 hover:bg-rose-500/10 text-rose-400 transition-colors rounded-2xl"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedPostcard && (
          <JourneyDive 
            postcard={selectedPostcard} 
            onClose={() => setSelectedPostcard(null)} 
          />
        )}
        
        {isAddingPostcard && (
          <AddPostcard onClose={() => setIsAddingPostcard(false)} />
        )}

        {isViewingFriends && (
          <FriendsView onClose={() => setIsViewingFriends(false)} />
        )}
      </AnimatePresence>

      {/* Navigation Dock */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <div className="glass-dark p-2 rounded-[32px] flex items-center gap-2 shadow-2xl border border-white/10">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsViewingFriends(true)}
            className={`p-4 rounded-2xl transition-colors ${isViewingFriends ? 'text-emerald-400 bg-white/5' : 'text-zinc-400'}`}
          >
            <Users className="w-6 h-6" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingPostcard(true)}
            className="bg-emerald-500 text-[#0d1410] px-8 py-4 rounded-[24px] shadow-xl shadow-emerald-500/20 flex items-center gap-3 font-bold text-lg"
          >
            <Plus className="w-6 h-6" />
            <span>Pin Memory</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-2xl text-rose-400 transition-colors"
          >
            <Heart className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
