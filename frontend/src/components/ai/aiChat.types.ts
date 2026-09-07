import { Task } from "../../types";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  referencedTasks?: Task[];
}

export interface AiChatTabProps {
  onOpenTaskModal?: (task: Task) => void;
  clearTrigger?: number;
}
