/**
 * Start All Servers
 * 
 * This script starts all the servers needed for the ZK age verification demo.
 */

const { spawn } = require('child_process');
const path = require('path');

// Function to start a server
function startServer(name, directory, command) {
  console.log(`Starting ${name} server...`);
  
  const serverProcess = spawn('npm', ['run', command], {
    cwd: path.join(__dirname, directory),
    stdio: 'pipe',
    shell: true
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`${name} server exited with code ${code}`);
  });
  
  return serverProcess;
}

// Start all servers
const serviceProvider = startServer('Service Provider', 'service-provider', 'start');
const government = startServer('Government', 'government-backend', 'start');
const circuitServer = startServer('Circuit Server', 'circuit-server', 'start');
const proofServer = startServer('Proof Server', 'proof-server', 'start');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all servers...');
  serviceProvider.kill();
  government.kill();
  circuitServer.kill();
  proofServer.kill();
  process.exit(0);
});

console.log('\nAll servers started. Press Ctrl+C to stop all servers.\n');
console.log('Server URLs:');
console.log('- Government Backend: http://localhost:3001');
console.log('- Service Provider: http://localhost:3000');
console.log('- Circuit Server: http://localhost:3002');
console.log('- Proof Server: http://localhost:3003');
