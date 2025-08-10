const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const port = 3001;
const dbPath = path.join(__dirname, 'db.json');
const JWT_SECRET = 'your-super-secret-key'; // In a real app, use an environment variable

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read the database
const readDb = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with default structure
      const defaultDb = { users: [] };
      await fs.writeFile(dbPath, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    throw error;
  }
};

// Helper function to write to the database
const writeDb = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = await readDb();

  const existingUser = db.users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword };
  db.users.push(newUser);
  await writeDb(db);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const db = await readDb();
  const user = db.users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});


// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Stream management endpoints
// Get all streams
app.get('/api/streams', async (req, res) => {
  const db = await readDb();
  res.json(db.streams);
});

// Create a new stream
app.post('/api/streams', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const streamerId = req.user.id;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const db = await readDb();
  const newStream = {
    id: Date.now(),
    title,
    description,
    streamerId,
    createdAt: new Date().toISOString(),
  };

  db.streams.push(newStream);
  await writeDb(db);

  res.status(201).json(newStream);
});

// Delete a stream
app.delete('/api/streams/:id', authenticateToken, async (req, res) => {
  const streamId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const db = await readDb();
  const streamIndex = db.streams.findIndex(s => s.id === streamId);

  if (streamIndex === -1) {
    return res.status(404).json({ message: 'Stream not found' });
  }

  if (db.streams[streamIndex].streamerId !== userId) {
    return res.status(403).json({ message: 'You are not authorized to delete this stream' });
  }

  db.streams.splice(streamIndex, 1);
  await writeDb(db);

  res.status(204).send();
});


app.get('/', (req, res) => {
  res.send('Hello from the Pleasure Live backend!');
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join stream', (streamId) => {
    socket.join(streamId);
    console.log(`user ${socket.id} joined stream ${streamId}`);
  });

  socket.on('leave stream', (streamId) => {
    socket.leave(streamId);
    console.log(`user ${socket.id} left stream ${streamId}`);
  });

  socket.on('chat message', ({ streamId, text }) => {
    io.to(streamId).emit('chat message', { text, sender: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Pleasure Live backend listening at http://localhost:${port}`);
});
