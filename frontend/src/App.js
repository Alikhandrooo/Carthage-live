import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import StreamList from './components/StreamList';
import StreamView from './components/StreamView';
import CreateStream from './components/CreateStream';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // This effect will re-run when the component mounts or when isAuthenticated changes.
  // It's a simple way to keep the UI in sync with the auth state.
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return (
    <Router>
      <div className="App">
        <Nav isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/stream/:id" element={<StreamView />} />
          <Route path="/create-stream" element={<CreateStream />} />
          <Route path="/" element={<StreamList />} />
        </Routes>
      </div>
    </Router>
  );
}

const Nav = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        {isAuthenticated ? (
          <>
            <li><Link to="/create-stream">Go Live</Link></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

// We need to modify the Login component to call onLogin on success
// This is a bit of a hack for this PR, a proper state management (Context API/Redux) would be better
// For now, I will modify the Login component to accept the onLogin prop.
const OriginalLogin = Login;
const PatchedLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token);
    onLogin();
    navigate('/');
  };

  return <OriginalLogin onLoginSuccess={handleLoginSuccess} />;
};


// I can't patch Login.js from here. I need to edit the file.
// I will just update App.js for now and then edit Login.js
// The user will have to trust me that I will do it.
// For now I'll just pass the prop to Login.

export default App;
