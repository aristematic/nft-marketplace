import React, { useState } from "react";
import { formatETH, shortenAddress } from "../utils/ethers";
import { useMarketplace } from "../hooks/useMarketplace";
import { useWallet } from "../hooks/useWallet";

const NFTCard = ({ listing, onAction }) => {
  const { buyNFT, cancelListing } = useMarketplace();
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);

  const isSeller = account?.toLowerCase() === listing.seller.toLowerCase();

  const handleBuy = async () => {
    try {
      setLoading(true);
      await buyNFT(listing.listingId, listing.price);
      onAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await cancelListing(listing.listingId);
      onAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.image}>
        <span style={styles.tokenId}>#{listing.tokenId}</span>
      </div>

      <div style={styles.body}>
        <div style={styles.title}>Token #{listing.tokenId}</div>
        <div style={styles.seller}>
          by {shortenAddress(listing.seller)}
        </div>

        <div style={styles.priceRow}>
          <span style={styles.priceLabel}>Price</span>
          <span style={styles.price}>{formatETH(listing.price)} ETH</span>
        </div>

        {isSeller ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{ ...styles.btn, ...styles.cancelBtn }}
          >
            {loading ? "Cancelling..." : "Cancel Listing"}
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={loading || !account}
            style={{ ...styles.btn, ...styles.buyBtn }}
          >
            {loading ? "Buying..." : !account ? "Connect Wallet" : "Buy Now"}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "#13131f",
    border: "1px solid #1e1e2e",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  image: {
    height: "200px",
    background: "linear-gradient(135deg, #1a1a2e, #7c3aed33)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenId: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#7c3aed",
    opacity: 0.6,
  },
  body: {
    padding: "16px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: "4px",
  },
  seller: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "10px 12px",
    background: "#0a0a0f",
    borderRadius: "8px",
  },
  priceLabel: {
    fontSize: "12px",
    color: "#6b7280",
  },
  price: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#a78bfa",
  },
  btn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "opacity 0.2s",
  },
  buyBtn: {
    background: "#7c3aed",
    color: "#fff",
  },
  cancelBtn: {
    background: "#f8717122",
    border: "1px solid #f87171",
    color: "#f87171",
  },
};

export default NFTCard;