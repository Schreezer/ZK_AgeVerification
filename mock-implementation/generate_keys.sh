#!/bin/bash
# Script to generate keys for the EdDSA-based age verification circuit

echo "=== Generating Keys for EdDSA-based Age Verification ==="

# Step 1: Use existing Powers of Tau file
echo -e "\n1. Using existing Powers of Tau file: pot14_final.ptau"
PTAU_FILE="pot14_final.ptau"

if [ ! -f "$PTAU_FILE" ]; then
    echo "Error: Powers of Tau file $PTAU_FILE not found"
    exit 1
fi

echo "Found Powers of Tau file: $PTAU_FILE"

# Step 2: Generate the zkey
echo -e "\n2. Generating zkey..."
snarkjs groth16 setup age_verification_js/age_verification.r1cs $PTAU_FILE age_verification_0000.zkey

# Step 3: Export the verification key
echo -e "\n3. Exporting verification key..."
snarkjs zkey export verificationkey age_verification_0000.zkey verification_key.json

echo -e "\n=== Key Generation Completed ==="
echo "You can now run the full verification flow using the run_eddsa_demo.js script"
