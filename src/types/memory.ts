export type MemoryCategory =
  | 'identity'
  | 'preference'
  | 'personal'
  | 'work'
  | 'health'
  | 'custom_instruction'
  | 'routine'
  | 'hardware'
  | 'contact_rule'
  | 'other';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence?: number; // 0 to 100
  source?: 'user_stated' | 'inferred' | 'system_default';
  updatedAt: string;
  createdAt?: string;
  rawPrompt?: string;
  pinned?: boolean;
}

export interface KotlinBridgeModule {
  id: string;
  title: string;
  description: string;
  kotlinSnippet: string;
  channelName: string;
  status: 'active' | 'synced' | 'ready';
}

export type TargetStatus = 'pending' | 'in_progress' | 'completed';

export interface UserTargetItem {
  id: string;
  title: string;
  status: TargetStatus;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  category?: 'work' | 'personal' | 'fitness' | 'learning' | 'daily' | 'other';
  progressPercent?: number;
}

export type MemoryTabType = 'memories' | 'qa_memory' | 'targets' | 'kotlin' | 'analytics';

