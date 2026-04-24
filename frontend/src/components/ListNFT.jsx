import React, { useState } from "react";
import { useNFT } from "../hooks/useNFT";
import { useMarketplace } from "../hooks/useMarketplace";
import { useWallet } from "../hooks/useWallet";
import { CONTRACT_ADDRESSES } from "../utils/constants";

const ListNFT = () => {
  const { approveMarketplace } = useNFT();
  const { listNFT } = useMarketplace();
  const { isConnected } = useWallet();

  const [form, setForm] = useState({ tokenId: "", price: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleList = async () => {
    if (!isConnected) return alert("Connect wallet first");
    if (!form.tokenId && form.tokenId !== "0") return alert("Enter token ID");
    if (!form.price) return alert("Enter price");

    try {
      setLoading(true);
      setStatus("Approving marketplace...");
      await approveMarketplace(CONTRACT_ADDRESSES.NFTMarketplace);

      setStatus("Listing NFT...");
      await listNFT(parseInt(form.tokenId), form.price);

      setStatus("✅ Listed successfully!");
      setForm({ tokenId: "", price: "" });
    } catch (err) {
      setStatus("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>List NFT</h2>
      <p style={styles.subtitle}>Put your NFT up for sale</p>

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Token ID</label>
          <input
            name="tokenId"
            value={form.tokenId}
            onChange={handleChange}
            placeholder="0"
            type="number"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Price (ETH)</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="0.5"
            type="number"
            step="0.01"
            style={styles.input}
          />
        </div>

        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span>Platform fee</span>
            <span>2.5%</span>
          </div>
          <div style={styles.infoRow}>
            <span>Royalty</span>
            <span>set at mint</span>
          </div>
          <div style={styles.infoRow}>
            <span>You receive</span>
            <span style={{ color: "#a78bfa" }}>
              {form.price
                ? `~${(parseFloat(form.price) * 0.925).toFixed(4)} ETH`
                : "—"}
            </span>
          </div>
        </div>

        <button
          onClick={handleList}
          disabled={loading || !isConnected}
          style={{
            ...styles.btn,
            opacity: loading || !isConnected ? 0.5 : 1,
          }}
        >
          {loading ? "Processing..." : "Approve & List"}
        </button>

        {status && <div style={styles.status}>{status}</div>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "520px",
    margin: "40px auto",
    padding: "0 16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "32px",
  },
  form: {
    background: "#13131f",
    border: "1px solid #1e1e2e",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#a78bfa",
  },
  input: {
    background: "#0a0a0f",
    border: "1px solid #1e1e2e",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
  },
  infoBox: {
    background: "#0a0a0f",
    borderRadius: "10px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#6b7280",
  },
  btn: {
    background: "#7c3aed",
    border: "none",
    color: "#fff",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  status: {
    padding: "12px",
    borderRadius: "8px",
    background: "#0a0a0f",
    color: "#a78bfa",
    fontSize: "13px",
    textAlign: "center",
  },
};

export default ListNFT;