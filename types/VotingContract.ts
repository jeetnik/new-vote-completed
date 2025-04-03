import { BaseContract, TransactionResponse } from 'ethers';

export interface VotingContract extends BaseContract {
  // Add an index signature to satisfy Ethers.js Contract type
  [key: string]: any;

  // Admin Methods
  createVotingSession: (startTime: number, endTime: number, description: string) => Promise<TransactionResponse>;
  setWhitelistRequired: (required: boolean) => Promise<TransactionResponse>;
  setSessionStatus: (sessionId: number, isActive: boolean) => Promise<TransactionResponse>;

  // Candidate Management
  addCandidate: (sessionId: number, name: string) => Promise<TransactionResponse>;
  getCandidatesCount: (sessionId: number) => Promise<number>;
  getCandidate: (sessionId: number, candidateId: number) => Promise<{ id: number; name: string; voteCount: number }>;

  // Session Management
  sessionsCount: () => Promise<number>;
  getSessionDetails: (sessionId: number) => Promise<{
    id: number;
    startTime: number;
    endTime: number;
    isActive: boolean;
    description: string;
  }>;

  // Whitelist Management
  whitelistRequired: () => Promise<boolean>;
  addVoterToWhitelist: (voter: string) => Promise<TransactionResponse>;
  addMultipleVotersToWhitelist: (voters: string[]) => Promise<TransactionResponse>;
  removeVoterFromWhitelist: (voter: string) => Promise<TransactionResponse>;
}
