const express = require('express');
const cors = require('cors');
require('dotenv').config();

const registerRoutes = require('./routes/register');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/register', registerRoutes);
app.use('/api/contact', contactRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
