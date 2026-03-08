import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Beauty Meet — Book Atlanta’s Elite Beauty Artists",
  description: "Book Atlanta’s top lash, brow, hair, and nail artists. Beauty Meet is the modern marketplace that respects your artistry and your bottom line.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
          margin: 0,
          background: "#070709",
          color: "#F5F2EA",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: 16 }}>
          <nav style={navStyle}>
            <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em" }}>
              BEAUTY <span style={{ color: "#FF69B4" }}>MEET</span>
            </Link>
            
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="dropdown" style={{ position: "relative" }}>
                <button style={dropdownBtn}>MENU ▾</button>
                <div className="dropdown-content" style={dropdownContent}>
                  <Link href="/book" style={dropdownItem}>Book an Artist</Link>
                  <hr style={hrStyle} />
                  
                  <div style={dropdownHeader}>Customers</div>
                  <Link href="/login" style={dropdownItem}>Customer Login</Link>
                  <Link href="/book" style={dropdownItem}>My Appointments</Link>
                  
                  <hr style={hrStyle} />
                  
                  <div style={dropdownHeader}>Professionals</div>
                  <Link href="/tech/apply" style={dropdownItem}>Apply to Join</Link>
                  <Link href="/login" style={dropdownItem}>Tech Dashboard</Link>
                  
                  <hr style={hrStyle} />
                  
                  <div style={dropdownHeader}>Affiliates</div>
                  <Link href="/affiliate/register" style={dropdownItem}>Join Network</Link>
                  <Link href="/login" style={dropdownItem}>Affiliate Login</Link>
                  
                  <hr style={hrStyle} />
                  
                  {user ? (
                    <Link href="/api/auth/logout" style={{ ...dropdownItem, color: "#ff4d4d" }}>Logout</Link>
                  ) : (
                    <Link href="/login" style={{ ...dropdownItem, fontWeight: 700 }}>Sign In</Link>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <style dangerouslySetInnerHTML={{ __html: `
            .dropdown-content { display: none; }
            .dropdown:hover .dropdown-content { display: block; }
            a:hover { opacity: 1 !important; color: #FF69B4 !important; }
            button:hover { border-color: #D4AF37 !important; color: #D4AF37 !important; }
          `}} />

          {children}
        </div>
      </body>
    </html>
  );
}

const navStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: 20,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 12
};

const dropdownBtn: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color: "inherit",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 900,
  padding: "10px 20px",
  transition: "all 0.2s",
  letterSpacing: "0.05em"
};

const dropdownContent: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "100%",
  background: "#0d0d0f",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 16,
  minWidth: 220,
  zIndex: 100,
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
  padding: "12px 0",
  marginTop: 10
};

const dropdownHeader: React.CSSProperties = {
  padding: "8px 16px 4px",
  fontSize: 10,
  opacity: 0.5,
  textTransform: "uppercase",
  fontWeight: 900,
  letterSpacing: "0.1em"
};

const dropdownItem: React.CSSProperties = {
  display: "block",
  padding: "12px 16px",
  fontSize: 14,
  textDecoration: "none",
  color: "inherit",
  opacity: 0.9,
  transition: "all 0.1s",
  fontWeight: 600
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "8px 0"
};
