import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  data?: any;
  action?: { action: string; params: Record<string, any>; status?: "pending" | "confirmed" | "cancelled" };
}

export default function Agent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getToken = () => localStorage.getItem("sonata_session_token") || "";

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: text, history: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const json = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: json.message || json.error || "Something went wrong.",
        data: json.data,
        action: json.action ? { ...json.action, status: "pending" } : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to reach the server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async (idx: number, confirm: boolean) => {
    setMessages(prev => {
      const copy = [...prev];
      if (copy[idx]?.action) copy[idx] = { ...copy[idx], action: { ...copy[idx].action!, status: confirm ? "confirmed" : "cancelled" } };
      return copy;
    });
    if (!confirm) return;

    const msg = messages[idx];
    if (!msg?.action) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: "__confirm_action__", action: msg.action, history: [] }),
      });
      const json = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: json.message || "Done!" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to execute action." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderData = (data: any) => {
    if (!data) return null;
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]).slice(0, 5);
      return (
        <div className="mt-2 overflow-x-auto rounded border border-neutral-700">
          <table className="w-full text-xs text-neutral-300">
            <thead><tr className="border-b border-neutral-700 bg-neutral-800">{keys.map(k => <th key={k} className="px-2 py-1 text-left font-medium">{k}</th>)}</tr></thead>
            <tbody>{data.slice(0, 10).map((row: any, i: number) => <tr key={i} className="border-b border-neutral-800">{keys.map(k => <td key={k} className="px-2 py-1">{String(row[k] ?? "")}</td>)}</tr>)}</tbody>
          </table>
          {data.length > 10 && <p className="px-2 py-1 text-xs text-neutral-500">...and {data.length - 10} more</p>}
        </div>
      );
    }
    if (typeof data === "object") {
      return (
        <div className="mt-2 rounded border border-neutral-700 bg-neutral-800 p-2 text-xs">
          {Object.entries(data).map(([k, v]) => <div key={k} className="flex justify-between py-0.5"><span className="text-neutral-400">{k}</span><span className="text-white font-medium">{String(v)}</span></div>)}
        </div>
      );
    }
    return null;
  };

  const renderAction = (action: ChatMessage["action"], idx: number) => {
    if (!action) return null;
    return (
      <Card className="mt-2 bg-neutral-800 border-neutral-600 p-3">
        <p className="text-xs text-neutral-400 mb-1">Proposed action: <span className="text-amber-400 font-mono">{action.action}</span></p>
        <pre className="text-xs text-neutral-300 mb-2 overflow-x-auto">{JSON.stringify(action.params, null, 2)}</pre>
        {action.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => confirmAction(idx, true)}>
              <CheckCircle className="h-3 w-3 mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="ghost" className="text-neutral-400 text-xs" onClick={() => confirmAction(idx, false)}>
              <XCircle className="h-3 w-3 mr-1" /> Cancel
            </Button>
          </div>
        ) : (
          <p className={`text-xs ${action.status === "confirmed" ? "text-emerald-400" : "text-neutral-500"}`}>
            {action.status === "confirmed" ? "✓ Confirmed & executed" : "✗ Cancelled"}
          </p>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-semibold text-white">Sonata Agent</h1>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">Ask me about your finances or tell me to make changes</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <Bot className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Ask me anything about your finances</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["What's my net worth?", "Show my investments", "Update rent to $4,500"].map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${msg.role === "user" ? "bg-neutral-950 text-white" : "bg-neutral-800 text-neutral-200"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {renderData(msg.data)}
                {renderAction(msg.action, i)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-800 rounded-xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-neutral-800">
        <div className="max-w-2xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about your finances..."
            rows={1}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon" className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
