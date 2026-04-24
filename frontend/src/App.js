import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import NFTCard from "./components/NFTCard";
import MintNFT from "./components/MintNFT";
import ListNFT from "./components/ListNFT";
import { useMarketplace } from "./hooks/useMarketplace";

function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const { listings, loading, fetchListings } = useMarketplace();

  useEffect(() => {
    if (activeTab === "explore") fetchListings();
  }, [activeTab]);

  return (
    <div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={styles.main}>
        {activeTab === "explore" && (
          <div>
            <div style={styles.header}>
              <h1 style={styles.heading}>Explore NFTs</h1>
              <p style={styles.sub}>{listings.length} active listings</p>
            </div>

            {loading ? (
              <div style={styles.center}>Loading listings...</div>
            ) : listings.length === 0 ? (
              <div style={styles.center}>No active listings</div>
            ) : (
              <div style={styles.grid}>
                {listings.map((listing) => (
                  <NFTCard
                    key={listing.listingId}
                    listing={listing}
                    onAction={fetchListings}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mint" && <MintNFT />}
        {activeTab === "list" && <ListNFT />}
      </main>
    </div>
  );
}

const styles = {
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 32px",
  },
  header: {
    marginBottom: "32px",
  },
  heading: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: "8px",
  },
  sub: {
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  center: {
    textAlign: "center",
    color: "#6b7280",
    padding: "80px 0",
    fontSize: "16px",
  },
};

export default App;