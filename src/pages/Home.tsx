import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, MapPin, Loader2, Sparkles, User, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !profile) return;
      
      try {
        const q = query(
          collection(db, 'users'),
          where('city', '==', 'Berlin'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const myInterests = profile.interests || [];
        const myNeighborhood = profile.neighborhood || '';

        const scoredUsers = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            const theirInterests = data.interests || [];
            const theirNeighborhood = data.neighborhood || '';
            
            // Calculate Similarity Score
            const sharedInterests = myInterests.filter((i: string) => theirInterests.includes(i));
            let score = sharedInterests.length * 10;
            
            // Proximity Bonus
            if (myNeighborhood && theirNeighborhood && myNeighborhood === theirNeighborhood) {
              score += 25;
            }

            return { 
              id: doc.id, 
              ...data, 
              score, 
              sharedInterestCount: sharedInterests.length 
            };
          })
          .filter(u => u.id !== user.uid)
          // Sort by highest score first
          .sort((a, b) => b.score - a.score);
        
        setUsers(scoredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchUsers();
    }
  }, [user, profile]);

  const handleAction = async (targetUserId: string, action: 'like' | 'pass') => {
    if (action === 'like') {
      try {
        const requestId = `${user?.uid}_${targetUserId}`;
        await setDoc(doc(db, 'friend_requests', requestId), {
          fromUid: user?.uid,
          toUid: targetUserId,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        // Optional: Notify user (if you had a notification system)
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    }
    
    // Move to next card
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
        <p className="text-gray-500 font-medium">Finding people nearby...</p>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="max-w-md mx-auto px-4 h-[calc(100vh-140px)] flex flex-col justify-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        {currentIndex < users.length ? (
          <motion.div
            key={currentUser.id}
            initial={{ scale: 0.9, opacity: 0, x: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ x: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col h-[600px]"
          >
            <div className="relative h-[65%] w-full">
              <img 
                src={currentUser.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} 
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute top-6 right-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Report this profile for community safety?')) {
                      alert('Profile reported anonymously.');
                      setCurrentIndex(prev => prev + 1);
                    }
                  }}
                  className="bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md text-white/80 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ''}</h2>
                  <div className="h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-500/20"></div>
                </div>
                <div className="flex items-center text-white/80 text-sm gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{currentUser.neighborhood ? `${currentUser.neighborhood}, ` : ''}{currentUser.city}</span>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {currentUser.sharedInterestCount > 0 && (
                <div className="mb-4 flex items-center gap-1.5 text-[10px] font-extrabold text-green-600 uppercase tracking-widest bg-green-50 w-fit px-2 py-1 rounded-lg">
                  <Sparkles className="w-3 h-3 fill-green-600" />
                  {currentUser.sharedInterestCount} Shared Interests
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentUser.interests?.map((interest: string) => (
                  <span key={interest} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                    {interest}
                  </span>
                )) || (
                  <span className="text-gray-400 text-xs italic">No interests listed</span>
                )}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {currentUser.bio || "No bio available."}
              </p>
              
              <div className="mt-auto flex justify-between gap-4 pt-4">
                <button 
                  onClick={() => handleAction(currentUser.id, 'pass')}
                  className="flex-1 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-8 h-8 text-gray-400" />
                </button>
                <button 
                  onClick={() => handleAction(currentUser.id, 'like')}
                  className="flex-1 h-16 rounded-3xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-200 hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Heart className="w-8 h-8 text-white fill-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">That's everyone for now!</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              You've seen everyone in Berlin. Check back later for new people or update your interests.
            </p>
            <button 
              onClick={() => setCurrentIndex(0)}
              className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition-all"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-wider text-gray-600">
           Berlin, Germany
        </div>
      </div>
    </div>
  );
}
