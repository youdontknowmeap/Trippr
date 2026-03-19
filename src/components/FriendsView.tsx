import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, UserPlus, Check, Clock, UserMinus, Loader2 } from 'lucide-react';
import { db, collection, getDocs, query, where, addDoc, deleteDoc, doc, updateDoc, getDoc, Timestamp, handleFirestoreError, OperationType, onSnapshot } from '../firebase';
import { useFirebase } from '../FirebaseProvider';

interface FriendsViewProps {
  onClose: () => void;
}

export const FriendsView = ({ onClose }: FriendsViewProps) => {
  const { user } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'friendships'),
      where('user1Id', '==', user.uid)
    );
    const q2 = query(
      collection(db, 'friendships'),
      where('user2Id', '==', user.uid)
    );

    const unsub1 = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendships(prev => [...prev.filter(f => f.user1Id !== user.uid), ...docs]);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendships(prev => [...prev.filter(f => f.user2Id !== user.uid), ...docs]);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user?.uid]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(query(usersRef, where('displayName', '>=', searchQuery), where('displayName', '<=', searchQuery + '\uf8ff')));
      setSearchResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user?.uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (targetId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        user1Id: user.uid,
        user2Id: targetId,
        status: 'pending',
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'friendships');
    }
  };

  const acceptFriend = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `friendships/${friendshipId}`);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `friendships/${friendshipId}`);
    }
  };

  const getFriendshipStatus = (targetId: string) => {
    const f = friendships.find(f => f.user1Id === targetId || f.user2Id === targetId);
    if (!f) return null;
    return f;
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
        className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Friends</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Search by name..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pl-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <button 
              onClick={searchUsers}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
            >
              Search
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Search Results</p>
                {searchResults.map(u => {
                  const f = getFriendshipStatus(u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL} className="w-10 h-10 rounded-full" alt="" />
                        <span className="text-white font-medium">{u.displayName}</span>
                      </div>
                      {f ? (
                        f.status === 'pending' ? (
                          f.user2Id === user?.uid ? (
                            <button onClick={() => acceptFriend(f.id)} className="p-2 bg-emerald-500 text-[#0f1a14] rounded-xl">
                              <Check size={18} />
                            </button>
                          ) : (
                            <div className="p-2 text-zinc-500">
                              <Clock size={18} />
                            </div>
                          )
                        ) : (
                          <button onClick={() => removeFriend(f.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                            <UserMinus size={18} />
                          </button>
                        )
                      ) : (
                        <button onClick={() => addFriend(u.id)} className="p-2 bg-white/5 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all">
                          <UserPlus size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Your Connections</p>
                {friendships.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-8 italic">No friends yet. Start searching!</p>
                ) : (
                  friendships.map(f => (
                    <FriendItem key={f.id} friendship={f} onAccept={acceptFriend} onRemove={removeFriend} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FriendItem: React.FC<{ friendship: any, onAccept: (id: string) => Promise<void>, onRemove: (id: string) => Promise<void> }> = ({ friendship, onAccept, onRemove }) => {
  const { user } = useFirebase();
  const [friend, setFriend] = useState<any>(null);
  const friendId = friendship.user1Id === user?.uid ? friendship.user2Id : friendship.user1Id;

  useEffect(() => {
    getDoc(doc(db, 'users', friendId)).then(snap => {
      if (snap.exists()) setFriend(snap.data());
    });
  }, [friendId]);

  if (!friend) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center gap-3">
        <img src={friend.photoURL} className="w-10 h-10 rounded-full" alt="" />
        <div>
          <p className="text-white font-medium">{friend.displayName}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            {friendship.status === 'pending' ? 'Pending Request' : 'Connected'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {friendship.status === 'pending' && friendship.user2Id === user?.uid && (
          <button onClick={() => onAccept(friendship.id)} className="p-2 bg-emerald-500 text-[#0f1a14] rounded-xl shadow-lg shadow-emerald-500/20">
            <Check size={18} />
          </button>
        )}
        <button onClick={() => onRemove(friendship.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
          <UserMinus size={18} />
        </button>
      </div>
    </div>
  );
};
