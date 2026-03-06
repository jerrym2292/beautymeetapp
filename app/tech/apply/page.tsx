"use client";

import { useState } from "react";
import Link from "next/link";

export default function TechApplyPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Categories + license details
  const [catNails, setCatNails] = useState(false);
  const [catLashes, setCatLashes] = useState(false);
  const [catHair, setCatHair] = useState(false);

  const [nailsLicenseState, setNailsLicenseState] = useState("");
  const [nailsLicenseNumber, setNailsLicenseNumber] = useState("");

  const [lashesLicenseState, setLashesLicenseState] = useState("");
  const [lashesLicenseNumber, setLashesLicenseNumber] = useState("");

  const [hairLicenseState, setHairLicenseState] = useState("");
  const [hairLicenseNumber, setHairLicenseNumber] = useState("");

  const [verificationResult, setVerificationResult] = useState<any[] | null>(
    null
  );

  // Hidden from public
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    setVerificationResult(null);

    const appliedCategories: Array<"NAILS" | "LASHES_BROWS" | "HAIR"> = [];
    const categoryLicenses: Array<{
      category: "NAILS" | "LASHES_BROWS" | "HAIR";
      licenseState: string;
      licenseNumber: string;
    }> = [];

    if (catNails) {
      appliedCategories.push("NAILS");
      categoryLicenses.push({
        category: "NAILS",
        licenseState: nailsLicenseState.toUpperCase(),
        licenseNumber: nailsLicenseNumber,
      });
    }
    if (catLashes) {
      appliedCategories.push("LASHES_BROWS");
      categoryLicenses.push({
        category: "LASHES_BROWS",
        licenseState: lashesLicenseState.toUpperCase(),
        licenseNumber: lashesLicenseNumber,
      });
    }
    if (catHair) {
      appliedCategories.push("HAIR");
      categoryLicenses.push({
        category: "HAIR",
        licenseState: hairLicenseState.toUpperCase(),
        licenseNumber: hairLicenseNumber,
      });
    }

    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email: email || null,
        appliedCategories,
        categoryLicenses,
        address1,
        address2: address2 || null,
        city,
        state: state.toUpperCase(),
        zip,
      }),
    });

    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(j?.error || "Something went wrong.");
      setStatus("error");
      return;
    }

    if (Array.isArray(j?.verification)) setVerificationResult(j.verification);
    setStatus("success");
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>

      <h1 style={{ marginTop: 12 }}>Apply to Beauty Meet</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.4 }}>
        Anyone can apply. We’ll review and approve providers to keep the
        marketplace clean.
      </p>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.35 }}>
        License auto-lookup is currently <b>NY only</b> (more states next). If we
        can’t verify automatically, you can still submit—admin will review.
      </div>

      {status === "success" ? (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.35)",
          }}
        >
          <div>Application submitted. You’ll get an SMS when approved.</div>
          {verificationResult ? (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                License auto-check results
              </div>
              {verificationResult.map((r, idx) => (
                <div key={idx} style={{ marginTop: 6 }}>
                  <b>{r.category}</b>: {r.state} {r.licenseNumber} —{" "}
                  {r.valid ? "VERIFIED" : "NEEDS MANUAL"}
                  {r.providerName ? ` (${r.providerName})` : ""}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputStyle}
              placeholder="Jane Doe"
            />
          </Field>

          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={inputStyle}
              placeholder="(404) 555-1234"
            />
          </Field>

          <Field label="Email (optional)">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="jane@example.com"
            />
          </Field>

          <div style={{ marginTop: 18, fontWeight: 800 }}>What are you licensed for?</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Pick all that apply. Enter the license state + number for each.
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <input type="checkbox" checked={catNails} onChange={(e) => setCatNails(e.target.checked)} />
            <span>NAILS</span>
          </label>
          {catNails ? (
            <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
              <Field label="Nails license state (2 letters)">
                <input value={nailsLicenseState} onChange={(e)=>setNailsLicenseState(e.target.value)} required style={inputStyle} placeholder="NY" maxLength={2} />
              </Field>
              <Field label="Nails license number">
                <input value={nailsLicenseNumber} onChange={(e)=>setNailsLicenseNumber(e.target.value)} required style={inputStyle} placeholder="123456" />
              </Field>
            </div>
          ) : null}

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <input type="checkbox" checked={catLashes} onChange={(e) => setCatLashes(e.target.checked)} />
            <span>LASHES / BROWS</span>
          </label>
          {catLashes ? (
            <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
              <Field label="Lashes/Brows license state (2 letters)">
                <input value={lashesLicenseState} onChange={(e)=>setLashesLicenseState(e.target.value)} required style={inputStyle} placeholder="NY" maxLength={2} />
              </Field>
              <Field label="Lashes/Brows license number">
                <input value={lashesLicenseNumber} onChange={(e)=>setLashesLicenseNumber(e.target.value)} required style={inputStyle} placeholder="123456" />
              </Field>
            </div>
          ) : null}

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <input type="checkbox" checked={catHair} onChange={(e) => setCatHair(e.target.checked)} />
            <span>HAIR</span>
          </label>
          {catHair ? (
            <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
              <Field label="Hair license state (2 letters)">
                <input value={hairLicenseState} onChange={(e)=>setHairLicenseState(e.target.value)} required style={inputStyle} placeholder="NY" maxLength={2} />
              </Field>
              <Field label="Hair license number">
                <input value={hairLicenseNumber} onChange={(e)=>setHairLicenseNumber(e.target.value)} required style={inputStyle} placeholder="123456" />
              </Field>
            </div>
          ) : null}

          <div style={{ marginTop: 16, fontWeight: 800 }}>
            Address (hidden from public)
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            We store this privately for service area + travel fee estimates.
          </div>

          <Field label="Address line 1">
            <input
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              required
              style={inputStyle}
              placeholder="123 Peach St"
            />
          </Field>

          <Field label="Address line 2 (optional)">
            <input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              style={inputStyle}
              placeholder="Suite / Apt"
            />
          </Field>

          <Field label="City">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              style={inputStyle}
              placeholder="Atlanta"
            />
          </Field>

          <Field label="State (2 letters)">
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              style={inputStyle}
              placeholder="GA"
              maxLength={2}
            />
          </Field>

          <Field label="ZIP">
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              required
              style={inputStyle}
              placeholder="30303"
            />
          </Field>

          {status === "error" && error ? (
            <div style={{ color: "#fecaca", marginTop: 8 }}>{error}</div>
          ) : null}

          <button
            disabled={status === "submitting"}
            style={buttonStyle}
            type="submit"
          >
            {status === "submitting" ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginTop: 12 }}>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#f5f5f7",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  marginTop: 16,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(212,175,55,0.4)",
  background: "rgba(212,175,55,0.18)",
  color: "#eef2ff",
  fontWeight: 700,
  width: "100%",
};
