import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const StreamView = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Join a room for the stream
    socket.emit('join stream', id);

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup on component unmount
    return () => {
      socket.emit('leave stream', id);
      socket.off('chat message');
    };
  }, [id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('chat message', { streamId: id, text: message });
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Stream {id}</h2>
      <div className="video-placeholder" style={{ width: '100%', height: '400px', backgroundColor: '#000' }}>
        <h3 style={{color: 'white'}}>Video stream would be here</h3>
      </div>

      <h3>Chat</h3>
      <ul id="messages">
        {messages.map((msg, index) => (
          <li key={index}>{msg.text}</li>
        ))}
      </ul>
      <form id="form" onSubmit={sendMessage}>
        <input
          id="input"
          autoComplete="off"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button>Send</button>
      </form>
    </div>
  );
};

export default StreamView;
