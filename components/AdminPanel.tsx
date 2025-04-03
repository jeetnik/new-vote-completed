import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { SessionForm } from './SessionForm';
import { CandidateForm } from './CandidateForm';
import { WhitelistForm } from './WhitelistForm';
import { SessionList } from './SessionList';
import styles from '../styles/AdminPanel.module.css';
import { VotingContract } from '../types/VotingContract';

interface AdminPanelProps {
  contract: VotingContract | null;
  account: string;
  provider: BrowserProvider | null;
}

interface Session {
  id: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  description: string;
  candidates: Candidate[];
}

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ contract, account, provider }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'whitelist'>('sessions');
  const [whitelistRequired, setWhitelistRequired] = useState<boolean>(false);

  // Fetch sessions and whitelist status on contract change
  useEffect(() => {
    if (contract) {
      fetchSessions();
      checkWhitelistStatus();
    }
  }, [contract]);

  // Fetch all sessions from the contract
  const fetchSessions = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const sessionsCount = Number(await contract.sessionsCount());
      const sessionsData: Session[] = [];

      for (let i = 0; i < sessionsCount; i++) {
        const sessionDetails = await contract.getSessionDetails(i);
        const candidatesCount = Number(await contract.getCandidatesCount(i));
        const candidates: Candidate[] = [];

        for (let j = 0; j < candidatesCount; j++) {
          const candidate = await contract.getCandidate(i, j);
          candidates.push({
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount),
          });
        }

        sessionsData.push({
          id: Number(sessionDetails.id),
          startTime: new Date(Number(sessionDetails.startTime) * 1000),
          endTime: new Date(Number(sessionDetails.endTime) * 1000),
          isActive: sessionDetails.isActive,
          description: sessionDetails.description,
          candidates,
        });
      }

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if whitelist is required
  const checkWhitelistStatus = async () => {
    if (!contract) return;

    try {
      const status = await contract.whitelistRequired();
      setWhitelistRequired(status);
    } catch (error) {
      console.error('Error checking whitelist status:', error);
    }
  };

  // Toggle whitelist requirement
  const toggleWhitelistRequirement = async () => {
    if (!contract) return;

    try {
      const tx = await contract.setWhitelistRequired(!whitelistRequired);
      await tx.wait();
      setWhitelistRequired(!whitelistRequired);
    } catch (error) {
      console.error('Error toggling whitelist requirement:', error);
    }
  };

  // Handle creating a new session
  const handleCreateSession = async (startTime: Date, endTime: Date, description: string) => {
    if (!contract) return;

    try {
      const startTimeUnix = Math.floor(startTime.getTime() / 1000);
      const endTimeUnix = Math.floor(endTime.getTime() / 1000);

      const tx = await contract.createVotingSession(startTimeUnix, endTimeUnix, description);
      await tx.wait();
      await fetchSessions(); // Refresh sessions after creation
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Handle adding a candidate to a session
  const handleAddCandidate = async (sessionId: number, candidateName: string) => {
    if (!contract) return;

    try {
      const tx = await contract.addCandidate(sessionId, candidateName);
      await tx.wait();
      await fetchSessions(); // Refresh sessions after adding candidate
    } catch (error) {
      console.error('Error adding candidate:', error);
    }
  };

  // Handle setting session status (active/inactive)
  const handleSetSessionStatus = async (sessionId: number, isActive: boolean) => {
    if (!contract) return;

    try {
      const tx = await contract.setSessionStatus(sessionId, isActive);
      await tx.wait();
      await fetchSessions(); // Refresh sessions after status change
    } catch (error) {
      console.error('Error setting session status:', error);
    }
  };

  return (
    <div className={styles.adminPanel}>
      <div className={styles.tabButtons}>
        <button
          className={`${styles.tabButton} ${activeTab === 'sessions' ? styles.active : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'whitelist' ? styles.active : ''}`}
          onClick={() => setActiveTab('whitelist')}
        >
          Voter Whitelist
        </button>
      </div>

      {activeTab === 'sessions' ? (
        <div className={styles.sessionsTab}>
          <h2>Manage Voting Sessions</h2>
          <SessionForm onSubmit={handleCreateSession} />
          <div className={styles.divider}></div>
          <CandidateForm
            sessions={sessions.filter((s) => s.isActive && new Date(s.startTime) > new Date())}
            onSubmit={handleAddCandidate}
          />
          <div className={styles.divider}></div>
          <h3>Voting Sessions</h3>
          {loading ? (
            <p>Loading sessions...</p>
          ) : sessions.length > 0 ? (
            <SessionList
              sessions={sessions}
              isAdmin={true}
              onStatusChange={handleSetSessionStatus}
              account={account}
              contract={contract}
              provider={provider}
            />
          ) : (
            <p>No sessions found. Create one to get started.</p>
          )}
        </div>
      ) : (
        <WhitelistForm contract={contract} provider={provider} onUpdate={fetchSessions} />
      )}
    </div>
  );
};
