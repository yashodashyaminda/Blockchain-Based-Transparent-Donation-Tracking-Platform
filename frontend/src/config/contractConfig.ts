export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
  "function donate(uint256 campaignId) public payable",
  "function releaseFunds(uint256 campaignId, address payable ngoAddress, uint256 amount) public",
  "function releaseMilestonePayout(uint256 campaignId, uint256 phaseIndex, address payable ngoWallet, uint256 amount) external",
  "function campaignBalances(uint256 campaignId) public view returns (uint256)",
  "event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)",
  "event FundsReleased(uint256 indexed campaignId, address indexed ngoAddress, uint256 totalAmount, uint256 feePaid, uint256 netAmount)",
  "event MilestonePayoutReleased(uint256 indexed campaignId, uint256 indexed phaseIndex, address indexed ngoWallet, uint256 amount, uint256 feeDeducted)"
];
