'use client';
import React, { useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
} from 'stream-chat-react';
// import 'stream-chat-react/dist/css/index.css';

// Initialize Stream Chat Client
const client = StreamChat.getInstance('your-stream-api-key'); // Replace with your API key

const ChatBar = ({ visible, onClose }) => {
  const [channel] = useState(
    client.channel('messaging', 'meeting-room', {
      name: 'Meeting Room Chat',
    })
  );

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 w-full md:w-1/3 right-0 bg-gray-900 bg-opacity-80 p-4 rounded-lg z-10">
      <Chat client={client} theme="messaging light">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </Chat>
      <button
        className="absolute top-2 right-2 text-white bg-red-500 p-2 rounded-lg"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default ChatBar;
