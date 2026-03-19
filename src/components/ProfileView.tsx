import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Settings, Map as MapIcon, Grid, LogOut, User as UserIcon } from 'lucide-react';

export const ProfileView = ({ onBack }: { onBack: () => void }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white p-6">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full">
          <MapIcon size={20} className="text-[#4ade80]" />
        </button>
        <h2 className="text-lg font-bold uppercase tracking-widest text-[#4ade80]">Inner Circle</h2>
        <button className="p-2 bg-white/5 rounded-full">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center mb-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-[#4ade80]/20 p-1 mb-4">
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserIcon size={48} className="text-white/20" />
              )}
            </div>
          </div>
          <div className="absolute bottom-4 right-0 bg-[#4ade80] text-[#0f1a14] p-1.5 rounded-full border-4 border-[#0f1a14]">
            <Settings size={14} />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{profile?.name || 'Explorer'}</h1>
        <p className="text-[#4ade80]/60 font-medium">@{profile?.username || 'trippr_user'}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="text-center">
          <p className="text-2xl font-bold">24</p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Memories</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-2xl font-bold">12</p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Circles</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">8</p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Journeys</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button className="flex-1 py-3 bg-white/5 rounded-xl flex items-center justify-center gap-2 border border-white/10">
          <Grid size={18} />
          <span className="text-sm font-bold">Memory Drop</span>
        </button>
        <button
          onClick={handleSignOut}
          className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
            <img
              src={`https://picsum.photos/seed/trip${i}/400/400`}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
              alt=""
            />
            <div className="absolute bottom-3 left-3">
              <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center">
                <MapIcon size={12} className="text-[#0f1a14]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
