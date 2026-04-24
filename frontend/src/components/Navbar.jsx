import React from "react";
import { useWallet } from "../hooks/useWallet";

const Navbar = ({ activeTab, setActiveTab }) => {
  const { account, shortAddress, isConnecting, connect, isConnected } = useWallet();

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>⬡ NFT Market</div>

      <div style={styles.tabs}>
        {["explore", "mint", "list"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={connect}
        disabled={isConnecting}
        style={{
          ...styles.connectBtn,
          ...(isConnected ? styles.connectedBtn : {}),
        }}
      >
        {isConnecting ? "Connecting..." : isConnected ? shortAddress : "Connect Wallet"}
      </button>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    borderBottom: "1px solid #1e1e2e",
    background: "#0a0a0f",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#a78bfa",
    letterSpacing: "2px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
  },
  tab: {
    background: "transparent",
    border: "1px solid #1e1e2e",
    color: "#6b7280",
    padding: "8px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "#7c3aed22",
    border: "1px solid #7c3aed",
    color: "#a78bfa",
  },
  connectBtn: {
    background: "#7c3aed",
    border: "none",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  connectedBtn: {
    background: "#10b98122",
    border: "1px solid #10b981",
    color: "#10b981",
  },
};

export default Navbar;