import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminTestingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Admin — Testing</h1>
        <p style={{ opacity: 0.85 }}>Forbidden.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/admin" style={{ color: "#D4AF37" }}>
        ← Back to Admin
      </Link>
      <h1 style={{ marginTop: 12 }}>Testing Tools</h1>
      <p style={{ opacity: 0.8, maxWidth: 760, lineHeight: 1.6 }}>
        These tools help you seed demo data and run a quick smoke test in <b>staging</b>.
        They are intentionally blocked on production.
      </p>

      <div style={{ display: "grid", gap: 14, marginTop: 18, maxWidth: 760 }}>
        <TestCard
          title="Seed E2E Provider + Service"
          desc="Creates a verified test provider and at least one active service. Safe to run multiple times."
          actionLabel="Run Seed"
          endpoint="/api/admin/e2e/seed"
        />

        <TestCard
          title="Full Smoke Test (No Stripe)"
          desc="Creates provider + customer + booking, and returns links to click through tech/customer/admin flows."
          actionLabel="Run Smoke Test"
          endpoint="/api/admin/testing/smoke"
        />
      </div>

      <p style={{ opacity: 0.6, marginTop: 18, fontSize: 13 }}>
        Tip: open DevTools console/network while clicking through the returned links.
      </p>

      <ClientScript />
    </main>
  );
}

function TestCard({
  title,
  desc,
  actionLabel,
  endpoint,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  endpoint: string;
}) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
      <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.5 }}>{desc}</div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button data-endpoint={endpoint} style={btn}>
          {actionLabel}
        </button>
        <code style={code}>{endpoint}</code>
      </div>

      <pre style={out} data-output-for={endpoint} />
    </div>
  );
}

function ClientScript() {
  // Inline script so we don't have to add a whole client component tree.
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  async function run(endpoint){
    const pre = document.querySelector('pre[data-output-for="' + endpoint + '"]');
    if(pre) pre.textContent = 'Running...';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const text = await res.text();
      if(pre) pre.textContent = 'HTTP ' + res.status + '\n' + text;
    } catch (e) {
      if(pre) pre.textContent = 'Error: ' + (e && e.message ? e.message : String(e));
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('button[data-endpoint]') : null;
    if(!btn) return;
    const endpoint = btn.getAttribute('data-endpoint');
    if(endpoint) run(endpoint);
  });
})();
        `,
      }}
    />
  );
}

const card: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

const btn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.45)",
  background: "rgba(212,175,55,0.15)",
  color: "#D4AF37",
  fontWeight: 900,
  cursor: "pointer",
};

const code: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.35)",
  color: "rgba(255,255,255,0.8)",
  fontSize: 12,
};

const out: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.85)",
  fontSize: 12,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
};
