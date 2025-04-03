"use client"
import React, { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { SessionList } from './SessionList';
import { ResultPanel } from './Resultpanel';
import styles from '../styles/UserPanel.module.css';
import { VotingContract } from '../types/VotingContract';
import { Github, Linkedin, Twitter } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface UserPanelProps {
  contract: VotingContract | null;
  account: string;
  provider: BrowserProvider | null;
}

export const UserPanel: React.FC<UserPanelProps> = ({ contract, account, provider }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);
  const [whitelistRequired, setWhitelistRequired] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'voting' | 'results'>('voting');

  useEffect(() => {
    if (contract && account) {
      fetchSessions();
      checkWhitelistStatus();
    }
  }, [contract, account]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsCount = Number(await contract!.sessionsCount());
      const sessionsData = [];

      for (let i = 0; i < sessionsCount; i++) {
        const sessionDetails = await contract!.getSessionDetails(i);

        if (sessionDetails.isActive) {
          const candidatesCount = Number(await contract!.getCandidatesCount(i));
          const hasVoted = await contract!.hasVoted(i, account);

          const candidates = [];
          for (let j = 0; j < candidatesCount; j++) {
            const candidate = await contract!.getCandidate(i, j);
            candidates.push({
              id: Number(candidate.id),
              name: candidate.name,
              voteCount: Number(candidate.voteCount)
            });
          }

          sessionsData.push({
            id: Number(sessionDetails.id),
            startTime: new Date(Number(sessionDetails.startTime) * 1000),
            endTime: new Date(Number(sessionDetails.endTime) * 1000),
            isActive: sessionDetails.isActive,
            description: sessionDetails.description,
            candidates: candidates,
            hasVoted: hasVoted
          });
        }
      }

      setSessions(sessionsData);

      const now = new Date();
      const active = sessionsData.filter(
        (s) => s.startTime <= now && s.endTime >= now
      );
      const upcoming = sessionsData.filter((s) => s.startTime > now);

      setActiveSessions(active);
      setUpcomingSessions(upcoming);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const checkWhitelistStatus = async () => {
    try {
      const required = await contract!.whitelistRequired();
      setWhitelistRequired(required);

      if (required) {
        const whitelisted = await contract!.isVoterWhitelisted(account);
        setIsWhitelisted(whitelisted);
      } else {
        setIsWhitelisted(true);
      }
    } catch (error) {
      console.error('Error checking whitelist status:', error);
    }
  };

  const handleVote = async (sessionId: number, candidateId: number) => {
    try {
      if (!contract || !provider) return;

      const signer: JsonRpcSigner = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as VotingContract;

      const tx = await contractWithSigner.vote(sessionId, candidateId);
      
      // Show pending toast with Etherscan link
      const etherscanUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      toast.promise(
        tx.wait(),
        {
          loading: <span>
            Processing vote... 
            <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className={styles.etherscanLink}>
              View on Etherscan
            </a>
          </span>,
          success: () => {
            fetchSessions();
            return 'Vote cast successfully!';
          },
          error: (error) => `Error: ${error?.message || 'Transaction failed'}`
        }
      );
    } catch (error: any) {
      console.error('Error voting:', error);
      const message = error?.info?.error?.message || error.message || '';
      
      if (message.includes('Already voted')) {
        toast.error('You have already voted in this session!');
      } else if (message.includes('Voter is not whitelisted')) {
        toast.error('You are not whitelisted to vote in this session!');
      } else if (message.includes('Voting is not active')) {
        toast.error('Voting is not currently active for this session!');
      } else {
        toast.error('Error casting vote. See console for details.');
      }
    }
  };


  return (
    <div className={styles.userPanel}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
          },
          duration: 5000,
        }}
      />
        <div className={styles.networkHint}>
        <span>Voting happens on Ethereum Sepolia testnet - ensure your wallet is connected to this network</span>
      </div>
      
      <div className={styles.socialLinks}>
        <a href="https://github.com/jeetnik" target="_blank" rel="noopener noreferrer">
          <Github className={styles.icon} />
        </a>
        <a href="https://www.linkedin.com/in/saijeet-nikam" target="_blank" rel="noopener noreferrer">
          <Linkedin className={styles.icon} />
        </a>
        <a href="https://x.com/nikamsaijeet" target="_blank" rel="noopener noreferrer">
          <Twitter className={styles.icon} />
        </a>
      </div>
      <h2>Voting Dashboard</h2>

      {whitelistRequired && !isWhitelisted && (
        <div className={styles.whitelistWarning}>
          <p>
            You are not whitelisted to vote. Please contact the admin to be added
            to the whitelist.
          </p>
        </div>
      )}

      <div className={styles.tabsContainer}>
        <div 
          className={`${styles.tab} ${activeTab === 'voting' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('voting')}
        >
          Active & Upcoming Sessions
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 'results' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results & History
        </div>
      </div>

      {activeTab === 'voting' ? (
        loading ? (
          <p>Loading sessions...</p>
        ) : (
          <>
            <div className={styles.sessionSection}>
              <h3>Active Voting Sessions</h3>
              {activeSessions.length > 0 ? (
                <SessionList
                  sessions={activeSessions}
                  isAdmin={false}
                  onVote={handleVote}
                  account={account}
                  contract={contract}
                  provider={provider}
                />
              ) : (
                <p>No active voting sessions at the moment.</p>
              )}
            </div>

            <div className={styles.sessionSection}>
              <h3>Upcoming Voting Sessions</h3>
              {upcomingSessions.length > 0 ? (
                <SessionList
                  sessions={upcomingSessions}
                  isAdmin={false}
                  onVote={handleVote}
                  account={account}
                  contract={contract}
                  provider={provider}
                  isUpcoming={true}
                />
              ) : (
                <p>No upcoming voting sessions.</p>
              )}
            </div>
          </>
        )
      ) : (
        <ResultPanel 
          contract={contract}
          account={account}
          provider={provider}
        />
      )}


    </div>
  );
};