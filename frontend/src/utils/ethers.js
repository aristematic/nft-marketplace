import { ethers } from "ethers";

export const getProvider = () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

export const formatETH = (wei) => {
  return ethers.formatEther(wei);
};

export const parseETH = (eth) => {
  return ethers.parseEther(eth.toString());
};

export const shortenAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};