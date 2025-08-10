import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StreamList = () => {
  const [streams, setStreams] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/streams');
        if (response.ok) {
          const data = await response.json();
          setStreams(data);
        } else {
          setMessage('Failed to fetch streams.');
        }
      } catch (error) {
        setMessage('Failed to connect to the server.');
      }
    };

    fetchStreams();
  }, []);

  return (
    <div>
      <h2>Live Streams</h2>
      {message && <p>{message}</p>}
      {streams.length === 0 && !message ? (
        <p>No live streams at the moment. Why not start one?</p>
      ) : (
        <ul>
          {streams.map((stream) => (
            <li key={stream.id}>
              <Link to={`/stream/${stream.id}`}>
                <h3>{stream.title}</h3>
                <p>{stream.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StreamList;
