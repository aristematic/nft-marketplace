# ⬡ NFT Marketplace

A fully on-chain NFT Marketplace built from scratch — ERC-721 minting, ERC-2981 royalties, escrow-free listing, and atomic fee splits on every purchase.

![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-38%2F38%20passing-34d399?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square)

---

## What This Covers

This project implements the full NFT stack — everything non-DeFi blockchain revolves around:

- **ERC-721** — minting, ownership, tokenURI storage
- **ERC-2981** — on-chain royalty standard, royalty info stored per token at mint
- **Marketplace** — escrow-free list/buy/cancel, atomic fee splits, CEI pattern, reentrancy guard
- **Frontend** — React + ethers.js v6, MetaMask integration, live listing updates

---

## Architecture

```
contracts/
├── MarketplaceNFT.sol      ← ERC-721 + ERC-2981 (mint, royaltyInfo, tokenURI)
└── NFTMarketplace.sol      ← list, buy, cancel, updatePrice, fee splits

test/
├── MarketplaceNFT.test.js  ← unit tests: mint, royalty math, supportsInterface
└── NFTMarketplace.test.js  ← integration: list/buy/cancel, fee splits, edge cases

scripts/
├── deploy.js               ← deploys both contracts, saves addresses + ABIs to frontend
└── seed.js                 ← mints sample NFTs and creates listings for local dev

frontend/src/
├── components/             ← Navbar, NFTCard, MintNFT, ListNFT
├── hooks/                  ← useWallet, useNFT, useMarketplace
├── utils/                  ← ethers setup, contract helpers, constants
└── abis/                   ← auto-generated from artifacts on deploy
```

---

## How It Works

### Minting
Any address can mint an NFT with a custom `tokenURI` and royalty basis points (e.g. `500` = 5%). Royalty info is stored on-chain per token via ERC-2981.

### Listing
Seller calls `setApprovalForAll` → then `listNFT(nftContract, tokenId, price)`. The NFT stays in the seller's wallet — no custodial lock. Marketplace holds approval authority only.

### Buying
On `buyNFT(listingId)`:
1. Listing marked inactive (CEI pattern — before any external calls)
2. Platform fee calculated (2.5%)
3. `royaltyInfo()` called on NFT contract — royalty receiver + amount fetched
4. Seller proceeds = `price - platformFee - royaltyAmount`
5. NFT transferred to buyer
6. ETH split atomically: platform → royalty receiver → seller
7. Overpayment refunded

All in one transaction. Either everything succeeds or everything reverts.

### Fee Example
| Sale Price | Platform (2.5%) | Royalty (5%) | Seller Gets |
|------------|-----------------|--------------|-------------|
| 1.0 ETH    | 0.025 ETH       | 0.05 ETH     | 0.925 ETH   |
| 2.0 ETH    | 0.05 ETH        | 0.10 ETH     | 1.85 ETH    |
| 0.5 ETH    | 0.0125 ETH      | 0.025 ETH    | 0.4625 ETH  |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask browser extension

### Install

```bash
git clone https://github.com/aristematic/nft-marketplace.git
cd nft-marketplace
npm install
```

### Run Local Node

```bash
# Terminal 1 — start local blockchain
npx hardhat node
```

### Deploy + Seed

```bash
# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed.js --network localhost
```

### Run Frontend

```bash
# Terminal 3
cd frontend
npm install
npm start
```

Open `http://localhost:3000`

---

## MetaMask Setup

Add Hardhat Local network to MetaMask:

| Field           | Value                    |
|-----------------|--------------------------|
| Network Name    | Hardhat Local            |
| RPC URL         | http://127.0.0.1:8545    |
| Chain ID        | 31337                    |
| Currency Symbol | ETH                      |

Import any account from `npx hardhat node` output using its private key. Each account starts with 10,000 ETH.

---

## Tests

```bash
npx hardhat test
```

```
MarketplaceNFT
  Minting             6 passing
  Royalties (ERC-2981) 4 passing
  supportsInterface   3 passing

NFTMarketplace
  Listing             5 passing
  Buying              9 passing
  Cancel Listing      4 passing
  Update Price        3 passing
  Admin               3 passing

38 passing (2s)
```

---

## Smart Contract Design Decisions

**Why two contracts?**
NFT contract and Marketplace are separate — mirrors how production marketplaces (OpenSea, Blur) work. Either can be upgraded independently. Different NFT collections can plug into the same marketplace.

**Why non-custodial listing?**
NFT stays in seller's wallet during listing. Marketplace only holds `setApprovalForAll` authority. Cleaner UX, no lock-up risk.

**Why CEI pattern + ReentrancyGuard?**
ETH is sent to multiple addresses in `buyNFT`. Marking the listing inactive before any external calls (Checks-Effects-Interactions) prevents re-entrancy. `nonReentrant` modifier is a second safety layer.

**Why `try/catch` on `royaltyInfo()`?**
Not every NFT contract implements ERC-2981. If the call fails, royalty defaults to zero and the sale continues — marketplace works with any ERC-721.

**Why `.call{value}` instead of `.transfer()`?**
`.transfer()` has a hardcoded 2300 gas stipend that breaks when the recipient is a contract (e.g. a multisig). `.call` forwards all gas and handles it correctly.

---

## Project Stack

| Layer        | Tech                              |
|--------------|-----------------------------------|
| Blockchain   | Hardhat 2.22 (local) / Sepolia    |
| Contracts    | Solidity 0.8.28, OpenZeppelin 5.x |
| Testing      | Hardhat + Chai + ethers.js v6     |
| Frontend     | React 18, ethers.js v6            |
| Wallet       | MetaMask                          |

---

## Deploy to Sepolia

```bash
# Add to .env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key

npx hardhat run scripts/deploy.js --network sepolia
```

---

Built by [@aristematic](https://github.com/aristematic)
