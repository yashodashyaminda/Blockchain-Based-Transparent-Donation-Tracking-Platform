require("dotenv").config(); // .env ෆයිල් එක ලෝඩ් කරගන්නවා
const { ethers, upgrades } = require("hardhat");

async function main() {
  // blockchain ෆෝල්ඩර් එකේ .env එකේ තියෙන CONTRACT_ADDRESS එක මෙතනින් ගන්නවා
  const proxyAddress = process.env.CONTRACT_ADDRESS;

  // Address එක .env එකේ නැත්නම් Error එකක් පෙන්නනවා (ආරක්ෂාවට)
  if (!proxyAddress) {
    throw new Error("❌ CONTRACT_ADDRESS is not defined in the .env file!");
  }

  console.log("🚀 Upgrading DonationTracker at proxy:", proxyAddress);

  const DonationTracker = await ethers.getContractFactory("DonationTracker");

  // Upgrades the proxy to point to a new implementation logic
  const upgraded = await upgrades.upgradeProxy(proxyAddress, DonationTracker);

  // Await the deployment of the new implementation
  await upgraded.waitForDeployment();

  console.log("✅ DonationTracker successfully upgraded!");

  // Verify if totalReleased is accessible
  const totalReleased = await upgraded.totalReleased();
  console.log("💰 Current totalReleased in state:", ethers.formatEther(totalReleased), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });