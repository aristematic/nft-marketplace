import { useState, useCallback } from "react";
import { getMarketplaceContract } from "../utils/contractHelpers";
import { parseETH } from "../utils/ethers";
import { CONTRACT_ADDRESSES } from "../utils/constants";

export const useMarketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const contract = await getMarketplaceContract();
      const total = await contract.totalListings();
      const result = [];

      for (let i = 0; i < Number(total); i++) {
        const listing = await contract.getListing(i);
        if (listing.active) {
          result.push({
            listingId: i,
            seller: listing.seller,
            nftContract: listing.nftContract,
            tokenId: Number(listing.tokenId),
            price: listing.price,
            active: listing.active,
          });
        }
      }
      setListings(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const listNFT = async (tokenId, priceInEth) => {
    try {
      const contract = await getMarketplaceContract(true);
      const tx = await contract.listNFT(
        CONTRACT_ADDRESSES.MarketplaceNFT,
        tokenId,
        parseETH(priceInEth)
      );
      await tx.wait();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const buyNFT = async (listingId, priceWei) => {
    try {
      const contract = await getMarketplaceContract(true);
      const tx = await contract.buyNFT(listingId, { value: priceWei });
      await tx.wait();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const cancelListing = async (listingId) => {
    try {
      const contract = await getMarketplaceContract(true);
      const tx = await contract.cancelListing(listingId);
      await tx.wait();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    listings,
    loading,
    error,
    fetchListings,
    listNFT,
    buyNFT,
    cancelListing,
  };
};