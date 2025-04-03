"use client"
import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { VotingContract } from '../types/VotingContract';
import styles from '../styles/SessionList.module.css';

interface Session {
  id: number;
  description: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  candidates: Candidate[];
  hasVoted?: boolean;
}

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

interface SessionListProps {
  sessions: Session[];
  isAdmin: boolean;
  account: string;
  contract: VotingContract | null;
  provider: BrowserProvider | null;
  onStatusChange?: (sessionId: number, isActive: boolean) => Promise<void>;
  onVote?: (sessionId: number, candidateId: number) => Promise<void>;
  isUpcoming?: boolean;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  isAdmin,
  account,
  contract,
  provider,
  onStatusChange,
  onVote,
  isUpcoming = false
}) => {
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const toggleExpand = (sessionId: number) => {
    setExpandedSession(prev => (prev === sessionId ? null : sessionId));
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSessionStatus = (session: Session) => {
    const now = new Date();

    if (!session.isActive) {
      return { status: 'Inactive', className: styles.inactive };
    }

    if (now < session.startTime) {
      return { status: 'Upcoming', className: styles.upcoming };
    }

    if (now > session.endTime) {
      return { status: 'Ended', className: styles.ended };
    }

    return { status: 'Active', className: styles.active };
  };

  return (
    <div className={styles.sessionList}>
      {sessions.map((session) => {
        const { status, className } = getSessionStatus(session);
        const isActive = status === 'Active';
        const canVote = isActive && !session.hasVoted && !isAdmin && !isUpcoming;

        return (
          <div key={session.id} className={styles.sessionCard}>
            <div
              className={styles.sessionHeader}
              onClick={() => toggleExpand(session.id)}
            >
              <div className={styles.sessionInfo}>
                <h4>{session.description}</h4>
                <p>
                  <span className={className}>{status}</span>
                  {session.hasVoted && <span className={styles.voted}> (Voted)</span>}
                </p>
              </div>

              <div className={styles.sessionTimes}>
                <div>Start: {formatDateTime(session.startTime)}</div>
                <div>End: {formatDateTime(session.endTime)}</div>
              </div>

              <div className={styles.expandIcon}>
                {expandedSession === session.id ? '▲' : '▼'}
              </div>
            </div>

            {expandedSession === session.id && (
              <div className={styles.sessionDetails}>
                {isAdmin && onStatusChange && (
                  <div className={styles.adminControls}>
                    <button
                      className={`${styles.statusButton} ${session.isActive ? styles.deactivate : styles.activate}`}
                      onClick={() => onStatusChange(session.id, !session.isActive)}
                    >
                      {session.isActive ? 'Deactivate Session' : 'Activate Session'}
                    </button>
                  </div>
                )}

                <h4>Candidates</h4>
                {session.candidates.length === 0 ? (
                  <p>No candidates added yet.</p>
                ) : (
                  <div className={styles.candidatesList}>
                    {session.candidates.map((candidate) => (
                      <div key={candidate.id} className={styles.candidateCard}>
                        <div className={styles.candidateInfo}>
                          <div className={styles.candidateName}>{candidate.name}</div>
                          {(!isUpcoming || isAdmin) && (
                            <div className={styles.voteCount}>Votes: {candidate.voteCount}</div>
                          )}
                        </div>

                        {canVote && onVote && (
                          <button
                            className={styles.voteButton}
                            onClick={() => onVote(session.id, candidate.id)}
                          >
                            Vote
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};