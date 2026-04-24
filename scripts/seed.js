const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [owner, seller1, seller2, seller3] = await ethers.getSigners();

  // ─── Load deployed addresses ───────────────────────────────────────────────

  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const nftAddress = deployment.contracts.MarketplaceNFT;
  const marketplaceAddress = deployment.contracts.NFTMarketplace;

  console.log("Seeding contracts...");
  console.log("NFT:", nftAddress);
  console.log("Marketplace:", marketplaceAddress);

  // ─── Attach to deployed contracts ─────────────────────────────────────────

  const nft = await ethers.getContractAt("MarketplaceNFT", nftAddress);
  const marketplace = await ethers.getContractAt("NFTMarketplace", marketplaceAddress);

  // ─── Sample NFT metadata (normally these would be IPFS URIs) ──────────────

  const nfts = [
    {
      owner: seller1,
      uri: "ipfs://QmXyz1/metadata.json",
      royalty: 500,  // 5%
      price: ethers.parseEther("0.5"),
      list: true,
    },
    {
      owner: seller1,
      uri: "ipfs://QmXyz2/metadata.json",
      royalty: 1000, // 10%
      price: ethers.parseEther("1.0"),
      list: true,
    },
    {
      owner: seller2,
      uri: "ipfs://QmXyz3/metadata.json",
      royalty: 250,  // 2.5%
      price: ethers.parseEther("2.0"),
      list: true,
    },
    {
      owner: seller2,
      uri: "ipfs://QmXyz4/metadata.json",
      royalty: 750,  // 7.5%
      price: ethers.parseEther("0.1"),
      list: false,   // minted but not listed
    },
    {
      owner: seller3,
      uri: "ipfs://QmXyz5/metadata.json",
      royalty: 500,  // 5%
      price: ethers.parseEther("5.0"),
      list: true,
    },
  ];

  // ─── Mint + List ───────────────────────────────────────────────────────────

  for (let i = 0; i < nfts.length; i++) {
    const item = nfts[i];

    // Mint
    const mintTx = await nft.mint(item.owner.address, item.uri, item.royalty);
    await mintTx.wait();
    console.log(`\n Minted token ${i} to ${item.owner.address.slice(0, 8)}...`);

    if (item.list) {
      // Approve marketplace
      const approveTx = await nft
        .connect(item.owner)
        .setApprovalForAll(marketplaceAddress, true);
      await approveTx.wait();

      // List
      const listTx = await marketplace
        .connect(item.owner)
        .listNFT(nftAddress, i, item.price);
      const receipt = await listTx.wait();

      console.log(
        ` Listed token ${i} for ${ethers.formatEther(item.price)} ETH`
      );
    } else {
      console.log(` Token ${i} minted but not listed`);
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  const totalMinted = await nft.totalMinted();
  const totalListings = await marketplace.totalListings();

  console.log("\n─────────────────────────────────────────");
  console.log(` Total minted  : ${totalMinted}`);
  console.log(` Total listings: ${totalListings}`);
  console.log("─────────────────────────────────────────");
  console.log("\n Seed complete. Frontend has data to work with.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });