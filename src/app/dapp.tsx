"use client"
import { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ConnectWallet } from '../../components/ConnectWallet';
import { AdminPanel } from '../../components/AdminPanel';
import { UserPanel } from '../../components/UserPanel';
import {VotingContract} from "../../types/VotingContract"
import { VotingABI } from "../../constants/contractABI";
import styles from '../../styles/Home.module.css';

const CONTRACT_ADDRESS = "0xb2c0a689C9cE7C80F7f3346b30c898fbA651Ae0a";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Dapp() {
  const [account, setAccount] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
 

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log("Please install MetaMask!");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      const signer = await provider.getSigner();
      setSigner(signer);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VotingABI,
        signer
      );
      setContract(contract);

      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setAccount(accounts[0].address);
        await checkIfAdmin(accounts[0].address, contract);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
      setLoading(false);
    }
  };
  
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VotingABI,
        signer
      );
      setContract(contract);
      
      await checkIfAdmin(address, contract);
      setLoading(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setLoading(false);
    }
  };
  
  const checkIfAdmin = async (account: string, contract: Contract) => {
    try {
      const adminAddress: string = await contract.admin(); // ✅ FIXED: Call directly in Ethers v6
      setIsAdmin(account.toLowerCase() === adminAddress.toLowerCase());
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Decentralized Voting dApp</title>
        <meta name="description" content="A decentralized voting application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to the Voting dApp
        </h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : account ? (
          <>
            <div className={styles.walletInfo}>
              <p>Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
              {isAdmin && <p className={styles.adminBadge}>Admin</p>}
            </div>
            
            {isAdmin ? (
              <AdminPanel 
              // @ts-ignore - Ignoring type mismatch between Contract and VotingContract
                contract={contract }  // ✅ FIXED: Pass as `Contract`, not `VotingContract`
                account={account} 
                provider={provider} 
                signer={signer}
              />
            ) : (
              <UserPanel 
              // @ts-ignore - Ignoring type mismatch between Contract and VotingContract
                contract={contract} 
                account={account} 
                provider={provider} 
                signer={signer}
              />
            )}
          </>
        ) : (
          <ConnectWallet connectWallet={connectWallet} />
        )}
      </main>
    </div>
  );
}
