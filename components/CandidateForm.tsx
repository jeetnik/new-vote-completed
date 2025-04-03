// components/CandidateForm.tsx
"use client"
import React, { useState } from 'react';
import styles from '../styles/Forms.module.css';

interface Session {
  id: number;
  description: string;
  startTime: Date;
}

interface CandidateFormProps {
  sessions: Session[];
  onSubmit: (sessionId: number, candidateName: string) => Promise<void>;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ sessions, onSubmit }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [candidateName, setCandidateName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId || !candidateName) {
      alert("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(parseInt(sessionId), candidateName);
      // Reset form
      setCandidateName('');
    } catch (error) {
      console.error("Error adding candidate:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.formContainer}>
      <h3>Add Candidate to Session</h3>
      {sessions.length === 0 ? (
        <p>No upcoming active sessions available. Create a session first to add candidates.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="sessionId">Select Session:</label>
            <select
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
            >
              <option value="">-- Select a session --</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.description} (Starts: {session.startTime.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="candidateName">Candidate Name:</label>
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || sessions.length === 0}
          >
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </form>
      )}
    </div>
  );
};