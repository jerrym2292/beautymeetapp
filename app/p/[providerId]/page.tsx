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
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
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
  const [referralCode, setReferralCode] = useState("");
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
        referralCode: referralCode.trim() || null,
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

          {(provider.bio || provider.instagram || provider.facebook || provider.tiktok) ? (
            <section style={{ marginTop: 14, ...card }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>About</div>
              {provider.bio ? (
                <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                  {provider.bio}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                {provider.instagram ? (
                  <a href={normalizeUrl(provider.instagram)} target="_blank" rel="noreferrer" style={socialLink}>
                    Instagram
                  </a>
                ) : null}
                {provider.facebook ? (
                  <a href={normalizeUrl(provider.facebook)} target="_blank" rel="noreferrer" style={socialLink}>
                    Facebook
                  </a>
                ) : null}
                {provider.tiktok ? (
                  <a href={normalizeUrl(provider.tiktok)} target="_blank" rel="noreferrer" style={socialLink}>
                    TikTok
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

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

              <Field label="Referral code (optional)">
                <input value={referralCode} onChange={(e)=>setReferralCode(e.target.value)} style={input} placeholder="Friend's code" />
              </Field>

              <Field label="Notes (optional)">
                <input value={notes} onChange={(e)=>setNotes(e.target.value)} style={input} />
              </Field>

              {selectedService ? (
                <div style={{ padding: 12, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 20 }}>🛡️</div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 800, color: "#4ade80", marginBottom: 2 }}>Secure Escrow Protection</div>
                    You pay a <b>25% deposit</b> to secure your appointment. The remaining balance is only charged once the service is confirmed as completed.
                  </div>
                </div>
              ) : null}

              {selectedService ? (
                <div style={{ opacity: 0.85, fontSize: 12, lineHeight: 1.35, padding: "0 4px" }}>
                  Security deposit is <b>25%</b>. Platform fee is <b>5%</b>. Travel fee (if mobile) is <b>$1/mile</b> (ZIP estimate).
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

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const socialLink: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.35)",
  background: "rgba(212,175,55,0.12)",
  color: "#D4AF37",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 13,
};

function normalizeUrl(v: string) {
  const s = (v || "").trim();
  if (!s) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // If they paste a handle like @name, strip @ and treat as https.
  const cleaned = s.startsWith("@");
  return `https://${(cleaned ? s.slice(1) : s)}`;
}

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 800,
  width: "100%",
};
