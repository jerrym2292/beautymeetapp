"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  services: { 
    id: string; 
    name: string; 
    durationMin: number; 
    priceCents: number; 
    category: string;
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

  const [submitStatus, setSubmitStatus] = useState<"idle"|"submitting"|"success"|"error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

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

          {submitStatus === 'success' ? (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.35)" }}>
              Booking request sent. You’ll get an SMS when it’s approved or declined.
            </div>
          ) : (
            <form onSubmit={submit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
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
                <input value={startAt} onChange={(e)=>setStartAt(e.target.value)} required style={input} placeholder="YYYY-MM-DD HH:MM" />
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
