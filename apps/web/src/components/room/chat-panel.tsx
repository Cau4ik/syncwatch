"use client";

import { SendHorizonal, Smile } from "lucide-react";
import type { ChatMessage } from "@syncwatch/shared";
import { useState } from "react";

const EMOJIS = ["😀", "😂", "😍", "🔥", "👏", "😮", "😭", "👍"];

export function ChatPanel({
  messages,
  onSend,
  disabled
}: {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="text-xl font-semibold text-white">Chat</div>
        <div className="text-sm text-mist">System events and live discussion in one room feed.</div>
      </div>

      <div className="max-h-[470px] space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-sm font-semibold text-white">
              {message.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="font-medium text-white">{message.authorName}</div>
                <div className="text-xs text-mist">{message.createdAt}</div>
              </div>
              <div
                className={
                  message.type === "system"
                    ? "rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
                    : "rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-white/90"
                }
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 px-5 py-4">
        {pickerOpen ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setText((current) => `${current}${emoji}`);
                  setPickerOpen(false);
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] p-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!text.trim()) {
              return;
            }

            try {
              await onSend(text);
              setText("");
            } catch {}
          }}
        >
          <button
            type="button"
            onClick={() => setPickerOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-mist"
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message..."
            disabled={disabled}
            className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-mist"
          />
          <button
            type="submit"
            disabled={disabled}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#ffe1af] via-[#ffb67d] to-[#ff6d6d] text-slate-950 disabled:opacity-50"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
