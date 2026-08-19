// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./DonationTracker.sol";

/**
 * @title DonationTrackerV2
 * @dev Mock implementation contract used strictly to test the upgradeability of the UUPS proxy system.
 */
contract DonationTrackerV2 is DonationTracker {
    // New function added in V2 to verify successful upgrades
    function getVersion() external pure returns (string memory) {
        return "V2";
    }
}
