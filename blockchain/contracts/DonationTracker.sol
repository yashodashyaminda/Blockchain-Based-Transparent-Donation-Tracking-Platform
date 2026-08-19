// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DonationTracker
 * @dev UUPS Proxy Upgradable contract for managing campaign donations,
 * locking funds, and distributing them to NGOs with a 5% platform fee.
 */
contract DonationTracker is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Mapping of campaignId to its locked contract balance
    mapping(uint256 => uint256) public campaignBalances;

    // Events
    event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount);
    event FundsReleased(
        uint256 indexed campaignId,
        address indexed ngoAddress,
        uint256 totalAmount,
        uint256 feePaid,
        uint256 netAmount
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Prevent initialization of the implementation contract directly
        _disableInitializers();
    }

    /**
     * @dev Initialize function acting as proxy constructor.
     * Sets the initial owner/admin of the contract.
     */
    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Allows donors to send ETH associated with a specific campaignId.
     * @param campaignId Unique ID representing the destination campaign
     */
    function donate(uint256 campaignId) external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        
        // Lock funds inside the contract and update campaign balances mapping
        campaignBalances[campaignId] += msg.value;

        emit Donated(msg.sender, campaignId, msg.value);
    }

    /**
     * @dev Releases locked funds to an NGO wallet, deducting a 5% platform fee.
     * Access restricted to Owner (Admin) only.
     * @param campaignId Unique ID representing the source campaign
     * @param ngoAddress Recipient wallet address of the approved NGO
     * @param amount Total amount of locked funds to release
     */
    function releaseFunds(
        uint256 campaignId,
        address payable ngoAddress,
        uint256 amount
    ) external onlyOwner {
        require(ngoAddress != address(0), "Invalid NGO recipient address");
        require(campaignBalances[campaignId] >= amount, "Insufficient campaign balance");

        // 1. Calculate 5% platform fee and 95% net amount for NGO
        uint256 fee = (amount * 5) / 100;
        uint256 netAmount = amount - fee;

        // 2. Adjust mapping balance before transferring to prevent reentrancy issues
        campaignBalances[campaignId] -= amount;

        // 3. Dispatch 5% fee to the admin/owner wallet
        (bool feeSuccess, ) = payable(owner()).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // 4. Dispatch 95% net funds to the NGO wallet
        (bool ngoSuccess, ) = ngoAddress.call{value: netAmount}("");
        require(ngoSuccess, "NGO transfer failed");

        emit FundsReleased(campaignId, ngoAddress, amount, fee, netAmount);
    }

    /**
     * @dev Authorize contract upgrades. Required by UUPSUpgradeable pattern.
     * Access restricted strictly to Owner (Admin) only.
     * @param newImplementation Address of the newly deployed implementation contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Fallback function to accept raw ether transfers
     */
    receive() external payable {}
}
