require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config(); // මේක අනිවාර්යයි! මේකෙන් තමයි .env ෆයිල් එක කියවන්නේ

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 1. Local Network (Testing සඳහා)
    hardhat: {
      chainId: 1337, 
    },
    localhost: {
      url: "http://127.0.0.1:8545", // මේක ඔයාගේ ලැප්ටොප් එකේ ඇතුළේ දුවන Local URL එක නිසා කෝඩ් එකේ තිබ්බට කිසිම අවුලක් නෑ
      chainId: 1337,
    },
    // 2. Testnet Deployment (Public)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", // URL එක එන්නේ කෙලින්ම .env එකෙන් 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Private Key එක එන්නේ කෙලින්ම .env එකෙන්
    },
  },
};