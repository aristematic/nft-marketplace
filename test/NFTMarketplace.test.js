const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  let nft, marketplace;
  let owner, seller, buyer, feeRecipient;

  const PLATFORM_FEE = 250; // 2.5%
  const ROYALTY_BPS = 500;  // 5%
  const NFT_PRICE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy NFT
    const NFT = await ethers.getContractFactory("MarketplaceNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await Marketplace.deploy(PLATFORM_FEE, feeRecipient.address);
    await marketplace.waitForDeployment();

    // Mint token 0 to seller with 5% royalty
    await nft.mint(seller.address, "ipfs://token1", ROYALTY_BPS);

    // Seller approves marketplace
    await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
  });

  // ─── Listing ───────────────────────────────────────────────────────────────

  describe("Listing", function () {
    it("should create a listing", async function () {
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE);
      const listing = await marketplace.getListing(0);

      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(NFT_PRICE);
      expect(listing.active).to.equal(true);
    });

    it("should emit Listed event", async function () {
      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE)
      ).to.emit(marketplace, "Listed")
        .withArgs(0, seller.address, await nft.getAddress(), 0, NFT_PRICE);
    });

    it("should revert if price is zero", async function () {
      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, 0)
      ).to.be.revertedWithCustomError(marketplace, "PriceMustBeAboveZero");
    });

    it("should revert if caller is not token owner", async function () {
      await expect(
        marketplace.connect(buyer).listNFT(await nft.getAddress(), 0, NFT_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "NotTokenOwner");
    });

    it("should revert if marketplace not approved", async function () {
      // Remove approval
      await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), false);

      await expect(
        marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE)
      ).to.be.revertedWithCustomError(marketplace, "MarketplaceNotApproved");
    });
  });

  // ─── Buying ────────────────────────────────────────────────────────────────

  describe("Buying", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE);
    });

    it("should transfer NFT to buyer", async function () {
      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });
      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("should mark listing as inactive after sale", async function () {
      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });
      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(false);
    });

    it("should pay seller correct amount after fees", async function () {
      const sellerBefore = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });

      const sellerAfter = await ethers.provider.getBalance(seller.address); 

      // seller is also royalty receiver since they minted the token
      // platformFee = 2.5% = 0.025 ETH
      // royalty     = 5%   = 0.05 ETH  → goes back to seller
      // seller gets = 0.925 + 0.05 = 0.975 ETH
      const expected = ethers.parseEther("0.975");
      expect(sellerAfter - sellerBefore).to.equal(expected);
    });

    it("should pay platform fee correctly", async function () {
      const feeBefore = await ethers.provider.getBalance(feeRecipient.address);

      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });

      const feeAfter = await ethers.provider.getBalance(feeRecipient.address);
      // 2.5% of 1 ETH = 0.025 ETH
      expect(feeAfter - feeBefore).to.equal(ethers.parseEther("0.025"));
    });

    it("should pay royalty to original creator", async function () {
      // seller minted token so seller is royalty receiver
      // use a different buyer to isolate royalty payment
      const royaltyBefore = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });

      const royaltyAfter = await ethers.provider.getBalance(seller.address);

      // seller receives: sellerProceeds (0.925) + royalty (0.05) = 0.975 ETH
      // because seller is also the royalty receiver here
      expect(royaltyAfter - royaltyBefore).to.equal(ethers.parseEther("0.975"));
    });

    it("should refund overpayment to buyer", async function () {
      const overpay = ethers.parseEther("2"); // sends 2 ETH for 1 ETH item
      const buyerBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyNFT(0, { value: overpay });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const buyerAfter = await ethers.provider.getBalance(buyer.address);

      // buyer should only lose 1 ETH + gas
      const spent = buyerBefore - buyerAfter;
      expect(spent).to.equal(NFT_PRICE + gasCost);
    });

    it("should revert if payment is insufficient", async function () {
      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientPayment");
    });

    it("should revert if seller tries to buy own listing", async function () {
      await expect(
        marketplace.connect(seller).buyNFT(0, { value: NFT_PRICE })
      ).to.be.revertedWithCustomError(marketplace, "CannotBuyOwnListing");
    });

    it("should revert if listing is not active", async function () {
      await marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE });
      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE })
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should emit Sale event", async function () {
      await expect(
        marketplace.connect(buyer).buyNFT(0, { value: NFT_PRICE })
      ).to.emit(marketplace, "Sale")
        .withArgs(
          0,
          buyer.address,
          seller.address,
          NFT_PRICE,
          ethers.parseEther("0.025"),
          ethers.parseEther("0.05")
        );
    });
  });

  // ─── Cancel ────────────────────────────────────────────────────────────────

  describe("Cancel Listing", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE);
    });

    it("should cancel listing and mark inactive", async function () {
      await marketplace.connect(seller).cancelListing(0);
      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(false);
    });

    it("should emit ListingCancelled event", async function () {
      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0, seller.address);
    });

    it("should revert if non-seller tries to cancel", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWithCustomError(marketplace, "NotSeller");
    });

    it("should allow re-listing after cancel", async function () {
      await marketplace.connect(seller).cancelListing(0);
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE);
      const listing = await marketplace.getListing(1);
      expect(listing.active).to.equal(true);
    });
  });

  // ─── Update Price ──────────────────────────────────────────────────────────

  describe("Update Price", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listNFT(await nft.getAddress(), 0, NFT_PRICE);
    });

    it("should update listing price", async function () {
      const newPrice = ethers.parseEther("2");
      await marketplace.connect(seller).updatePrice(0, newPrice);
      const listing = await marketplace.getListing(0);
      expect(listing.price).to.equal(newPrice);
    });

    it("should emit PriceUpdated event", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(marketplace.connect(seller).updatePrice(0, newPrice))
        .to.emit(marketplace, "PriceUpdated")
        .withArgs(0, NFT_PRICE, newPrice);
    });

    it("should revert if non-seller updates price", async function () {
      await expect(
        marketplace.connect(buyer).updatePrice(0, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(marketplace, "NotSeller");
    });
  });

  // ─── Admin ─────────────────────────────────────────────────────────────────

  describe("Admin", function () {
    it("should update platform fee", async function () {
      await marketplace.connect(owner).updatePlatformFee(300);
      expect(await marketplace.platformFeeBasisPoints()).to.equal(300);
    });

    it("should revert if non-owner updates platform fee", async function () {
      await expect(
        marketplace.connect(seller).updatePlatformFee(300)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("should update fee recipient", async function () {
      await marketplace.connect(owner).updateFeeRecipient(buyer.address);
      expect(await marketplace.feeRecipient()).to.equal(buyer.address);
    });
  });
});