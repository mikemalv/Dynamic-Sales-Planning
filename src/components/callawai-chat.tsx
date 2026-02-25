"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Send, Sparkles, MessageSquare, Loader2, Bot, Maximize2, Minimize2, Database } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  data?: {
    sql?: string;
    results?: Record<string, unknown>[];
    rowCount?: number;
  };
}

type ChatMode = "ai" | "data";

const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "llama3.1-70b", name: "Llama 3.1 70B", provider: "Meta" },
  { id: "llama3.1-8b", name: "Llama 3.1 8B", provider: "Meta" },
  { id: "mistral-large2", name: "Mistral Large 2", provider: "Mistral" },
  { id: "snowflake-llama-3.3-70b", name: "Snowflake Llama 3.3", provider: "Snowflake" },
];

const SYSTEM_PROMPT = `You are CallawAI, a helpful AI assistant. You can answer any general questions the user has.

You also have special knowledge about Callaway Golf's Sales Planning data in Snowflake (LANDING_CO.FLATFILES):
- DYNAMIC_PLANNING_SALES_FORECAST - Sales forecasts by product, region, and time period
- DYNAMIC_PLANNING_INVENTORY - Current inventory levels and stock data
- DYNAMIC_PLANNING_RETAILER - Retailer performance and distribution data
- DYNAMIC_PLANNING_SALES_INVOICE - Historical sales invoice data
- DYNAMIC_PLANNING_IRON_SHARE_GTD - Iron market share data with manufacturers, models, unit sales, and market share percentages

When users ask about Callaway data, provide helpful insights and suggest using the "Data Q&A" mode for actual queries. For general questions, answer helpfully like any AI assistant would.`;

function DataResultsTable({ results }: { results: Record<string, unknown>[] }) {
  if (!results || results.length === 0) return null;
  
  const columns = Object.keys(results[0]);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="border border-border px-2 py-1 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.slice(0, 10).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
              {columns.map((col) => (
                <td key={col} className="border border-border px-2 py-1 truncate max-w-[150px]" title={String(row[col] ?? "")}>
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {results.length > 10 && (
        <p className="text-xs text-muted-foreground mt-1">Showing 10 of {results.length} rows</p>
      )}
    </div>
  );
}

export function CallawAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("data");
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      if (mode === "data") {
        const response = await fetch("/api/nlq-to-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userMessage, model: selectedModel }),
        });
        const data = await response.json();
        if (data.error) {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `❌ ${data.error}`,
            data: data.sql ? { sql: data.sql } : undefined
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "",
            data: {
              sql: data.sql,
              results: data.results,
              rowCount: data.rowCount
            }
          }]);
        }
      } else {
        const apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
            .filter(m => m.content && m.content.trim() !== "")
            .map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage }
        ];

        const response = await fetch("/api/cortex-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, model: selectedModel }),
        });
        
        const data = await response.json();
        if (data.error) {
          setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: data.content || "No response received." }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${(error as Error).message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const hasDataResults = message.data?.results && message.data.results.length > 0;
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-green-600 text-white"
              : "bg-muted"
          }`}
        >
          {hasDataResults ? (
            <div className="space-y-3">
              {message.data?.sql && (
                <div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                    <Database className="h-3 w-3" />
                    SQL Query
                  </div>
                  <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto font-mono">
                    {message.data.sql}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Results ({message.data?.rowCount} rows)
                </div>
                <DataResultsTable results={message.data?.results || []} />
              </div>
            </div>
          ) : message.data?.sql ? (
            <div className="space-y-2">
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <Database className="h-3 w-3" />
                  Generated SQL
                </div>
                <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto font-mono">
                  {message.data.sql}
                </pre>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 z-50"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className={`fixed shadow-2xl z-50 flex flex-col border-green-600/20 transition-all duration-300 ${
          isExpanded 
            ? "bottom-4 right-4 w-[50vw] top-4 h-auto" 
            : "bottom-6 right-6 w-[500px] h-[600px]"
        }`}>
          <CardHeader className="pb-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <CardTitle className="text-lg">CallawAI</CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-white/20 text-white">
                  {mode === "ai" ? "REST API" : "SQL"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 w-7 hover:bg-white/10"
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex bg-white/10 rounded-md p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("ai")}
                  className={`h-7 px-3 text-xs rounded-sm ${mode === "ai" ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                >
                  <Bot className="h-3 w-3 mr-1" />
                  AI Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("data")}
                  className={`h-7 px-3 text-xs rounded-sm ${mode === "data" ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Data Q&A
                </Button>
              </div>
              {mode === "ai" && (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-7 w-[130px] text-xs bg-white/10 border-0 text-white hover:bg-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-xs">
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {mode === "data" && (
              <Badge variant="secondary" className="mt-1 text-xs bg-white/20 text-white w-fit">
                Ask questions in plain English
              </Badge>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-4 h-full">
              <div ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-6">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">Welcome to CallawAI!</p>
                  <p className="mt-1 text-xs">
                    {mode === "ai" 
                      ? `Using ${currentModel?.name} via Cortex REST API`
                      : "Ask data questions in plain English"
                    }
                  </p>
                  {mode === "ai" && (
                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("What's Callaway's current iron market share?")}
                      >
                        📊 What&apos;s Callaway&apos;s iron market share?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("Show me the top selling iron models")}
                      >
                        🏌️ Top selling iron models
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("How is Paradym Ai Smoke performing?")}
                      >
                        🔥 Paradym Ai Smoke performance
                      </Button>
                    </div>
                  )}
                  {mode === "data" && (
                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("Show me the top 10 manufacturers by unit sales")}
                      >
                        📊 Top 10 manufacturers by sales
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("What is Callaway's market share compared to competitors?")}
                      >
                        🏌️ Callaway vs competitors
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full justify-start"
                        onClick={() => setInput("List all iron models with market share above 5%")}
                      >
                        🔥 High market share models
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {messages.map((message, i) => renderMessage(message, i))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === "data" ? "Ask a question about your data..." : `Ask ${currentModel?.name}...`}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
