/**
 * Manual Setup Script for Simple Age Verification Circuit
 * 
 * This script manually sets up the simple age verification circuit
 * to avoid issues with the snarkjs CLI.
 */

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const PTAU_FILE = path.join(__dirname, 'ptau', 'pot14_final.ptau');
const R1CS_FILE = path.join(__dirname, 'simple_age_verification.r1cs');
const ZKEY_FILE = path.join(__dirname, 'simple_age_verification.zkey');
const VERIFICATION_KEY_FILE = path.join(__dirname, 'simple_age_verification_verification_key.json');

// Main function
async function setupCircuit() {
  console.log('=== Setting up Simple Age Verification Circuit ===\n');
  
  // Step 1: Check if the circuit is compiled
  if (!fs.existsSync(R1CS_FILE)) {
    console.log('R1CS file not found. Compiling circuit...');
    try {
      execSync('circom simple_age_verification.circom --r1cs --wasm --sym', { stdio: 'inherit' });
      console.log('Circuit compiled successfully.\n');
    } catch (error) {
      console.error('Error compiling circuit:', error);
      return;
    }
  } else {
    console.log('R1CS file found. Skipping compilation.\n');
  }
  
  // Step 2: Check if the Powers of Tau file exists
  if (!fs.existsSync(PTAU_FILE)) {
    console.error(`Powers of Tau file not found at ${PTAU_FILE}`);
    return;
  }
  
  // Step 3: Generate the zkey file
  console.log('Generating zkey file...');
  try {
    await snarkjs.zKey.newZKey(R1CS_FILE, PTAU_FILE, ZKEY_FILE);
    console.log('Zkey file generated successfully.\n');
  } catch (error) {
    console.error('Error generating zkey file:', error);
    return;
  }
  
  // Step 4: Export the verification key
  console.log('Exporting verification key...');
  try {
    const vKey = await snarkjs.zKey.exportVerificationKey(ZKEY_FILE);
    fs.writeFileSync(VERIFICATION_KEY_FILE, JSON.stringify(vKey, null, 2));
    console.log('Verification key exported successfully.\n');
  } catch (error) {
    console.error('Error exporting verification key:', error);
    return;
  }
  
  console.log('=== Circuit setup completed successfully ===');
}

// Run the setup
setupCircuit().catch(console.error);
