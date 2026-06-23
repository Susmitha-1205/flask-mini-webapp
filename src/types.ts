export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Work' | 'Personal' | 'Ideas';
  created_at: string;
}

export interface CodeFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'server' | 'request' | 'db';
  message: string;
}
