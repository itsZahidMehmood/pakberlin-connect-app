import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Camera, User, MapPin, Tag, Save, Loader2, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    bio: profile?.bio || '',
    neighborhood: profile?.neighborhood || '',
    interestsString: profile?.interests?.join(', ') || '',
    profilePic: profile?.profilePic || ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const interests = formData.interestsString
        .split(',')
        .map(i => i.trim())
        .filter(i => i !== '');

      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        age: formData.age ? Number(formData.age) : null,
        bio: formData.bio,
        neighborhood: formData.neighborhood,
        interests,
        profilePic: formData.profilePic,
        updatedAt: serverTimestamp()
      });
      
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
        <p className="text-gray-500">How people see you on PakBerlin Connect</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-gray-100 border-4 border-white shadow-xl">
              <img 
                src={formData.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-green-700 transition-colors">
              <Camera className="w-5 h-5" />
              <input 
                type="text" 
                className="hidden" 
                onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
                placeholder="Image URL"
              />
            </label>
          </div>
          <div className="w-full max-w-xs">
             <input
              type="text"
              value={formData.profilePic}
              onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:border-green-500 text-center"
              placeholder="Paste image URL here"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                 Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none"
                placeholder="Optional"
              />
            </div>
          </div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MapPin className="w-3 h-3" /> Location
              </label>
              <input
                type="text"
                value="Berlin, Germany"
                disabled
                className="w-full px-5 py-3.5 bg-gray-100 border border-transparent rounded-2xl text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MapPin className="w-3 h-3" /> Neighborhood
              </label>
              <select
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none"
              >
                <option value="">Select Neighborhood</option>
                <option value="Mitte">Mitte</option>
                <option value="Neukölln">Neukölln</option>
                <option value="Kreuzberg">Kreuzberg</option>
                <option value="Wedding">Wedding</option>
                <option value="Charlottenburg">Charlottenburg</option>
                <option value="Prenzlauer Berg">Prenzlauer Berg</option>
                <option value="Friedrichshain">Friedrichshain</option>
                <option value="Schöneberg">Schöneberg</option>
                <option value="Moabit">Moabit</option>
                <option value="Spandau">Spandau</option>
                <option value="Dahlem">Dahlem</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <Tag className="w-3 h-3" /> Interests (comma separated)
            </label>
            <input
              type="text"
              value={formData.interestsString}
              onChange={(e) => setFormData({ ...formData, interestsString: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none"
              placeholder="Cricket, Music, Urdu Literature..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <Info className="w-3 h-3" /> Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-green-500 transition-all outline-none min-h-[120px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full h-16 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
            success ? "bg-green-50 text-green-600 shadow-green-100" : "bg-black text-white hover:bg-gray-800 shadow-black/10"
          )}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : success ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              Changes Saved
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              Save Profile
            </>
          )}
        </button>
      </form>
    </div>
  );
}
