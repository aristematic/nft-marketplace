import { useState } from "react";
import { getNFTContract } from "../utils/contractHelpers";

export const useNFT = () => {
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);

  const mint = async (toAddress, uri, royaltyBasisPoints) => {
    try {
      setMinting(true);
      setError(null);
      const contract = await getNFTContract(true);
      const tx = await contract.mint(toAddress, uri, royaltyBasisPoints);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setMinting(false);
    }
  };

  const approveMarketplace = async (marketplaceAddress) => {
    const contract = await getNFTContract(true);
    const tx = await contract.setApprovalForAll(marketplaceAddress, true);
    await tx.wait();
  };

  const getTokenURI = async (tokenId) => {
    const contract = await getNFTContract();
    return await contract.tokenURI(tokenId);
  };

  const getTotalMinted = async () => {
    const contract = await getNFTContract();
    return await contract.totalMinted();
  };

  return { mint, approveMarketplace, getTokenURI, getTotalMinted, minting, error };
};