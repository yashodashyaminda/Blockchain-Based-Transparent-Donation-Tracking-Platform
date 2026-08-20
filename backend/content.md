# ⚙️ Backend Workspace Map (`content.md`)

This folder manages the Express MVC architecture, Web2 credential checks, Mongoose database schemas, and the WebSocket Web3 event listeners.

---

## 📂 Key Files & Functions

### 1. Web3 Event Listener (`/services`)
* **`web3Service.js`**:
  - Connects to Hardhat Local Node/Sepolia using `ethers.WebSocketProvider(WS_URL)`.
  - Instantiates the Contract connection using the deployed contract address and the event ABI definitions.
  - **`Donated` Event Listener**:
    - Listens to Solidity `Donated` events.
    - Decodes `uint256 campaignIdBigInt` and converts it to a 24-character hexadecimal Mongoose ID string:
      `const campaignIdStr = campaignIdBigInt.toString(16).padStart(24, '0');`
    - Updates Campaign database metrics: increments `raisedAmount` and switches status to `'Funded'` if the target is met.
    - Creates a new `Donation` document with the unique on-chain `transactionHash` signature.
  - **`FundsReleased` Event Listener**:
    - Listens to Solidity `FundsReleased` events.
    - Decodes and converts `campaignIdBigInt` to Mongo string.
    - Sets the Campaign database status to `'Completed'`.

### 2. Mongoose Schemas & Models (`/models`)
* **`User.js`**: Stores email, password hash, role (`Donor`, `NGO`, `Admin`), bound `walletAddress`, and verification parameters.
* **`Campaign.js`**: Stores title, description, cover IPFS hash, funding target, actual raised amount, and current status (`Pending`, `Active`, `Funded`, `Completed`).
* **`Donation.js`**: Tracks transactions on the database, linking `donorId`, `campaignId`, `amount`, and unique `transactionHash`.
* **`Proof.js`**: Stores NGO milestone expenditure files with `ipfsCID` document tags and Admin approval flags.

### 3. Auth & Role Verification Middleware (`/middleware`)
* **`authMiddleware.js`**:
  - **`verifyToken`**: Validates JWTs, extracts decodable `id` parameters, queries database user profile, and assigns the user payload to `req.user`.
  - **`checkRole(roles[])`**: Restricts route execution (e.g. NGO upload, Admin validations) based on authenticated role permissions.

---

## 🔗 Integration & Connection Guidelines

1. **How it Connects to Blockchain**:
   - The backend runs `web3Service.js` continuously via WebSocket connection (`ws://127.0.0.1:8545`).
   - Rather than executing blockchain transactions itself, the backend simply **listens** for validated transactions on-chain. When a transaction occurs (e.g., a donor sends ETH using their wallet on the frontend), the event is caught here and synced to the database.
2. **How it Connects to Frontend**:
   - The frontend calls backend HTTP REST APIs (`POST /api/auth/login`, `GET /api/campaigns`, etc.) using JWT headers.
   - When registering a wallet address on the frontend, the address is sent to `/api/users/bind` (or similar profile routes) and saved in the DB.
3. **Environment Setup**:
   - Ensure `WS_URL` is set to your websocket provider (e.g. `ws://127.0.0.1:8545/`).
   - Ensure `CONTRACT_ADDRESS` matches the Proxy Address deployed by the Hardhat script.
