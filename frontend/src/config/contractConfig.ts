export const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const CONTRACT_ABI = [
  "function donate(uint256 campaignId) public payable",
  "function releaseFunds(uint256 campaignId, address payable ngoAddress, uint256 amount) public",
  "function campaignBalances(uint256 campaignId) public view returns (uint256)",
  "event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)",
  "event FundsReleased(uint256 indexed campaignId, address indexed ngoAddress, uint256 totalAmount, uint256 feePaid, uint256 netAmount)"
];
