// const { ethers } = require("hardhat");

// async function main() {
//     // 1. ඔයාගේ Proxy Contract Address එක (.env එකේ තියෙන එකමයි)
//     const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

//     // 2. MongoDB එකේ තියෙන Active Campaign එකක ID එක මෙතනට දෙන්න (ඉස්සරහින් "0x" අනිවාර්යයි)
//     // උදාහරණයක්: MongoDB එකේ ID එක 6a841521b40224c11ecfa908 නම්, මෙතනට දෙන්න 0x6a841521b40224c11ecfa908
//     const campaignIdHex = "0x6a85bb24fc2bc6ed3f8a3d9a";

//     // 3. 👉 ඔයාට යවන්න ඕන Donation Amount එක (ETH වලින් මෙතන දෙන්න) 👈
//     const donationAmountInEth = "5"; // <--- මම 2.5 ETH දුන්නා, ඔයාට කැමති ගාණක් දෙන්න!

//     const DonationTracker = await ethers.getContractFactory("DonationTracker");
//     const contract = DonationTracker.attach(contractAddress);

//     console.log(`⏳ Sending ${donationAmountInEth} ETH donation to campaign...`);

//     // Hardhat node එකේ තියෙන පලවෙනි account එකෙන් සල්ලි යවනවා
//     const tx = await contract.donate(campaignIdHex, {
//         value: ethers.parseEther(donationAmountInEth)
//     });

//     await tx.wait(); // Confirm වෙනකන් ඉන්නවා

//     console.log(`✅ ${donationAmountInEth} ETH Donation sent successfully to the Blockchain!`);
//     console.log("👀 Now check your Node.js Backend Terminal to see if it caught the event.");
// }

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });