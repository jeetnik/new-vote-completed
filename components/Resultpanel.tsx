"use client"
import React, { useState, useEffect } from 'react';
import styles from '../styles/UserPanel.module.css';
import { VotingContract } from '../types/VotingContract';
import { BrowserProvider } from 'ethers';

interface ResultPanelProps {
  contract: VotingContract | null;
  account: string;
  provider: BrowserProvider | null;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ contract, account, provider }) => {
  const [endedSessions, setEndedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (contract && account) {
      fetchEndedSessions();
    }
  }, [contract, account]);

  const fetchEndedSessions = async () => {
    try {
      setLoading(true);
      const sessionsCount = Number(await contract!.sessionsCount());
      const sessionsData = [];

      for (let i = 0; i < sessionsCount; i++) {
        const sessionDetails = await contract!.getSessionDetails(i);
        const now = new Date();
        const endTime = new Date(Number(sessionDetails.endTime) * 1000);
        
        // Check if the session has ended
        if (endTime < now) {
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

          // Find the winner (candidate with most votes)
          let winner = candidates[0];
          let isTie = false;
          
          for (let k = 1; k < candidates.length; k++) {
            if (candidates[k].voteCount > winner.voteCount) {
              winner = candidates[k];
              isTie = false;
            } else if (candidates[k].voteCount === winner.voteCount && candidates[k].voteCount > 0) {
              isTie = true;
            }
          }

          sessionsData.push({
            id: Number(sessionDetails.id),
            startTime: new Date(Number(sessionDetails.startTime) * 1000),
            endTime: endTime,
            description: sessionDetails.description,
            candidates: candidates,
            hasVoted: hasVoted,
            winner: isTie ? null : winner,
            isTie: isTie,
            totalVotes: candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)
          });
        }
      }
      
      // Sort sessions by end time (most recent first)
      sessionsData.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
      
      setEndedSessions(sessionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ended sessions:', error);
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className={styles.resultPanel}>
      <h2>Voting Results</h2>

      {loading ? (
        <p>Loading results...</p>
      ) : (
        <div className={styles.sessionSection}>
          <h3>Ended Voting Sessions</h3>
          {endedSessions.length > 0 ? (
            <div className={styles.sessionList}>
              {endedSessions.map((session) => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <h4>{session.description}</h4>
                    <div className={styles.sessionDates}>
                      <span>Started: {formatDate(session.startTime)}</span>
                      <span>Ended: {formatDate(session.endTime)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.resultsSummary}>
                    {session.isTie ? (
                      <div className={styles.tieResult}>
                        <h5>Result: Tie!</h5>
                        <p>Multiple candidates received the highest number of votes.</p>
                      </div>
                    ) : session.winner ? (
                      <div className={styles.winnerResult}>
                        <h5>Winner: {session.winner.name}</h5>
                        <p>Votes: {session.winner.voteCount} ({session.totalVotes > 0 ? 
                          Math.round((session.winner.voteCount / session.totalVotes) * 100) : 0}%)</p>
                      </div>
                    ) : (
                      <div className={styles.noVotesResult}>
                        <h5>No votes were cast</h5>
                      </div>
                    )}
                    <p>Total votes: {session.totalVotes}</p>
                    {session.hasVoted && <div className={styles.votedBadge}>You voted in this session</div>}
                  </div>
                  
                  <div className={styles.candidateResults}>
                    <h5>All Candidates:</h5>
                    <table className={styles.resultsTable}>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Votes</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.candidates.sort((a:any, b:any) => b.voteCount - a.voteCount).map((candidate:any) => (
                          <tr key={candidate.id} className={session.winner && session.winner.id === candidate.id ? styles.winnerRow : ''}>
                            <td>{candidate.name}</td>
                            <td>{candidate.voteCount}</td>
                            <td>
                              {session.totalVotes > 0 ? 
                                Math.round((candidate.voteCount / session.totalVotes) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No ended voting sessions to display.</p>
          )}
        </div>
      )}
    </div>
  );
};