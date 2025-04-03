"use client"
import React, { useState } from 'react';
import { ethers, Contract, BrowserProvider, JsonRpcSigner, BaseContract } from 'ethers';
import styles from '../styles/Forms.module.css';

// Define a custom interface for your contract that extends BaseContract
interface WhitelistContract extends BaseContract {
  addVoterToWhitelist: (address: string) => Promise<any>;
  addMultipleVotersToWhitelist: (addresses: string[]) => Promise<any>;
  removeVoterFromWhitelist: (address: string) => Promise<any>;
}

interface WhitelistFormProps {
  contract: WhitelistContract | null;
  provider: BrowserProvider | null;
  onUpdate: () => void;
}

export const WhitelistForm: React.FC<WhitelistFormProps> = ({ contract, provider, onUpdate }) => {
  const [singleAddress, setSingleAddress] = useState<string>('');
  const [multipleAddresses, setMultipleAddresses] = useState<string>('');
  const [addressToRemove, setAddressToRemove] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const addSingleVoter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ethers.isAddress(singleAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    setLoading(true);
    try {
      if (!contract || !provider) return;

      const signer: JsonRpcSigner = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as WhitelistContract;

      const tx = await contractWithSigner.addVoterToWhitelist(singleAddress);
      await tx.wait();

      alert(`Address ${singleAddress} successfully added to whitelist`);
      setSingleAddress('');
      onUpdate();
    } catch (error) {
      console.error("Error adding voter to whitelist:", error);
      alert("Error adding voter to whitelist. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const addMultipleVoters = async (e: React.FormEvent) => {
    e.preventDefault();

    const addresses = multipleAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr !== '');

    const invalidAddresses = addresses.filter(addr => !ethers.isAddress(addr));

    if (invalidAddresses.length > 0) {
      alert(`Invalid Ethereum addresses: ${invalidAddresses.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (!contract || !provider) return;

      const signer: JsonRpcSigner = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as WhitelistContract;

      const tx = await contractWithSigner.addMultipleVotersToWhitelist(addresses);
      await tx.wait();

      alert(`${addresses.length} addresses successfully added to whitelist`);
      setMultipleAddresses('');
      onUpdate();
    } catch (error) {
      console.error("Error adding multiple voters to whitelist:", error);
      alert("Error adding voters to whitelist. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const removeVoter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ethers.isAddress(addressToRemove)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    setLoading(true);
    try {
      if (!contract || !provider) return;

      const signer: JsonRpcSigner = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as WhitelistContract;

      const tx = await contractWithSigner.removeVoterFromWhitelist(addressToRemove);
      await tx.wait();

      alert(`Address ${addressToRemove} successfully removed from whitelist`);
      setAddressToRemove('');
      onUpdate();
    } catch (error) {
      console.error("Error removing voter from whitelist:", error);
      alert("Error removing voter from whitelist. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.whitelistForms}>
      <div className={styles.formContainer}>
        <h3>Add Single Voter</h3>
        <form onSubmit={addSingleVoter}>
          <div className={styles.formGroup}>
            <label htmlFor="singleAddress">Ethereum Address:</label>
            <input
              type="text"
              id="singleAddress"
              value={singleAddress}
              onChange={(e) => setSingleAddress(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add to Whitelist'}
          </button>
        </form>
      </div>

      <div className={styles.formContainer}>
        <h3>Add Multiple Voters</h3>
        <form onSubmit={addMultipleVoters}>
          <div className={styles.formGroup}>
            <label htmlFor="multipleAddresses">Ethereum Addresses (one per line):</label>
            <textarea
              id="multipleAddresses"
              value={multipleAddresses}
              onChange={(e) => setMultipleAddresses(e.target.value)}
              placeholder="0x...\n0x...\n0x..."
              rows={5}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Multiple to Whitelist'}
          </button>
        </form>
      </div>

      <div className={styles.formContainer}>
        <h3>Remove Voter</h3>
        <form onSubmit={removeVoter}>
          <div className={styles.formGroup}>
            <label htmlFor="addressToRemove">Ethereum Address:</label>
            <input
              type="text"
              id="addressToRemove"
              value={addressToRemove}
              onChange={(e) => setAddressToRemove(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove from Whitelist'}
          </button>
        </form>
      </div>
    </div>
  );
};