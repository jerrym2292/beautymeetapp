"use client";

import { useState } from "react";

type Question = {
  id: string;
  text: string;
  required: boolean;
  type: string;
};

export default function IntakeFormManager({ 
  token, 
  serviceId, 
  initialQuestions 
}: { 
  token: string; 
  serviceId: string; 
  initialQuestions: Question[] 
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("TEXT");
  const [loading, setLoading] = useState(false);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/provider/${token}/service/${serviceId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, type: newType, required: true }),
    });

    if (res.ok) {
      const j = await res.json();
      setQuestions([...questions, j.question]);
      setNewText("");
    }
    setLoading(false);
  }

  async function removeQuestion(id: string) {
    const res = await fetch(`/api/provider/${token}/service/${serviceId}/questions/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  }

  return (
    <div style={{ marginTop: 12, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Intake Questions</div>
      
      <div style={{ display: "grid", gap: 6 }}>
        {questions.map(q => (
          <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4 }}>
            <span>{q.text} <span style={{ opacity: 0.5 }}>({q.type})</span></span>
            <button onClick={() => removeQuestion(q.id)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>

      <form onSubmit={addQuestion} style={{ marginTop: 10, display: "flex", gap: 6 }}>
        <input 
          value={newText} 
          onChange={e => setNewText(e.target.value)} 
          placeholder="New question..." 
          style={{ flex: 1, fontSize: 12, padding: "4px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white" }}
        />
        <select value={newType} onChange={e => setNewType(e.target.value)} style={{ fontSize: 11, padding: "4px", borderRadius: 4, background: "#333", color: "white" }}>
          <option value="TEXT">Text</option>
          <option value="YES_NO">Yes/No</option>
        </select>
        <button disabled={loading} type="submit" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 4, background: "#D4AF37", color: "black", fontWeight: 700 }}>+</button>
      </form>
    </div>
  );
}
