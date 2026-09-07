export interface ChatWithRagResult {
  response: string;
  referencedTasks: any[];
}

export interface ScoredTaskItem {
  similarityScore?: number;
  category?: { id: string; name: string } | null;
  subtasks?: Array<{ id: string; title: string; isCompleted: boolean }>;
  [key: string]: any;
}
