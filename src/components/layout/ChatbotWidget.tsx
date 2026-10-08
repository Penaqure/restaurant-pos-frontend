"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { fetchChatbotQuestions, askChatbot, PresetQuestion } from "@/services/chatbotService";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! Ask me about this shop's data — pick a question below or type your own.",
};

// Local-only history (nothing persisted) and no AI involved -- every answer
// is a plain SQL lookup scoped to this vendor, matched to the question by
// keyword. See services/chatbotService.js on the backend for the full list
// of what it can answer.
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<PresetQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatbotQuestions()
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) return;

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setSending(true);
    try {
      const answer = await askChatbot(question);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong answering that. Try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[32rem] w-80 max-w-[85vw] flex-col overflow-hidden rounded-xl border border-border bg-surface-card shadow-card sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Ask RestroDesk</p>
            <button
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-brand-600 text-white" : "bg-foreground/5 text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl bg-foreground/5 px-3 py-2 text-sm text-muted-foreground">
                  {"…"}
                </div>
              </div>
            )}
          </div>

          {questions.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-border px-3 py-2">
              {questions.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.label)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground/5 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a question..."
              rows={1}
              className="max-h-24 flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title="Ask RestroDesk"
        className="flex size-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop hover:bg-brand-700"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  );
}
