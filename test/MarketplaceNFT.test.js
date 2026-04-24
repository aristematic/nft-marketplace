const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MarketplaceNFT", function () {
  let nft;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MarketplaceNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();
  });

  // ─── Minting ───────────────────────────────────────────────────────────────

  describe("Minting", function () {
    it("should mint an NFT and assign correct owner", async function () {
      await nft.mint(user1.address, "ipfs://token1", 500);
      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });

    it("should set tokenURI correctly", async function () {
      await nft.mint(user1.address, "ipfs://token1", 500);
      expect(await nft.tokenURI(0)).to.equal("ipfs://token1");
    });

    it("should increment tokenId on each mint", async function () {
      await nft.mint(user1.address, "ipfs://token1", 500);
      await nft.mint(user1.address, "ipfs://token2", 500);
      expect(await nft.totalMinted()).to.equal(2);
    });

    it("should revert when minting to zero address", async function () {
      await expect(
        nft.mint(ethers.ZeroAddress, "ipfs://token1", 500)
      ).to.be.revertedWithCustomError(nft, "ZeroAddress");
    });

    it("should revert when royalty basis points exceed 10000", async function () {
      await expect(
        nft.mint(user1.address, "ipfs://token1", 10001)
      ).to.be.revertedWithCustomError(nft, "InvalidRoyaltyBasisPoints");
    });

    it("should allow anyone to mint", async function () {
      await nft.connect(user1).mint(user1.address, "ipfs://token1", 500);
      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });
  });

  // ─── Royalties ─────────────────────────────────────────────────────────────

  describe("Royalties (ERC-2981)", function () {
    beforeEach(async function () {
      // mint token 0 with 5% royalty (500 basis points)
      await nft.mint(user1.address, "ipfs://token1", 500);
    });

    it("should return correct royalty amount for a sale price", async function () {
      const [receiver, amount] = await nft.royaltyInfo(0, ethers.parseEther("1"));
      expect(receiver).to.equal(user1.address);
      // 5% of 1 ETH = 0.05 ETH
      expect(amount).to.equal(ethers.parseEther("0.05"));
    });

    it("should return correct royalty for 10% basis points", async function () {
      await nft.mint(user2.address, "ipfs://token2", 1000);
      const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("2"));
      expect(receiver).to.equal(user2.address);
      // 10% of 2 ETH = 0.2 ETH
      expect(amount).to.equal(ethers.parseEther("0.2"));
    });

    it("should return zero royalty for 0 basis points", async function () {
      await nft.mint(user2.address, "ipfs://token2", 0);
      const [, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
      expect(amount).to.equal(0);
    });

    it("should return correct royalty info via getRoyaltyInfo", async function () {
      const [receiver, basisPoints] = await nft.getRoyaltyInfo(0);
      expect(receiver).to.equal(user1.address);
      expect(basisPoints).to.equal(500);
    });
  });

  // ─── supportsInterface ─────────────────────────────────────────────────────

  describe("supportsInterface", function () {
    it("should support ERC-721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true);
    });

    it("should support ERC-2981 interface", async function () {
      expect(await nft.supportsInterface("0x2a55205a")).to.equal(true);
    });

    it("should not support random interface", async function () {
      expect(await nft.supportsInterface("0xdeadbeef")).to.equal(false);
    });
  });
});