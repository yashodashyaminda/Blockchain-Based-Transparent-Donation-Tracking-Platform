# ⛓️ Blockchain Workspace Map (`content.md`)

This folder manages the upgradeable smart contracts, compile tooling, deployment scripts, and contract test suites.

---

## 📂 Key Files & Functions

### 1. Smart Contracts (`/contracts`)
* **`DonationTracker.sol`**:
  - **Type**: UUPS Proxy Upgradeable contract (`UUPSUpgradeable`, `Initializable`, `OwnableUpgradeable`).
  - **`initialize()`**: Acts as proxy constructor, setting initial owner/admin of the contract.
  - **`donate(uint256 campaignId) external payable`**:
    - Receives ETH and locks it.
    - Maps campaign balance in `campaignBalances[campaignId]`.
    - Emits `Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)`.
  - **`releaseFunds(uint256 campaignId, address payable ngoAddress, uint256 amount) external onlyOwner`**:
    - Restricts payouts. Only the Admin (Owner) can invoke it.
    - Calculates 5% platform fee and 95% net payout.
    - Automatically transfers 5% fee to Owner (Admin) wallet to cover future gas fees.
    - Transfers 95% to NGO address.
    - Emits `FundsReleased(campaignId, ngoAddress, totalAmount, feePaid, netAmount)`.
  - **`_authorizeUpgrade(address newImplementation) internal override onlyOwner`**:
    - Restricts contract upgrade permissions strictly to the owner.
* **`DonationTrackerV2.sol`**:
  - Inheritance contract extending `DonationTracker` with mock getter `getVersion()` returning `"V2"`, used to test UUPS proxy upgrades validity.

### 2. Scripts (`/scripts`)
* **`deploy.js`**: Deploy proxy using OpenZeppelin `upgrades.deployProxy` to wrap implementation logic inside upgradeable ERC-1967 pointers.
* **`testDonation.js`**: Helper script to programmatically call the `donate` function using Hardhat local networks. Showcases how to format MongoDB `campaignId` into hex string formats.

### 3. Test Suites (`/test`)
* **`DonationTracker.test.js`**: Complete Chai unit tests validating initializer restrictions, fund locking balances, 5% admin fee cuts, NGO balance receipts, and owner-only upgrade validation checks.

---

## 🔗 Integration & Connection Guidelines

1. **Mapping IDs**:
   - Solidity stores Campaign IDs as `uint256`. 
   - Convert MongoDB's 24-character hexadecimal `_id` into a hex bytes string with `"0x"` prefix before passing to Solidity `uint256`.
     - *Example*: MongoDB ID `6a85bb24fc2bc6ed3f8a3d9a` matches Solidity `0x6a85bb24fc2bc6ed3f8a3d9a` (decimal: `82483167115801968875503378586`).
2. **Web3 Events Mapping**:
   - The contract emits events (`Donated`, `FundsReleased`) which the backend [`web3Service.js`](../backend/services/web3Service.js) monitors via WebSockets to synchronize DB state.
3. **Environment Setup**:
   - After deploying `scripts/deploy.js`, update the backend and frontend `.env` config files with the printed `Proxy Address` as `CONTRACT_ADDRESS`.
