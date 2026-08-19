# Blockchain-Based Transparent Donation Tracking Platform - Backend

This repository contains the off-chain backend architecture designed using **Node.js, Express, and Mongoose (MongoDB)** to support transparent auditability, role-based workflows, and database tracking.

---

## 🚀 Key Backend Achievements & Implementations

### 1. Core Server & Architecture
* **Node.js & Express Initialization**: Built the main application entry point ([`server.js`](./backend/server.js)) handling JSON requests, CORS headers, and global catch-all error handling routing.
* **Database Connection**: Set up asynchronous MongoDB connections using Mongoose ([`db.js`](./backend/config/db.js)) with runtime environment variable management.
* **Environment Variables Setup**: Created config files ([`.env`](./backend/.env) and [`.env.example`](./backend/.env.example)) defining system parameters, JWT secrets, and PORT keys.

### 2. Mongoose Schemas & Database Models
* **User Model ([`User.js`](./backend/models/User.js))**:
  - Contains fields: `name`, unique `email`, hashed `password`, enum `role` (`Donor`, `NGO`, `Admin`), optional `walletAddress`, and `isVerified`.
  - Implements pre-save hooks to automatically hash Web2 passwords using `bcryptjs`.
  - Exposes instance methods to compare input credentials against database hashes.
* **Campaign Model ([`Campaign.js`](./backend/models/Campaign.js))**:
  - Features fields: `title`, `description`, `ngoId` reference, `targetAmount`, `raisedAmount` (default `0`), `status` (Enum: `Pending`, `Active`, `Funded`, `Completed`), and `coverImageIPFSHash`.
* **Donation Model ([`Donation.js`](./backend/models/Donation.js))**:
  - Contains fields: `campaignId` reference, `donorId` reference, `amount` (USD), unique blockchain `transactionHash`, and `date`.
* **Proof Model ([`Proof.js`](./backend/models/Proof.js))**:
  - Features fields: `campaignId` reference, `ngoId` reference, `title`, IPFS `ipfsCID` document reference, and `isApproved` (default `false`).

### 3. JWT & Role-Based Access Control (RBAC) Middleware
* **Token Extraction & Decoding ([`authMiddleware.js`](./backend/middleware/authMiddleware.js))**:
  - **`verifyToken`**: Automatically detects access tokens from `Authorization` headers using the `Bearer <token>` format, decodes payloads, fetches database profiles, and binds active user sessions to request scopes. Returns `401/403` status codes for missing, invalid, or expired tokens.
* **Role Check Gate ([`authMiddleware.js`](./backend/middleware/authMiddleware.js))**:
  - **`checkRole`**: Higher-order route guards restricting requests (e.g. NGO workspace vs Admin workspace) and returning `403 Forbidden` for non-authorized roles.

### 4. Controller Workflows & Business Validation Logic
* **Authentication Flow ([`authController.js`](./backend/controllers/authController.js))**:
  - Registers users, sets default pending verification statuses for NGOs, logs credentials, and signs 30-day JWT authorization tokens.
* **Campaign Registry & Approval Flow ([`campaignController.js`](./backend/controllers/campaignController.js))**:
  - Allows verified NGOs to publish campaigns in default `Pending` status.
  - Automatically verifies NGO creator ownership or Admin roles before permitting updates/deletions.
  - Exposes an Admin-only approval endpoint (`PUT /api/campaigns/:id/approve`) changing status to `Active`.
* **Donation Ledger Updates ([`donationController.js`](./backend/controllers/donationController.js))**:
  - Restricts donations to `Donor` roles. Prevents processing donations for closed/completed campaigns.
  - Automatically increases campaign `raisedAmount` and transitions statuses to `Funded` once target goals are reached.
* **Compliance Documents & Proof Verification ([`proofController.js`](./backend/controllers/proofController.js))**:
  - Restricts uploading proofs to the campaign-owning NGO.
  - **Status Validation**: Rejects uploading proofs if the associated parent Campaign is not in an `Active` status.
  - Restricts validation actions (`PUT /api/proofs/:id/approve`) to system `Admin` profiles.

---

## 🛠️ Route Mapping Summary

* **Authentication Endpoint (`/api/auth`)**:
  - `POST /register` -> Sign up new accounts.
  - `POST /login` -> Log in existing accounts.
  - `POST /forgotpassword` -> Reset password request handler (stub).
* **Campaign Endpoint (`/api/campaigns`)**:
  - `GET /` -> Retrieve all campaigns (Public).
  - `GET /:id` -> Fetch campaign details by database ID (Public).
  - `POST /` -> Publish new campaign (NGO only, defaults to `Pending`).
  - `PUT /:id` -> Update campaign description/targets (NGO owner or Admin).
  - `DELETE /:id` -> Remove campaign (NGO owner or Admin).
  - `PUT /:id/approve` -> Approve campaign to `Active` status (Admin only).
* **Donation Endpoint (`/api/donations`)**:
  - `POST /` -> Log donation transactions (Donor only, updates campaign raised amounts).
  - `GET /my-donations` -> Retrieve logged-in donor's historical logs (Donor only).
  - `GET /campaign/:campaignId` -> Retrieve list of donations made to a campaign (Public).
* **Proof Endpoint (`/api/proofs`)**:
  - `POST /` -> Upload milestone proof docs (NGO owner only, requires active campaign status).
  - `GET /campaign/:campaignId` -> Retrieve proof logs for a campaign (Public).
  - `PUT /:id/approve` -> Validate/approve NGO compliance proofs (Admin only).
