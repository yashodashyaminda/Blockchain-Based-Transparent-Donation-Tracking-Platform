# 💻 Frontend Workspace Map (`content.md`)

This folder manages the React interactive user interface, role-based dashboard screens, and the client-side wallet bindings.

---

## 📂 Key Files & Functions

### 1. Global Web3 Context & Ethers Wrapper (`/src/context`)
* **`Web3Context.tsx`**:
  - Handles MetaMask / Web3 browser wallet logins, role switches, and smart contract connections.
  - **`connectWallet()`**: Checks for `window.ethereum`, requests accounts access, and assigns the user's active address to `walletAddress` state.
  - **`bindWalletToProfile(address)`**: Links the user's logged-in wallet address to their Web2 DB account.
  - **`donateToCampaign(campaignId, amount)`**:
    - **Integration Action**: Calls the smart contract directly using the user's MetaMask signer.
    - Converts the MongoDB string ID to a hex string:
      `const campaignIdHex = "0x" + campaignId;`
    - Connects to the smart contract at `CONTRACT_ADDRESS` using `DonationTracker.sol` ABI.
    - Sends the transaction:
      `await contract.donate(campaignIdHex, { value: ethers.parseEther(amount.toString()) });`
    - Waits for the transaction to be mined. Once mined, the backend WebSocket listener detects the event and updates the database raised amounts.
  - **`validateMilestoneProof(campaignId, milestoneId)`**:
    - **Integration Action**: Called by the Admin to release funds.
    - Calls contract: `contract.releaseFunds(campaignIdHex, ngoWalletAddress, milestoneAmount)`.
    - Once successful, the backend listener detects `FundsReleased` and updates the DB Campaign status.

### 2. Global Views & Pages (`/src/pages`)
* **`Home.tsx`**: Renders Hero, Goal, and active campaigns slider. Directs users to auth modals/pages if donating as guest.
* **`Login.tsx` & `Register.tsx`**: Manage compact Web2 credential registers, email/password validation, and role switchers (NGO or Donor).
* **`/ngo/NgoDashboard.tsx`**: NGO campaign manager workspace showing active metrics, milestone creation panels, and expenditure proof uploads.
* **`/donor/DonorDashboard.tsx`**: Donor tracking panel showing history log of donations and real-time campaign milestones.
* **`/admin/AdminDashboard.tsx`**: Admin panel for verifying NGO profiles, reviewing compliance documents, and approving/releasing contract funds.

---

## 🔗 Integration & Connection Guidelines

1. **How it Connects to Blockchain (Write Operations)**:
   - When users perform **write** transactions (e.g. donating ETH or releasing funds), the frontend interacts directly with the smart contract using `window.ethereum` and `ethers.Contract` with the signer.
   - This prevents intermediate servers from possessing private keys, ensuring security and decentralization.
2. **How it Connects to Backend (Read Operations)**:
   - All page displays (fetching the list of campaigns, user profile validations, role dashboard statistics) are read directly from the backend database APIs.
   - Once a contract transaction is successfully completed, the backend events system handles database synchronization, and the frontend re-queries the backend API to show updated balances immediately.
3. **Hex ID Formatting**:
   - Ensure to append the `"0x"` prefix to the Mongoose campaign ID (`campaign.id`) before sending it to Solidity's `donate(uint256)` function parameter.
     - *Example*: `0x${campaign.id}`
