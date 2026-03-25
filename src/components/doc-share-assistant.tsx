
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export const DocShareAssistant = () => {
  const [messages, setMessages] = React.useState([
    { from: "ai", text: "Hello! How can I help you find a document or template today?" },
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/docShareFlow", {
        method: "POST",
        body: JSON.stringify({ input }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      
      setMessages(prev => [...prev, { from: "ai", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedText += decoder.decode(value, { stream: true });
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.from === 'ai') {
                lastMessage.text = streamedText;
                return [...prev.slice(0, -1), lastMessage];
            }
            return prev;
        });
      }
    } catch (error) {
      console.error("Error calling AI flow:", error);
      setMessages(prev => [...prev, { from: "ai", text: "Sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Chat with our Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto pr-4 space-y-4 mb-4 border-b pb-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.from === "ai" ? "justify-start" : "justify-end"}`}>
              <div className={`rounded-lg px-4 py-2 ${msg.from === "ai" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1].from === 'user' && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-muted animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Ask about our document library..." 
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Send <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
