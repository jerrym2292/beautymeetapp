"use client";

import { useState } from "react";
import Link from "next/link";

export default function TechApplyPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");

  // Hidden from public
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/apply/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || "Upload failed");
    return j?.url as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const licenseUrl = licenseFile ? await uploadOne(licenseFile) : null;
      const idUrl = idFile ? await uploadOne(idFile) : null;

      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email: email || null,
          dob: dob || null,
          licenseNumber: licenseNumber || null,
          licenseState: licenseState.toUpperCase() || null,
          licenseUrl,
          idUrl,
          address1,
          address2: address2 || null,
          city,
          state: state.toUpperCase(),
          zip,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (err: any) {
      setError(String(err?.message || err));
      setStatus("error");
    }
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
          Application submitted. You’ll get an SMS when approved.
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

          <Field label="Date of Birth">
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              style={inputStyle}
            />
          </Field>

          <div style={{ marginTop: 16, fontWeight: 800 }}>
            Licensing
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            We use this to verify your cosmetology/nail technician license.
          </div>

          <Field label="License Number">
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. CO0123456"
            />
          </Field>

          <Field label="License State">
            <input
              value={licenseState}
              onChange={(e) => setLicenseState(e.target.value)}
              required
              style={inputStyle}
              placeholder="GA"
              maxLength={2}
            />
          </Field>

          <div style={{ marginTop: 16, fontWeight: 800 }}>Uploads (recommended)</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Upload a clear photo/PDF of your license and a government-issued ID.
          </div>

          <Field label="License upload (photo/PDF)">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </Field>

          <Field label="ID upload (photo/PDF)">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </Field>

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
