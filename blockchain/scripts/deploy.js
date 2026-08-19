const { ethers, upgrades } = require("hardhat");

/**
 * Script to deploy the UUPS upgradeable DonationTracker contract.
 */
async function main() {
  console.log("Starting deployment of upgradeable DonationTracker contract...");

  // 1. Get the Contract Factory representing implementation code
  const DonationTracker = await ethers.getContractFactory("DonationTracker");

  // 2. Deploy using OpenZeppelin Upgrades deployProxy helper
  // Specifies kind: 'uups' to ensure correct proxy configuration
  const proxy = await upgrades.deployProxy(DonationTracker, [], {
    initializer: "initialize",
    kind: "uups",
  });

  // 3. Wait for the transaction to be mined
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  console.log(`DonationTracker Proxy deployed to: ${proxyAddress}`);

  // 4. Retrieve and log the implementation contract address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`DonationTracker Implementation deployed to: ${implementationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment script failed:", error);
    process.exit(1);
  });
