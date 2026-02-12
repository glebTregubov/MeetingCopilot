export enum MessageType {
  USER = 'USER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM'
}

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'You' | 'Attendee' | 'Agent';
  text: string;
  isFinal: boolean;
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  status: 'pending' | 'done';
}

export interface Decision {
  id: string;
  text: string;
}

export interface Risk {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export interface MeetingState {
  summary: string;
  actions: ActionItem[];
  decisions: Decision[];
  risks: Risk[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
