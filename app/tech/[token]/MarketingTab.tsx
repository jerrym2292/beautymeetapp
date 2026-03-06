"use client";

import { useState } from "react";

export default function MarketingTab({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const sendBlast = async () => {
    if (!message || message.length < 10) {
      alert("Please enter a meaningful message.");
      return;
    }
    
    if (!confirm("This will send an SMS to ALL your past clients. Continue?")) return;

    setLoading(true);
    const res = await fetch(`/api/provider/${token}/marketing/blast`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message })
    });
    
    if (res.ok) {
      setStatus("success");
      setMessage("");
    } else {
      setStatus("error");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 10 }}>
      <section style={card}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>SMS Marketing Blast</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Send a text to all clients who have booked with you before. Great for filling last-minute cancellations!
        </div>

        <div style={{ marginTop: 15 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi everyone! I just had a cancellation for tomorrow at 2 PM. Use my link to book! /p/your-id"
            style={textarea}
          />
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, textAlign: "right" }}>
            {message.length} characters
          </div>
        </div>

        {status === "success" && (
          <div style={{ color: "#86efac", fontSize: 13, marginTop: 10, padding: 8, background: "rgba(34,197,94,0.1)", borderRadius: 8 }}>
            Blast sent successfully!
          </div>
        )}

        <button 
          onClick={sendBlast} 
          disabled={loading || !message} 
          style={{ ...btn, marginTop: 15 }}
        >
          {loading ? "Sending..." : "Send SMS Blast"}
        </button>
      </section>
    </div>
  );
}

const card = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const textarea = {
  width: "100%",
  minHeight: "100px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  resize: "vertical" as const
};

const btn = {
  padding: "12px",
  borderRadius: "10px",
  background: "#D4AF37",
  color: "black",
  fontWeight: "bold" as const,
  border: "none",
  cursor: "pointer",
  width: "100%"
};
