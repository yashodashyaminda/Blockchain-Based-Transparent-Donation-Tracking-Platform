export const CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export const CONTRACT_ABI = [
  "function donate(uint256 campaignId) external payable",
  "function releaseFunds(uint256 campaignId, address payable ngoAddress, uint256 amount) external",
  "function campaignBalances(uint256 campaignId) external view returns (uint256)",
  "event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)",
  "event FundsReleased(uint256 indexed campaignId, address indexed ngoAddress, uint256 totalAmount, uint256 feePaid, uint256 netAmount)"
];
