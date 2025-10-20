// Simple Node.js proxy for CORS development
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 5179;

// Add CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

app.get('/proxy/controllers', async (req, res) => {
  try {
    const response = await fetch('https://live.env.vnas.vatsim.net/data-feed/controllers.json');
    const data = await response.text();
    res.set('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch controllers' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}/proxy/controllers`);
});
