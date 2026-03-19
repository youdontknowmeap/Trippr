import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, MapPin, Users, Send, Loader2 } from 'lucide-react';
import { db, collection, addDoc, getDocs, query, where, Timestamp, handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { useFirebase } from '../FirebaseProvider';

interface AddPostcardProps {
  onClose: () => void;
}

export const AddPostcard = ({ onClose }: AddPostcardProps) => {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationName, setLocationName] = useState('');
  const [content, setContent] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const searchFriends = async (q: string) => {
    if (!q.trim() || !user) {
      setSearchResults([]);
      return;
    }

    try {
      // 1. Fetch accepted friendships
      const friendshipsRef = collection(db, 'friendships');
      const q1 = query(friendshipsRef, where('user1Id', '==', user.uid), where('status', '==', 'accepted'));
      const q2 = query(friendshipsRef, where('user2Id', '==', user.uid), where('status', '==', 'accepted'));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const friendIds = [
        ...snap1.docs.map(doc => doc.data().user2Id),
        ...snap2.docs.map(doc => doc.data().user1Id)
      ];

      if (friendIds.length === 0) {
        setSearchResults([]);
        return;
      }

      // 2. Fetch user details for these friends and filter by query
      // Note: Firestore 'in' query is limited to 10 items. 
      // For a larger circle, we'd need a different approach or multiple queries.
      // For this demo, we'll fetch them and filter locally for simplicity.
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const friends = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(u => friendIds.includes(u.id) && u.displayName.toLowerCase().includes(q.toLowerCase()));

      setSearchResults(friends);
    } catch (error) {
      console.error('Error searching friends:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchFriends(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !locationName) return;

    setLoading(true);
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `postcards/${user.uid}/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. Save postcard metadata to Firestore
      await addDoc(collection(db, 'postcards'), {
        authorId: user.uid,
        locationName,
        latitude: (Math.random() * 180) - 90, // Mock coordinates for demo
        longitude: (Math.random() * 360) - 180,
        coverImageUrl: downloadUrl,
        content,
        taggedUserIds: taggedUsers.map(u => u.id),
        createdAt: Timestamp.now(),
        rotation: (Math.random() * 20) - 10,
        x: Math.random() * 1000,
        y: Math.random() * 800
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'postcards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-[#0f1a14]/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-dark border border-white/5 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Pin a Memory</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Share a moment from your journey</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Memory Photo</label>
            <div 
              className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden ${
                imagePreview ? 'border-emerald-500/50' : 'border-white/10 hover:border-emerald-500/30'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-zinc-400">
                    <Camera size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Select from Gallery</p>
                    <p className="text-zinc-500 text-sm">JPG, PNG up to 5MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>

          {/* Location & Content */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <MapPin size={12} /> Location
              </label>
              <input 
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Where was this?"
                className="w-full bg-white/2 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <Users size={12} /> Inner Circle
              </label>
              <div className="relative">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="w-full bg-white/2 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
                />
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 glass-dark border border-white/5 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1.5"
                    >
                      {searchResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (!taggedUsers.find(tu => tu.id === u.id)) {
                              setTaggedUsers([...taggedUsers, u]);
                            }
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <img src={u.photoURL} className="w-6 h-6 rounded-full" alt="" />
                          <span className="text-white text-xs font-bold">{u.displayName}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {taggedUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <span className="text-[10px] text-emerald-400 font-bold">{u.displayName}</span>
                    <button type="button" onClick={() => setTaggedUsers(taggedUsers.filter(tu => tu.id !== u.id))}>
                      <X size={10} className="text-emerald-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-[0.2em] ml-1">The Story</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell the story behind this memory..."
              rows={4}
              className="w-full bg-white/2 border border-white/5 rounded-2xl px-5 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-colors resize-none"
            />
          </div>
        </form>

        <div className="p-8 border-t border-white/5">
          <button
            onClick={handleSubmit}
            disabled={loading || !imageFile || !locationName}
            className="w-full btn-pill btn-primary py-4 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="text-sm font-bold">{loading ? 'Pinning Memory...' : 'Pin to Tapestry'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
