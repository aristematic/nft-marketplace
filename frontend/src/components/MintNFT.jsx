import React, { useState } from "react";
import { useNFT } from "../hooks/useNFT";
import { useWallet } from "../hooks/useWallet";
import { CONTRACT_ADDRESSES } from "../utils/constants";

const MintNFT = () => {
  const { mint, approveMarketplace, minting } = useNFT();
  const { account, isConnected } = useWallet();

  const [form, setForm] = useState({
    uri: "",
    royalty: "500",
    listAfterMint: false,
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMint = async () => {
    if (!isConnected) return alert("Connect wallet first");
    if (!form.uri) return alert("Enter a token URI");

    try {
      setStatus("Minting...");
      await mint(account, form.uri, parseInt(form.royalty));

      if (form.listAfterMint) {
        setStatus("Approving marketplace...");
        await approveMarketplace(CONTRACT_ADDRESSES.NFTMarketplace);
      }

      setStatus("✅ Minted successfully!");
      setForm({ uri: "", royalty: "500", listAfterMint: false });
    } catch (err) {
      setStatus("❌ " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mint NFT</h2>
      <p style={styles.subtitle}>Create a new NFT with royalties</p>

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Token URI</label>
          <input
            name="uri"
            value={form.uri}
            onChange={handleChange}
            placeholder="ipfs://Qm..."
            style={styles.input}
          />
          <span style={styles.hint}>IPFS URI pointing to your NFT metadata JSON</span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Royalty — {(parseInt(form.royalty) / 100).toFixed(1)}%
          </label>
          <input
            name="royalty"
            type="range"
            min="0"
            max="2000"
            step="50"
            value={form.royalty}
            onChange={handleChange}
            style={styles.range}
          />
          <div style={styles.rangeLabels}>
            <span>0%</span>
            <span>20%</span>
          </div>
        </div>

        <div style={styles.checkRow}>
          <input
            type="checkbox"
            name="listAfterMint"
            checked={form.listAfterMint}
            onChange={handleChange}
            id="listAfter"
            style={styles.checkbox}
          />
          <label htmlFor="listAfter" style={styles.checkLabel}>
            Approve marketplace after minting
          </label>
        </div>

        <button
          onClick={handleMint}
          disabled={minting || !isConnected}
          style={{
            ...styles.btn,
            opacity: minting || !isConnected ? 0.5 : 1,
          }}
        >
          {minting ? "Minting..." : "Mint NFT"}
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
  hint: {
    fontSize: "11px",
    color: "#4b5563",
  },
  range: {
    accentColor: "#7c3aed",
    width: "100%",
  },
  rangeLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#4b5563",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checkbox: {
    accentColor: "#7c3aed",
    width: "16px",
    height: "16px",
  },
  checkLabel: {
    fontSize: "14px",
    color: "#9ca3af",
    cursor: "pointer",
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

export default MintNFT;