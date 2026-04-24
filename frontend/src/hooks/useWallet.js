import { useState, useEffect, useCallback } from "react";
import { getProvider, shortenAddress } from "../utils/ethers";

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not installed");
      return;
    }
    try {
      setIsConnecting(true);
      setError(null);
      const provider = getProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    // Auto-connect if already authorized
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          connect();
        }
      });

    // Listen for account/chain changes
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    return () => {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    };
  }, [connect, disconnect]);

  return {
    account,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    shortAddress: account ? shortenAddress(account) : null,
    isConnected: !!account,
  };
};