import { ethers } from "ethers";
import { getSigner, getProvider } from "./ethers";
import { CONTRACT_ADDRESSES } from "./constants";
import MarketplaceNFTAbi from "../abis/MarketplaceNFT.json";
import NFTMarketplaceAbi from "../abis/NFTMarketplace.json";

export const getNFTContract = async (withSigner = false) => {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.MarketplaceNFT,
    MarketplaceNFTAbi,
    signerOrProvider
  );
};

export const getMarketplaceContract = async (withSigner = false) => {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.NFTMarketplace,
    NFTMarketplaceAbi,
    signerOrProvider
  );
};