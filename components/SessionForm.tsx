// components/SessionForm.tsx
"use client"
import React, { useState } from 'react';
import styles from '../styles/Forms.module.css';

interface SessionFormProps {
  onSubmit: (startTime: Date, endTime: Date, description: string) => Promise<void>;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit }) => {
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startTime || !endTime || !description) {
      alert("Please fill in all fields");
      return;
    }
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (startDate >= endDate) {
      alert("End time must be after start time");
      return;
    }
    
    if (startDate <= new Date()) {
      alert("Start time must be in the future");
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(startDate, endDate, description);
      // Reset form
      setStartTime('');
      setEndTime('');
      setDescription('');
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.formContainer}>
      <h3>Create New Voting Session</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="description"></label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Session Description:"
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="startTime"></label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="endTime"></label>
          <input
            type="datetime-local"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>
      </form>
    </div>
  );
};