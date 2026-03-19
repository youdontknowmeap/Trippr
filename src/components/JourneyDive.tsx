import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Heart, Star, Smile, Trash2 } from 'lucide-react';
import { db, doc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../FirebaseProvider';

interface JourneyDiveProps {
  postcard: any;
  onClose: () => void;
}

export const JourneyDive = ({ postcard, onClose }: JourneyDiveProps) => {
  const { user } = useFirebase();
  const [author, setAuthor] = useState<any>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAuthor = async () => {
      const userRef = doc(db, 'users', postcard.authorId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setAuthor(userSnap.data());
      }
    };
    fetchAuthor();

    const q = query(collection(db, 'reactions'), where('postcardId', '==', postcard.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [postcard.id, postcard.authorId]);

  const handleReaction = async (type: string) => {
    if (!user) return;
    
    const existing = reactions.find(r => r.userId === user.uid && r.type === type);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'reactions', existing.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reactions/${existing.id}`);
      }
    } else {
      try {
        await addDoc(collection(db, 'reactions'), {
          postcardId: postcard.id,
          userId: user.uid,
          type,
          createdAt: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'reactions');
      }
    }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== postcard.authorId) return;
    if (!window.confirm('Are you sure you want to delete this memory?')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'postcards', postcard.id));
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `postcards/${postcard.id}`);
      setIsDeleting(false);
    }
  };

  const getReactionCount = (type: string) => reactions.filter(r => r.type === type).length;
  const hasReacted = (type: string) => reactions.some(r => r.userId === user?.uid && r.type === type);

  return (
    <motion.div
      drag
      dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
      initial={{ y: '100%', scale: 0.9, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: '100%', scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-4 z-[100] bg-[#0f1a14] flex flex-col rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing"
    >
      <div className="relative h-2/3 w-full">
        <img
          src={postcard.coverImageUrl}
          className="w-full h-full object-cover"
          alt={postcard.locationName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a14] via-transparent to-transparent" />
        
        <div className="absolute top-6 right-6 flex items-center gap-2.5">
          {user?.uid === postcard.authorId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2.5 bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-full text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 transition-all shadow-xl"
          >
            <Plus className="rotate-45" size={20} />
          </button>
        </div>
      </div>

      <div className="p-12 flex-1 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            {author && (
              <div className="relative">
                <img src={author.photoURL} className="w-14 h-14 rounded-full border-2 border-emerald-500/20 shadow-xl" alt="" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0f1a14]" />
              </div>
            )}
            <div>
              <h2 className="text-4xl font-display font-bold text-white tracking-tight mb-0.5">{postcard.locationName}</h2>
              <p className="text-emerald-400 font-display font-bold uppercase tracking-[0.25em] text-[10px]">Memory by {author?.displayName || '...'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {[
              { type: 'heart', icon: Heart, color: 'text-rose-400', activeBg: 'bg-rose-500/10' },
              { type: 'star', icon: Star, color: 'text-amber-400', activeBg: 'bg-amber-500/10' },
              { type: 'smile', icon: Smile, color: 'text-sky-400', activeBg: 'bg-sky-500/10' }
            ].map(({ type, icon: Icon, color, activeBg }) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                  hasReacted(type) 
                    ? `${activeBg} border-white/20 ${color} shadow-lg shadow-black/20` 
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                }`}
              >
                <Icon 
                  size={18} 
                  className="transition-transform duration-300"
                  fill={hasReacted(type) ? 'currentColor' : 'none'} 
                />
                <span className="text-xs font-bold tabular-nums">{getReactionCount(type)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-white/2 p-5 rounded-2xl border border-white/5 group hover:bg-white/[0.04] transition-colors">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold mb-1.5">Captured</p>
            <p className="text-white font-mono text-base">
              {postcard.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Recently'}
            </p>
          </div>
          <div className="bg-white/2 p-5 rounded-2xl border border-white/5 group hover:bg-white/[0.04] transition-colors">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold mb-1.5">Coordinates</p>
            <p className="text-white font-mono text-base">
              {postcard.latitude.toFixed(4)}°N / {postcard.longitude.toFixed(4)}°E
            </p>
          </div>
        </div>

        <div className="relative mb-12">
          <div className="absolute -left-6 top-0 bottom-0 w-px bg-emerald-500/10" />
          <p className="text-white/70 leading-relaxed text-xl font-serif italic pl-2">
            "{postcard.content || 'No description provided.'}"
          </p>
        </div>
        
        {postcard.taggedUserIds?.length > 0 && (
          <div className="mt-12 pt-10 border-t border-white/5">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold mb-5">In the Circle</p>
            <div className="flex flex-wrap gap-2.5">
              {postcard.taggedUserIds.map((uid: string) => (
                <TaggedUser key={uid} uid={uid} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TaggedUser: React.FC<{ uid: string }> = ({ uid }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) setUser(snap.data());
    });
  }, [uid]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2.5 bg-white/2 px-3.5 py-1.5 rounded-full border border-white/5 hover:bg-white/5 transition-colors">
      <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="" />
      <span className="text-xs text-white/70 font-bold">{user.displayName}</span>
    </div>
  );
};
