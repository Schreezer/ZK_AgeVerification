# Zero-Knowledge Age Verification System

This project demonstrates a Zero-Knowledge (ZK) age verification system using zk-SNARKs (Groth16) and Circom. It allows users to prove they meet an age requirement to a service provider without revealing their actual age, enhancing privacy.

## Overview

The system consists of several components working together:

1.  **Government Backend (`government-backend/`):** Simulates a trusted authority that issues signed age credentials using Schnorr signatures.
2.  **Circuit Server (`circuit-server/`):** Contains the Circom circuits, manages key generation (`.zkey`, `.wasm`, verification key), and serves circuit files during development.
3.  **Proof Server (`proof-server/`):** A local server responsible for generating ZK proofs based on user credentials and the circuit definition.
4.  **Service Provider (`service-provider/`):** An example website that requires age verification and verifies the ZK proofs submitted by users.
5.  **Chrome Extension (`chrome-extension/`):** Simulates the user agent, managing credentials and orchestrating the proof generation and verification flow with the different servers.

## Getting Started

-   **Setup:** For detailed instructions on setting up the circuits, installing dependencies, and running all the servers and the extension, please refer to the [**SETUP_GUIDE.md**](./SETUP_GUIDE.md).
-   **Documentation:** 
    -   **Markdown:** For a comprehensive explanation of the project's architecture, methodology, literature review, and components in editable format, see [**ZK_Age_Verification_Documentation.md**](./ZK_Age_Verification_Documentation.md).
    -   **PDF:** For a finalized, publication-ready version of the documentation, see [**ZK Age Verification Project Documentation.pdf**](./ZK%20Age%20Verification%20Project%20Documentation.pdf).

## Technology Stack

-   **ZK:** Circom, snarkjs (Groth16)
-   **Cryptography:** Schnorr Signatures (using `circomlib`)
-   **Backend:** Node.js, Express.js
-   **Frontend:** Chrome Extension APIs, JavaScript
