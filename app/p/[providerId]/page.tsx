"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PortfolioMasonry from "./PortfolioMasonry";
import VisualCalendar from "./VisualCalendar";

type IntakeQuestion = {
  id: string;
  text: string;
  type: "TEXT" | "YES_NO";
  required: boolean;
};

type Provider = {
  id: string;
  displayName: string;
  mode: "FIXED" | "MOBILE" | "BOTH";
  maxTravelMiles: number | null;
  travelRateCents: number;
  portfolioUrlsJson: string | null;
  kitEquipmentJson: string | null; // Added
  instagram: string | null;
  services: { 
    id: string; 
    name: string; 
    durationMin: number; 
    priceCents: number; 
    category: string;
    prepInstructions: string | null; // Added
    questions: IntakeQuestion[];
  }[];
};

export default function ProviderBookingPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const [providerId, setProviderId] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await params;
      setProviderId(p.providerId);
    })();
  }, [params]);

  const [provider, setProvider] = useState<Provider | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerZip, setCustomerZip] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [notes, setNotes] = useState("");
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});

  const [submitStatus, setSubmitStatus] = useState<"idle"|"submitting"|"success"|"error"|"waitlist">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    if (!providerId) return;
    (async () => {
      const res = await fetch(`/api/providers/${providerId}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j?.error || "Provider not found");
        return;
      }
      setProvider(j.provider);
      if (j.provider?.services?.[0]?.id) setServiceId(j.provider.services[0].id);
    })();
  }, [providerId]);

  const selectedService = useMemo(() => provider?.services.find(s => s.id === serviceId) || null, [provider, serviceId]);

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !phone) {
      alert("Please enter your name and phone first.");
      return;
    }
    setSubmitStatus("submitting");
    const res = await fetch(`/api/waitlist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ providerId, fullName, phone, serviceId })
    });
    if (res.ok) setSubmitStatus("waitlist");
    else {
      setSubmitStatus("error");
      setSubmitError("Failed to join waitlist.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setSubmitError(null);

    const res = await fetch(`/api/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        providerId, 
        fullName, 
        phone, 
        customerZip, 
        serviceId, 
        startAt, 
        isMobile, 
        notes: notes || null,
        intakeAnswers: Object.entries(intakeAnswers).map(([questionId, text]) => ({ questionId, text }))
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSubmitStatus('error');
      setSubmitError(j?.error || 'Booking failed');
      return;
    }

    const url = j?.checkoutUrl as string | undefined;
    if (url) {
      window.location.href = url;
      return;
    }

    setSubmitStatus('success');
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>← Home</Link>

      {err ? (
        <div style={{ marginTop: 14, color: "#fecaca" }}>{err}</div>
      ) : null}

      {!provider ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>Loading…</div>
      ) : (
        <>
          <h1 style={{ marginTop: 12 }}>{provider.displayName}</h1>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            {provider.mode}{provider.maxTravelMiles ? ` • Mobile up to ${provider.maxTravelMiles} miles` : ""}
          </div>

          {provider.kitEquipmentJson && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                🧳 Mobile Suite Equipment
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {JSON.parse(provider.kitEquipmentJson).map((item: string, i: number) => (
                  <span key={i} style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <PortfolioMasonry photosJson={provider.portfolioUrlsJson} />

          {submitStatus === 'success' ? (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}>
              Booking request sent. You’ll get an SMS when it’s approved or declined.
            </div>
          ) : submitStatus === 'waitlist' ? (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}>
              You've been added to the waitlist! We'll notify you if an opening comes up.
            </div>
          ) : (
            <form onSubmit={submit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>Can't find a time that works?</div>
                <button type="button" onClick={joinWaitlist} style={{ ...btn, background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", fontSize: 12 }}>
                  ✨ Join the Priority Waitlist
                </button>
              </div>
              <Field label="Your name">
                <input value={fullName} onChange={(e)=>setFullName(e.target.value)} required style={input} />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(e)=>setPhone(e.target.value)} required style={input} />
              </Field>
              <Field label="Your ZIP">
                <input value={customerZip} onChange={(e)=>setCustomerZip(e.target.value)} required style={input} />
              </Field>
              <Field label="Service">
                <select value={serviceId} onChange={(e)=>setServiceId(e.target.value)} style={input as any}>
                  {provider.services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — ${(s.priceCents/100).toFixed(2)} ({s.durationMin}m)</option>
                  ))}
                </select>
              </Field>

              {/* Service Prep Instructions (Glamsquad-style) */}
              {selectedService?.prepInstructions && (
                <div style={{ padding: 12, background: "rgba(212,175,55,0.08)", border: "1px dashed rgba(212,175,55,0.4)", borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", marginBottom: 6 }}>✨ Service Prep Guide</div>
                  <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.4 }}>{selectedService.prepInstructions}</div>
                </div>
              )}

              {/* Dynamic Intake Questions */}
              {selectedService?.questions && selectedService.questions.length > 0 && (
                <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10, display: "grid", gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Service Questions</div>
                  {selectedService.questions.map(q => (
                    <Field key={q.id} label={q.text + (q.required ? " *" : "")}>
                      {q.type === "YES_NO" ? (
                        <select 
                          required={q.required} 
                          style={input as any}
                          value={intakeAnswers[q.id] || ""}
                          onChange={(e) => setIntakeAnswers({...intakeAnswers, [q.id]: e.target.value})}
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      ) : (
                        <input 
                          required={q.required} 
                          style={input} 
                          value={intakeAnswers[q.id] || ""}
                          onChange={(e) => setIntakeAnswers({...intakeAnswers, [q.id]: e.target.value})}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              )}

              <Field label="Requested date/time">
                <div style={{ display: "grid", gap: 12 }}>
                  <VisualCalendar 
                    selectedDate={startAt ? new Date(startAt) : undefined}
                    onSelect={(d) => {
                      const time = startAt.includes(" ") ? startAt.split(" ")[1] : "10:00";
                      setStartAt(`${d.toISOString().split('T')[0]} ${time}`);
                    }}
                  />
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input 
                      value={startAt} 
                      onChange={(e)=>setStartAt(e.target.value)} 
                      required 
                      style={input} 
                      placeholder="YYYY-MM-DD HH:MM" 
                    />
                    <div style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap" }}>or type manually</div>
                  </div>
                </div>
              </Field>

              <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="checkbox" checked={isMobile} onChange={(e)=>setIsMobile(e.target.checked)} />
                <span>Mobile appointment (adds $1/mile travel fee estimate)</span>
              </label>

              <Field label="Notes (optional)">
                <input value={notes} onChange={(e)=>setNotes(e.target.value)} style={input} />
              </Field>

              {selectedService ? (
                <div style={{ padding: 12, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 20 }}>🛡️</div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 800, color: "#4ade80", marginBottom: 2 }}>Secure Escrow Protection</div>
                    Your full payment is <b>authorized and held securely</b>. Funds are only released to the professional once the service is confirmed as completed.
                  </div>
                </div>
              ) : null}

              {selectedService ? (
                <div style={{ opacity: 0.85, fontSize: 12, lineHeight: 1.35, padding: "0 4px" }}>
                  Security deposit is <b>20%</b>. Platform fee is <b>5%</b>. Travel fee (if mobile) is <b>$1/mile</b> (ZIP estimate).
                </div>
              ) : null}

              {submitStatus === 'error' && submitError ? (
                <div style={{ color: '#fecaca' }}>{submitError}</div>
              ) : null}

              <button style={btn} disabled={submitStatus==='submitting'}>
                {submitStatus==='submitting' ? 'Sending…' : 'Request booking'}
              </button>
            </form>
          )}

          {submitStatus !== 'success' && (
            <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>Can't find a time that works?</div>
              <button 
                onClick={() => setShowWaitlist(!showWaitlist)}
                style={{ ...btn, background: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.3)', color: '#D4AF37', width: 'auto', padding: '8px 20px' }}
              >
                {showWaitlist ? "Close Waitlist" : "Join the Waitlist"}
              </button>

              {showWaitlist && (
                <form onSubmit={joinWaitlist} style={{ marginTop: 16, display: 'grid', gap: 12, textAlign: 'left', padding: 14, background: 'rgba(212,175,55,0.03)', borderRadius: 14, border: '1px dashed rgba(212,175,55,0.2)' }}>
                   <div style={{ fontWeight: 800, color: "#D4AF37", fontSize: 14 }}>Join the Elite Waitlist</div>
                   <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>We'll text you the second an opening appears.</div>
                   <Field label="Name">
                     <input value={fullName} onChange={(e)=>setFullName(e.target.value)} required style={input} />
                   </Field>
                   <Field label="Phone">
                     <input value={phone} onChange={(e)=>setPhone(e.target.value)} required style={input} />
                   </Field>
                   <button style={btn} type="submit" disabled={submitStatus==='submitting'}>
                     {submitStatus==='submitting' ? 'Joining...' : 'Get Notified'}
                   </button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Field({ label, children }: {label: string; children: React.ReactNode}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
