import Link from "next/link";
import { prisma } from "@/lib/prisma";
import IntakeFormManager from "./IntakeFormManager";
import ModeToggle from "./ModeToggle";
import DashboardTabs from "./DashboardTabs";
import PortfolioManager from "./PortfolioManager";
import TravelZoneManager from "./TravelZoneManager";
import ClientListTab from "./ClientListTab";
import MarketingTab from "./MarketingTab";
import EarningsTab from "./EarningsTab";
import CalendarTab from "./CalendarTab";

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

  // Group bookings by customer to build a client list
  const clientsMap = new Map();
  provider.bookings.forEach(b => {
    if (!clientsMap.has(b.customer.id)) {
      clientsMap.set(b.customer.id, {
        id: b.customer.id,
        fullName: b.customer.fullName,
        phone: b.customer.phone,
        email: b.customer.email,
        totalBookings: 0,
        lastBookingAt: b.startAt,
      });
    }
    const c = clientsMap.get(b.customer.id);
    c.totalBookings++;
    if (new Date(b.startAt) > new Date(c.lastBookingAt)) {
      c.lastBookingAt = b.startAt;
    }
  });
  const clientList = Array.from(clientsMap.values());

  return (
    <main style={mainContainer}>
      <Link href="/" style={{ color: "#D4AF37", textDecoration: "none", fontSize: 14 }}>
        ← Home
      </Link>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
        <div>
           <h1 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.02em" }}>Tech Dashboard</h1>
           <div style={{ color: "#D4AF37", fontWeight: 600, marginTop: 4, opacity: 0.9 }}>
             {provider.displayName}
           </div>
           <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
             <Link
               href={`/tech/${provider.accessToken}/availability`}
               style={{
                 fontSize: 12,
                 fontWeight: 900,
                 border: "1px solid rgba(212,175,55,0.35)",
                 background: "rgba(212,175,55,0.10)",
                 color: "#D4AF37",
                 padding: "8px 10px",
                 borderRadius: 14,
                 textDecoration: "none",
               }}
             >
               Availability →
             </Link>
           </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Subscription</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: provider.subscriptionActive ? "#4ade80" : "#fb7185" }}>
            {provider.subscriptionActive ? "ELITE ACTIVE" : "INACTIVE"}
          </div>
        </div>
      </div>

      <DashboardTabs 
        bookingsCount={provider.bookings.length} 
        servicesCount={provider.services.length}
      >
        {{
          calendar: (
            <CalendarTab
              bookings={(provider.bookings as any[]).map((b) => ({
                id: b.id,
                startAt: new Date(b.startAt).toISOString(),
                status: b.status,
                isMobile: b.isMobile,
                totalCents: b.totalCents,
                service: { name: b.service.name, durationMin: b.service.durationMin },
                customer: { fullName: b.customer.fullName },
              }))}
            />
          ),
          bookings: (
            <section style={glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Recent Activity</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{provider.bookings.length} Total</div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {provider.bookings.map((b) => (
                  <div key={b.id} style={itemCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{b.customer.fullName}</div>
                        <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 600 }}>{b.service.name}</div>
                      </div>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 900, 
                        background: b.isMobile ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                        color: b.isMobile ? "#D4AF37" : "rgba(255,255,255,0.6)",
                        padding: "4px 10px",
                        borderRadius: 20,
                        letterSpacing: "0.05em",
                        border: b.isMobile ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.1)"
                      }}>
                        {b.isMobile ? "🚗 MOBILE" : "🏠 STUDIO"}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", gap: 15, marginTop: 12, opacity: 0.8, fontSize: 12 }}>
                      <span>📅 {new Date(b.startAt).toLocaleDateString()}</span>
                      <span>⏰ {new Date(b.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                       <div style={{ fontSize: 13, fontWeight: 700 }}>
                         ${(b.totalCents / 100).toFixed(2)}
                       </div>
                       <div style={{ 
                         fontSize: 11, 
                         fontWeight: 800, 
                         color: b.status === "PENDING" ? "#F59E0B" : b.status === "APPROVED" ? "#10B981" : "#6B7280"
                       }}>
                         {b.status}
                       </div>
                    </div>

                    {b.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                        <form action={`/api/provider/${provider.accessToken}/booking/${b.id}/approve`} method="post" style={{ flex: 1 }}>
                          <button style={goldBtn} type="submit">Approve</button>
                        </form>
                        <form action={`/api/provider/${provider.accessToken}/booking/${b.id}/decline`} method="post" style={{ flex:  1 }}>
                          <button style={outlineBtn} type="submit">Decline</button>
                        </form>
                      </div>
                    ) : null}

                    {b.status === "APPROVED" ? (
                      <div style={{ marginTop: 15, display: "grid", gap: 10 }}>
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
                          Cancel / no-show
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
                {provider.bookings.length === 0 && (
                  <div style={{ opacity: 0.6, fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                    No bookings yet.
                  </div>
                )}
              </div>
            </section>
          ),
          clients: (
            <ClientListTab token={token} initialClients={clientList} />
          ),
          waitlist: (
            <section style={glassCard}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Elite Waitlist</div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ opacity: 0.6, fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                  Your waitlist is growing. High-demand artists use this to fill cancellations instantly.
                </div>
              </div>
            </section>
          ),
          earnings: (
            <EarningsTab bookings={provider.bookings as any} />
          ),
          services: (
            <section style={glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Services</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    Manage your elite lash and nail offerings.
                  </div>
                </div>
                <form action={`/api/provider/${provider.accessToken}/service`} method="post">
                  <button style={{ ...btn, width: "auto" }} type="submit" name="quick" value="1">
                    + Quick templates
                  </button>
                </form>
              </div>

              <form
                action={`/api/provider/${provider.accessToken}/service`}
                method="post"
                style={{ display: "grid", gap: 12, marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <input name="name" required placeholder="Service name" style={input} />
                <select name="category" required style={input as any} defaultValue="LASHES_BROWS">
                  <option value="LASHES_BROWS">Lashes/Brows</option>
                  <option value="NAILS">Nails</option>
                  <option value="HAIR">Hair</option>
                  <option value="BRAIDS">Braids</option>
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input name="durationMin" required placeholder="Mins" style={input} inputMode="numeric" />
                  <input name="price" required placeholder="Price $" style={input} inputMode="decimal" />
                </div>
                <textarea name="prepInstructions" placeholder="Service Prep Guide" style={{ ...input, height: 60 }} />
                <button style={goldBtn} type="submit">Add Service</button>
              </form>

              <div style={{ display: "grid", gap: 12 }}>
                {provider.services.map((s) => (
                  <div key={s.id} style={itemCard}>
                    <details>
                      <summary style={{ cursor: "pointer", listStyle: "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontWeight: 800 }}>{s.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.6 }}>Edit ↓</div>
                        </div>
                        <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                          {s.category} • {s.durationMin} min • ${(s.priceCents / 100).toFixed(2)}
                        </div>
                      </summary>

                      <form
                        action={`/api/provider/${provider.accessToken}/service/${s.id}`}
                        method="post"
                        style={{ display: "grid", gap: 10, marginTop: 12, padding: "10px 0" }}
                      >
                        <input name="name" defaultValue={s.name} style={input} />
                        <select name="category" defaultValue={s.category} style={input as any}>
                          <option value="LASHES_BROWS">Lashes/Brows</option>
                          <option value="NAILS">Nails</option>
                          <option value="HAIR">Hair</option>
                          <option value="BRAIDS">Braids</option>
                        </select>
                        <input name="durationMin" defaultValue={s.durationMin} style={input} inputMode="numeric" />
                        <input name="price" defaultValue={s.priceCents / 100} style={input} inputMode="decimal" />
                        <textarea name="prepInstructions" defaultValue={s.prepInstructions || ""} style={{ ...input, height: 60 }} />
                        <button style={btn} type="submit">Save Changes</button>
                      </form>
                      <button 
                        onClick={async () => {
                          if (confirm("Delete this service?")) {
                            await fetch(`/api/provider/${provider.accessToken}/service/${s.id}`, { method: 'DELETE' });
                            window.location.reload();
                          }
                        }}
                        style={{ ...btn, background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)", color: "#fca5a5", marginTop: 4 }}
                      >
                        Delete
                      </button>
                    </details>
                    
                    <IntakeFormManager token={token} serviceId={s.id} initialQuestions={s.questions} />

                    <form
                      action={`/api/provider/${provider.accessToken}/service/${s.id}/toggle`}
                      method="post"
                      style={{ marginTop: 8 }}
                    >
                      <button style={{ ...btn, background: s.active ? "rgba(255,255,255,0.05)" : btn.background, borderColor: s.active ? "rgba(255,255,255,0.1)" : btn.borderColor }} type="submit">
                        {s.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          ),
          marketing: (
            <MarketingTab token={token} />
          ),
          settings: (
            <div style={{ display: "grid", gap: 12 }}>
              <section style={glassCard}>
                <div style={{ fontWeight: 800 }}>Smart Marketing</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  Automated re-booking reminders via SMS.
                </div>
                <form 
                  action={`/api/provider/${provider.accessToken}/marketing-toggle`} 
                  method="post" 
                  style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      name="rebookingSmsEnabled" 
                      defaultChecked={provider.rebookingSmsEnabled}
                      onChange={(e) => e.target.form?.submit()}
                    />
                    <span style={{ fontSize: 13 }}>Enable Auto-Reminders</span>
                  </label>
                </form>
              </section>

              <section style={glassCard}>
                <div style={{ fontWeight: 800 }}>Service Mode</div>
                <ModeToggle token={token} initialMode={provider.mode} />
              </section>

              <section style={glassCard}>
                <div style={{ fontWeight: 800 }}>Mobile Suite Equipment</div>
                <form action={`/api/provider/${provider.accessToken}/kit`} method="post" style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <textarea
                    name="kitEquipment"
                    placeholder="List your mobile kit..."
                    defaultValue={provider.kitEquipmentJson ? JSON.parse(provider.kitEquipmentJson).join("\n") : ""}
                    style={{ ...input, height: 100 }}
                  />
                  <button style={btn} type="submit">Update Kit</button>
                </form>
              </section>

              <section style={glassCard}>
                <div style={{ fontWeight: 800 }}>Custom Travel Zones</div>
                <TravelZoneManager 
                  token={token} 
                  initialZones={provider.travelZonesJson} 
                  initialSurcharges={provider.travelZoneSurchargesJson} 
                />
              </section>

              <section style={glassCard}>
                <div style={{ fontWeight: 800 }}>Instagram Portfolio</div>
                <PortfolioManager 
                  token={token} 
                  initialHandle={provider.instagram} 
                  initialPhotos={provider.portfolioUrlsJson} 
                />
              </section>
            </div>
          )
        }}
      </DashboardTabs>
    </main>
  );
}

const mainContainer: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "20px 16px",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0a0a0b 0%, #161618 100%)",
  color: "#f5f5f7",
};

const glassCard: React.CSSProperties = {
  marginTop: 20,
  padding: 24,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
};

const itemCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(255,255,255,0.02)",
  transition: "all 0.2s ease",
};

const goldBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.5)",
  background: "linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.1) 100%)",
  color: "#D4AF37",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
  letterSpacing: "0.02em",
};

const outlineBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent",
  color: "rgba(255,255,255,0.8)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
};

const card: React.CSSProperties = glassCard;
const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#f5f5f7",
  outline: "none",
  fontSize: 14,
};

const btn: React.CSSProperties = goldBtn;
