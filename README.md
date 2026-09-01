# 🌍 Blockchain-Based Transparent Donation Tracking Platform

![React](https://img.shields.io/badge/Frontend-React.js-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![Solidity](https://img.shields.io/badge/Blockchain-Solidity-lightgrey)
![Status](https://img.shields.io/badge/Status-Completed-success)

## 📌 Project Overview
The **Blockchain-Based Transparent Donation Tracking Platform** is a decentralized application (dApp) designed to eliminate corruption, enhance administrative transparency, and ensure the precise allocation of charitable funds. By utilizing smart contracts, the system locks capital in decentralized vaults and releases it in fractionated milestones strictly upon administrator and cryptographic verification. 

*Developed as a Final Year Undergraduate Project (KIU).*

---

## 🚀 Core Features
*   **Tripartite Auditing Vault:** Connects Donors, NGOs, and Administrators in a secure on-chain and off-chain verification cycle.
*   **Smart Contract Locking:** Donations are secured within an Upgradable UUPS milestone-escrow contract. 
*   **Zero-Corruption Architecture:** Funds are released incrementally (milestone payouts) to NGOs. A 5% platform maintenance fee is autonomously calculated and deducted per transaction.
*   **Real-time Ledger Sync:** Monitors real-time contract states, matching off-chain MongoDB records with on-chain Ethereum IPFS block data.
*   **Secure Authentication:** JWT-based role access control (Admin, NGO, Donor) with password hashing.
*   **Automated Audit Dispatches:** Integrated EmailJS service for seamless communication between users and the administrative auditing panel.

---

## 🛠️ Technology Stack
### Frontend
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Web3 Integration:** Ethers.js
*   **External Services:** EmailJS

### Backend
*   **Environment:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **Security:** JSON Web Tokens (JWT), Bcrypt

### Blockchain
*   **Language:** Solidity (v0.8.20)
*   **Framework:** Hardhat
*   **Standards:** UUPS Proxy Pattern, CEI (Checks-Effects-Interactions) Pattern

---

## ⚙️ Local Setup & Installation

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB installed locally or MongoDB Atlas URI
*   MetaMask browser extension
