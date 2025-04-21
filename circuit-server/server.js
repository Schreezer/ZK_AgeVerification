/**
 * Circuit File Server
 * 
 * This server provides static access to the circuit files needed by the extension simulator.
 * In a real implementation, these files would be bundled with the browser extension.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the mock-implementation directory
app.use(express.static(path.join(__dirname, '..', 'mock-implementation')));

// Start server
app.listen(PORT, () => {
  console.log(`Circuit file server running on http://localhost:${PORT}`);
});
