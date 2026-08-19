const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DonationTracker Upgradeable Contract Test Suite", function () {
  let DonationTracker;
  let DonationTrackerV2;
  let proxy;
  let owner;
  let donor;
  let ngo;
  let attacker;

  beforeEach(async function () {
    // 1. Retrieve account signers from hardhat local node environment
    [owner, donor, ngo, attacker] = await ethers.getSigners();

    // 2. Fetch contract factories
    DonationTracker = await ethers.getContractFactory("DonationTracker");
    DonationTrackerV2 = await ethers.getContractFactory("DonationTrackerV2");

    // 3. Deploy proxy for testing using UUPS pattern
    proxy = await upgrades.deployProxy(DonationTracker, [], {
      initializer: "initialize",
      kind: "uups",
    });
  });

  describe("Initialization Checks", function () {
    it("Should correctly set the deployer as the initial contract owner", async function () {
      expect(await proxy.owner()).to.equal(owner.address);
    });

    it("Should block subsequent initialize calls once deployed", async function () {
      // Trying to initialize again should revert with oz initializers error
      await expect(proxy.initialize()).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });
  });

  describe("Fund Locking & Donations", function () {
    const campaignId = 1;
    const donationAmount = ethers.parseEther("10.0"); // 10 ETH

    it("Should accept ETH donations and lock them within the contract", async function () {
      // Perform donation transfer
      const tx = await proxy.connect(donor).donate(campaignId, { value: donationAmount });
      
      // Verify Donated event emission
      await expect(tx)
        .to.emit(proxy, "Donated")
        .withArgs(donor.address, campaignId, donationAmount);

      // Verify the campaign balance mapping has locked the funds
      const campaignBalance = await proxy.campaignBalances(campaignId);
      expect(campaignBalance).to.equal(donationAmount);
    });

    it("Should reject donations with zero or negative value transfers", async function () {
      await expect(
        proxy.connect(donor).donate(campaignId, { value: 0 })
      ).to.be.revertedWith("Donation amount must be greater than zero");
    });
  });

  describe("Admin Fund Release & Platform Fee Logic", function () {
    const campaignId = 42;
    const donationAmount = ethers.parseEther("10.0"); // 10 ETH
    const releaseAmount = ethers.parseEther("6.0");   // 6 ETH

    beforeEach(async function () {
      // Seed the campaign balance before testing release operations
      await proxy.connect(donor).donate(campaignId, { value: donationAmount });
    });

    it("Should restrict fund release functions strictly to contract owner", async function () {
      await expect(
        proxy.connect(attacker).releaseFunds(campaignId, ngo.address, releaseAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject releases if destination address is zero", async function () {
      await expect(
        proxy.connect(owner).releaseFunds(campaignId, ethers.ZeroAddress, releaseAmount)
      ).to.be.revertedWith("Invalid NGO recipient address");
    });

    it("Should reject releases exceeding locked campaign balances", async function () {
      const excessiveAmount = ethers.parseEther("11.0"); // Exceeds 10 ETH seeded
      await expect(
        proxy.connect(owner).releaseFunds(campaignId, ngo.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient campaign balance");
    });

    it("Should deduct 5% platform fee, routing 95% to NGO and 5% to Admin wallet", async function () {
      // 1. Calculate expected outputs:
      // Total: 6.0 ETH -> 5% fee = 0.3 ETH -> 95% NGO = 5.7 ETH
      const expectedFee = ethers.parseEther("0.3");
      const expectedNgoAmount = ethers.parseEther("5.7");

      const initialContractBalance = await ethers.provider.getBalance(await proxy.getAddress());
      const initialNgoBalance = await ethers.provider.getBalance(ngo.address);
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      // 2. Perform admin release call
      const tx = await proxy.connect(owner).releaseFunds(campaignId, ngo.address, releaseAmount);
      const receipt = await tx.wait();
      
      // Calculate transaction gas fee spent by owner to submit the release call
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      // 3. Fetch balances after execution
      const finalContractBalance = await ethers.provider.getBalance(await proxy.getAddress());
      const finalNgoBalance = await ethers.provider.getBalance(ngo.address);
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      // 4. Assertions:
      // A. Contract overall balance drops by exactly the requested releaseAmount
      expect(initialContractBalance - finalContractBalance).to.equal(releaseAmount);

      // B. Contract internal mapping balance drops by exactly the releaseAmount
      const campaignBalance = await proxy.campaignBalances(campaignId);
      expect(campaignBalance).to.equal(donationAmount - releaseAmount);

      // C. NGO wallet received exactly 95% (without gas fees since NGO is recipient)
      expect(finalNgoBalance - initialNgoBalance).to.equal(expectedNgoAmount);

      // D. Owner received exactly 5% minus the gas fees spent to execute transaction
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + expectedFee - gasSpent);

      // E. Event FundsReleased is emitted with accurate values
      await expect(tx)
        .to.emit(proxy, "FundsReleased")
        .withArgs(campaignId, ngo.address, releaseAmount, expectedFee, expectedNgoAmount);
    });
  });

  describe("Contract Upgradeability Tests", function () {
    const campaignId = 99;
    const donationAmount = ethers.parseEther("5.0");

    beforeEach(async function () {
      // Seed state before upgrading
      await proxy.connect(donor).donate(campaignId, { value: donationAmount });
    });

    it("Should restrict upgrades strictly to contract owner", async function () {
      // Attacker trying to upgrade contract should fail
      await expect(
        upgrades.upgradeProxy(proxy, DonationTrackerV2.connect(attacker), { kind: "uups" })
      ).to.be.reverted;
    });

    it("Should successfully upgrade proxy, retain mapping states, and expose new V2 functions", async function () {
      const proxyAddress = await proxy.getAddress();

      // 1. Perform upgrade proxy call using owner signer
      const upgradedProxy = await upgrades.upgradeProxy(proxy, DonationTrackerV2, {
        kind: "uups",
      });

      // 2. Verify proxy address is identical (same pointer, new implementation)
      expect(await upgradedProxy.getAddress()).to.equal(proxyAddress);

      // 3. State Preservation: Verify previous campaign balances are retained intact
      const campaignBalance = await upgradedProxy.campaignBalances(campaignId);
      expect(campaignBalance).to.equal(donationAmount);

      // 4. Expose V2 APIs: Call getVersion() on upgraded contract
      const version = await upgradedProxy.getVersion();
      expect(version).to.equal("V2");
    });
  });
});
