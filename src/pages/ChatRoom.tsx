import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, MoreVertical, Loader2, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function ChatRoom() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    // Fetch match data
    const fetchMatch = async () => {
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      if (matchDoc.exists()) {
        const data = matchDoc.data();
        if (!data.users.includes(user.uid)) {
          navigate('/chats');
          return;
        }
        setMatchData(data);
      }
    };
    fetchMatch();

    // Listen for messages
    const q = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [matchId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !matchId || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });

      // Update match with last message info
      await updateDoc(doc(db, 'matches', matchId), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-2" />
        <p className="text-gray-500 font-medium">Opening chat...</p>
      </div>
    );
  }

  const otherUserId = matchData?.users.find((uid: string) => uid !== user?.uid);

  return (
    <div className="flex flex-col h-[calc(100vh-64px-80px)] bg-gray-50 overflow-hidden relative">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/chats')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center overflow-hidden border border-green-100">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} 
                alt="Partner" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-none mb-1">PakBerlin Member</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400 hover:text-gray-600"><Phone className="w-5 h-5" /></button>
          <button className="p-2 text-gray-400 hover:text-gray-600"><Video className="w-5 h-5" /></button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to report this user?')) {
                alert('User reported. We will review the conversation.');
                navigate('/chats');
              }
            }}
            className="p-2 text-gray-400 hover:text-red-500"
            title="Report User"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          const showDate = idx === 0 || 
            (msg.createdAt && messages[idx-1].createdAt && 
             Math.abs(msg.createdAt.seconds - messages[idx-1].createdAt.seconds) > 3600);

          return (
            <div key={msg.id} className="flex flex-col">
              {showDate && msg.createdAt && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100 shadow-sm">
                    {format(msg.createdAt.toDate(), 'eeee, MMM d')}
                  </span>
                </div>
              )}
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "max-w-[80%] px-5 py-3.5 flex flex-col",
                  isMe 
                    ? "self-end bg-black text-white rounded-[24px_24px_4px_24px] shadow-lg shadow-black/5" 
                    : "self-start bg-white text-gray-900 rounded-[24px_24px_24px_4px] border border-gray-100 shadow-sm"
                )}
              >
                <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                <span className={cn(
                  "text-[9px] font-bold mt-1.5 uppercase tracking-widest opacity-40",
                  isMe ? "text-white" : "text-gray-400"
                )}>
                  {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                </span>
              </motion.div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 pl-6 pr-14 py-4 bg-gray-50 border border-transparent rounded-[24px] outline-none focus:bg-white focus:border-green-500 transition-all font-medium"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 w-12 h-12 bg-black text-white rounded-[18px] flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
