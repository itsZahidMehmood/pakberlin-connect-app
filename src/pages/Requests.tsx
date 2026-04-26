import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, UserPlus, X, Loader2, Heart } from 'lucide-react';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen for incoming requests
    const q = query(
      collection(db, 'friend_requests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleAccept = async (request: any) => {
    if (!user) return;
    
    try {
      // 1. Create a match
      const matchId = [user.uid, request.fromUid].sort().join('_');
      await setDoc(doc(db, 'matches', matchId), {
        users: [user.uid, request.fromUid],
        createdAt: serverTimestamp(),
        lastMessage: 'You are now connected!',
        lastMessageAt: serverTimestamp()
      });

      // 2. Update request status or delete it
      await deleteDoc(doc(db, 'friend_requests', request.id));
      
      alert('Match created! You can now chat.');
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-2" />
        <p className="text-gray-500">Checking for requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Connect Requests</h1>
        <p className="text-gray-500">People who want to connect with you in Berlin</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {requests.length > 0 ? (
            requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center overflow-hidden border border-green-100">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${req.fromUid}`} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">Community Member</h3>
                  <p className="text-xs text-gray-500 font-medium">Wants to connect with you</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDecline(req.id)}
                    className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => handleAccept(req)}
                    className="h-12 px-6 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 transition-all shadow-lg shadow-green-200"
                  >
                    <UserCheck className="w-5 h-5" />
                    Accept
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-200" />
              </div>
              <h3 className="font-bold text-gray-900">No new requests</h3>
              <p className="text-gray-500 text-sm">When people like your profile, they'll show up here.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
