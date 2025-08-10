import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateStream = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      setMessage('You must be logged in to create a stream.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        const newStream = await response.json();
        setMessage('Stream created successfully!');
        navigate(`/stream/${newStream.id}`);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to create stream.');
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    }
  };

  return (
    <div>
      <h2>Create a New Stream</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit">Go Live</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateStream;
