// components/ConnectWallet.tsx
"use client"
import React from 'react';
import styles from '../styles/ConnectWallet.module.css';

interface ConnectWalletProps {
  connectWallet: () => Promise<void>;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ connectWallet }) => {
  return (
    <div className={styles.connectContainer}>
      <h2>Connect your wallet to use the dApp</h2>
      <p>You need to connect your Ethereum wallet to access voting features</p>
      <button 
        className={styles.connectButton}
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    </div>
  );
};