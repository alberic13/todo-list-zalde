import React from "react";
import { TaskChatMessage } from "../../../types";
import { MessageSquare } from "lucide-react";

export interface TaskDiscussionMessageListProps {
  taskMessages: TaskChatMessage[];
  isLoading: boolean;
  currentUserId?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const TaskDiscussionMessageList: React.FC<TaskDiscussionMessageListProps> = ({
  taskMessages,
  isLoading,
  currentUserId,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
      {taskMessages.length === 0 && !isLoading ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
          <div className="w-10 h-10 rounded-2xl bg-white/60 border border-white flex items-center justify-center mb-2 shadow-xs">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-xs font-bold text-slate-700">Belum ada obrolan</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mulai percakapan dengan anggota tim kolaborator tugas ini!
          </p>
        </div>
      ) : (
        taskMessages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 text-xs leading-relaxed ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-[10px] uppercase">
                  {msg.user?.name?.charAt(0) || "U"}
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-3 shadow-xs ${
                  isMe
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-800"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-indigo-600 mb-1">
                    {msg.user?.name || "Kolaborator"}
                  </p>
                )}
                <div className="whitespace-pre-wrap break-words text-xs">
                  {msg.content || msg.message}
                </div>
                <p
                  className={`text-[9px] mt-1.5 text-right ${
                    isMe ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {isMe && (
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-[10px] uppercase">
                  {(msg.user?.name || "S").charAt(0)}
                </div>
              )}
            </div>
          );
        })
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
