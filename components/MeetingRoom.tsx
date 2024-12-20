'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  PaginatedGridLayout,
  SpeakerLayout,
  CallingState,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { initializeApp } from '@firebase/app';
import { getDatabase, ref, push, set, onChildAdded } from '@firebase/database';
import { useUser } from '@clerk/clerk-react'; // Clerk's user hook

import Loader from './Loader';
import { cn } from '@/lib/utils';

// Firebase Configuration (Replace with your own Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyBskmcG-VThF3OY8ZKpVgIec-NE6GHoy6I",
  authDomain: "nskc-chat.firebaseapp.com",
  databaseURL: "https://nskc-chat-default-rtdb.firebaseio.com",
  projectId: "nskc-chat",
  storageBucket: "nskc-chat.firebasestorage.app",
  messagingSenderId: "507362536093",
  appId: "1:507362536093:web:f87b0f6eafb9ef69878274",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const MeetingRoom = () => {
  // const searchParams = useSearchParams();
  // const isPersonalRoom = !!searchParams.get('personal');
  // const [layout, setLayout] = useState<'grid' | 'speaker-left' | 'speaker-right'>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Clerk user data
  const { user, isLoaded, isSignedIn } = useUser();

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const updateMobileView = () => {
      setIsMobile(window.innerWidth <= 768); // Mobile if width <= 768px
    };
    updateMobileView();
    window.addEventListener('resize', updateMobileView);
    return () => window.removeEventListener('resize', updateMobileView);
  }, []);

  // Send message to Firebase
  const sendMessage = () => {
    if (!newMessage.trim()) return; // Prevent empty messages

    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef);

    set(newMessageRef, {
      message: newMessage.trim(),
      timestamp: Date.now(),
      sender: user?.fullName || "Anonymous", // Use Clerk user's name
    })
      .then(() => setNewMessage('')) // Clear message input
      .catch((error) => console.error('Error sending message:', error));
  };

  // Fetch messages from Firebase
  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      const messagesRef = ref(database, 'messages');
      const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val()?.message;
        if (message) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });
      return () => unsubscribe();
    }
  }, [callingState]);

  // Show loader if call isn't joined
  if (callingState !== CallingState.JOINED) return <Loader />;

  // Render Call Layout
  const CallLayoutComponent = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      {/* Main Layout */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center justify-center">
          <CallLayoutComponent />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList
            onClose={() => setShowParticipants(false)}
            userRenderer={(participant) => (
              <div className="text-white">{participant.fullName || 'Anonymous'}</div>
            )}
          />
        </div>
      </div>

      {/* Chat Window */}
      {showChat && (
        <div className="fixed bottom-16 w-full md:w-1/3 right-0 bg-black bg-opacity-70 p-4 rounded-lg z-10">
          <div className="text-white">
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <div className="overflow-y-auto max-h-48" id="chatWindow">
              {messages.map((message, index) => (
                <div key={index} className="text-white">
                  {message}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-grow p-2 rounded-lg bg-gray-800 text-white"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white p-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Controls and User Info */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-2 mob-call-control flex-col md:flex-row">
        <CallControls
          disableScreenShare={isMobile} // Disable screen sharing on mobile
          disableRecording={isMobile} // Disable recording on mobile
        />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChat((prev) => !prev)}>
            <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <Users size={20} className="text-white" />
            </div>
          </button>
          {/* User Info */}
          {isLoaded && isSignedIn && user && (
            <div className="text-white text-lg">{user.fullName || 'Anonymous User'}</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
