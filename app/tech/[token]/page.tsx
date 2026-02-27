import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IntakeFormManager from "./IntakeFormManager";
import ModeToggle from "./ModeToggle";
import ConfirmForm from "./ConfirmForm";

export const dynamic = "force-dynamic";

export default async function TechDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const provider = await prisma.provider.findUnique({
    where: { accessToken: token },
    include: {
      services: { 
        orderBy: { createdAt: "desc" },
        include: { questions: true }
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { customer: true, service: true, intakeAnswers: { include: { question: true } } },
        take: 25,
      },
    },
  });

  if (!provider) {
    return (
      <main>
        <Link href="/" style={{ color: "#D4AF37" }}>
          ← Home
        </Link>
        <h1 style={{ marginTop: 12 }}>Tech dashboard</h1>
        <p style={{ opacity: 0.85 }}>Invalid link.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/" style={{ color: "#D4AF37" }}>
        ← Home
      </Link>
      <h1 style={{ marginTop: 12 }}>Tech dashboard</h1>
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        Provider: <b>{provider.displayName}</b>
      </div>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Service Mode</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Choose how you want to work (Studio, Mobile, or Both). 
          Travel is charged at $1/mile.
        </div>
        <ModeToggle token={token} initialMode={provider.mode} />
      </section>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Work Mode</div>
        <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
          Current: <b>{provider.mode === "BOTH" ? "In-Studio & Mobile" : provider.mode === "MOBILE" ? "Mobile Only" : "In-Studio Only"}</b>
        </div>
        <form action={`/api/provider/${provider.accessToken}/mode`} method="post" style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <select name="mode" defaultValue={provider.mode} style={{ ...input, flex: 1 }}>
            <option value="FIXED">In-Studio Only</option>
            <option value="MOBILE">Mobile Only</option>
            <option value="BOTH">In-Studio & Mobile</option>
          </select>
          <button style={{ ...btn, width: "auto" }} type="submit">Update</button>
        </form>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          This determines if customers see the mobile booking option.
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Payments (Stripe)</div>
        <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>
          Status: {provider.stripeAccountId ? (
            <>
              connected • charges {provider.stripeChargesEnabled ? "enabled" : "pending"} • payouts {provider.stripePayoutsEnabled ? "enabled" : "pending"}
            </>
          ) : (
            <>not connected</>
          )}
        </div>
        <form action={`/api/provider/${provider.accessToken}/stripe/onboard`} method="post" style={{ marginTop: 10 }}>
          <button style={btn} type="submit">
            {provider.stripeAccountId ? "Continue Stripe onboarding" : "Connect Stripe (Express)"}
          </button>
        </form>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          You must complete Stripe onboarding before customers can pay.
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Public booking link</div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>
          <a style={{ color: "#D4AF37" }} href={`/p/${provider.id}`}>
            /p/{provider.id}
          </a>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Customers can request appointments here.
        </div>
      </section>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800 }}>Services</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Add lashes/brows + nail services with durations and prices.
            </div>
          </div>
          <form action={`/api/provider/${provider.accessToken}/service`} method="post">
            <button style={btn} type="submit" name="quick" value="1">
              + Quick add templates
            </button>
          </form>
        </div>

        <form
          action={`/api/provider/${provider.accessToken}/service`}
          method="post"
          style={{ display: "grid", gap: 10, marginTop: 12 }}
        >
          <input name="name" required placeholder="Service name" style={input} />
          <select name="category" required style={input as any} defaultValue="LASHES_BROWS">
            <option value="LASHES_BROWS">Lashes/Brows</option>
            <option value="NAILS">Nails</option>
          </select>
          <input
            name="durationMin"
            required
            placeholder="Duration (minutes)"
            style={input}
            inputMode="numeric"
          />
          <input
            name="price"
            required
            placeholder="Price (e.g. 120)"
            style={input}
            inputMode="decimal"
          />
          <button style={btn} type="submit">
            Add service
          </button>
        </form>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {provider.services.map((s) => (
            <div key={s.id} style={{ ...card, marginTop: 0 }}>
              <div style={{ fontWeight: 800 }}>{s.name}</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                {s.category} • {s.durationMin} min • ${(s.priceCents / 100).toFixed(2)}
              </div>
              
              <IntakeFormManager token={token} serviceId={s.id} initialQuestions={s.questions} />

              <form
                action={`/api/provider/${provider.accessToken}/service/${s.id}/toggle`}
                method="post"
                style={{ marginTop: 8 }}
              >
                <button style={btn} type="submit">
                  {s.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <div style={{ fontWeight: 800 }}>Recent booking requests</div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {provider.bookings.map((b) => (
            <div key={b.id} style={{ ...card, marginTop: 0 }}>
              <div style={{ fontWeight: 800 }}>
                {b.customer.fullName} — {b.service.name}
              </div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                {new Date(b.startAt).toLocaleString()} • {b.isMobile ? "Mobile" : "In-studio"}
              </div>
              
              {/* Show Intake Answers */}
              {b.intakeAnswers.length > 0 && (
                <div style={{ marginTop: 8, padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Intake Answers:</div>
                  {b.intakeAnswers.map(ans => (
                    <div key={ans.id} style={{ fontSize: 12, marginBottom: 2 }}>
                      <b>{ans.question.text}:</b> {ans.text}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                Status: <b>{b.status}</b>
              </div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                Total: ${(b.totalCents / 100).toFixed(2)} (deposit hold ${(b.depositCents / 100).toFixed(2)} • platform fee ${(b.platformFeeCents / 100).toFixed(2)} • travel ${(b.travelFeeCents / 100).toFixed(2)})
              </div>

              {b.status === "PENDING" ? (
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <form action={`/api/provider/${provider.accessToken}/booking/${b.id}/approve`} method="post" style={{ flex: 1 }}>
                    <button style={btn} type="submit">
                      Approve
                    </button>
                  </form>
                  <ConfirmForm
                    action={`/api/provider/${provider.accessToken}/booking/${b.id}/decline`}
                    method="post"
                    confirmText="Are you sure you want to decline this customer? This will cancel the booking and refund the deposit."
                    style={{ flex: 1 }}
                  >
                    <button
                      style={{
                        ...btn,
                        borderColor: "rgba(248,113,113,0.5)",
                        background: "rgba(248,113,113,0.12)",
                      }}
                      type="submit"
                    >
                      Decline
                    </button>
                  </ConfirmForm>
                </div>
              ) : null}

              {b.status === "APPROVED" ? (
                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Customer completion link:</div>
                    <div style={{ marginTop: 6 }}>
                      <a style={{ color: "#D4AF37", fontSize: 13 }} href={`/c/${(b as any).customerConfirmToken}`}>
                        /c/{(b as any).customerConfirmToken}
                      </a>
                    </div>
                  </div>

                  <form action={`/api/provider/${provider.accessToken}/booking/${b.id}/done`} method="post">
                    <button style={btn} type="submit">Mark done (tech)</button>
                  </form>

                  <a
                    href={`/tech/${provider.accessToken}/booking/${b.id}/cancel`}
                    style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none" }}
                  >
                    Cancel / no-show (are you sure?)
                  </a>
                </div>
              ) : null}
            </div>
          ))}
          {provider.bookings.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No bookings yet.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
};

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
