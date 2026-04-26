import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, User, ChevronRight, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatList() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    // Listen for matches where user is participant
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const matchesData: any[] = [];
      
      for (const matchDoc of snapshot.docs) {
        const data = matchDoc.data();
        const otherUserId = data.users.find((uid: string) => uid !== user.uid);
        
        // Fetch other user's profile
        // In a real app we'd use a hook or cache for this
        matchesData.push({
          id: matchDoc.id,
          otherUserId,
          ...data,
          // Placeholder for other user data which will be fetched if needed or static in this list
        });
      }
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Chat list error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const filteredMatches = matches.filter(m => m.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Conversations</h1>
        <p className="text-gray-500">Connect with your community</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-medium outline-none focus:border-green-500 shadow-sm transition-all"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-3xl w-full"></div>
          ))
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Link 
              key={match.id} 
              to={`/chat/${match.id}`}
              className="block bg-white p-4 rounded-3xl border border-gray-50 hover:border-green-100 transition-all hover:shadow-lg hover:shadow-green-500/5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center overflow-hidden border border-green-100 shadow-sm">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${match.otherUserId}`} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">Chat {match.id.slice(0, 4)}...</h3>
                    {match.lastMessageAt && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {formatDistanceToNow(match.lastMessageAt.toDate(), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate font-medium">
                    {match.lastMessage || "Start the conversation..."}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900">No chats yet</h3>
            <p className="text-gray-500 text-sm">Start matching to begin chatting!</p>
          </div>
        )}
      </div>
    </div>
  );
}
