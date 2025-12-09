import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message, User } from "@shared/schema";

interface ChatPanelProps {
  messages: Message[];
  currentUser: User;
  otherUser?: { id: string; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null };
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

export function ChatPanel({ messages, currentUser, otherUser, onSendMessage, isLoading }: ChatPanelProps) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      <div className="px-4 py-3 border-b flex items-center gap-3">
        {otherUser && (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(otherUser.firstName, otherUser.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {otherUser.firstName} {otherUser.lastName}
              </p>
              <p className="text-xs text-muted-foreground">Project Chat</p>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-attach-file">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[44px] max-h-[120px] resize-none"
          data-testid="input-chat-message"
        />
        <Button 
          onClick={handleSend} 
          disabled={!messageText.trim() || isLoading}
          className="shrink-0"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
