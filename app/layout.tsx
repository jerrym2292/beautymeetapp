import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Beauty Meet — Book Elite Beauty Artists Across the US",
  description:
    "Discover and book top lash, brow, and nail artists across the United States — or join Beauty Meet as a professional and keep more of what you earn.",
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
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
          <nav style={navStyle}>
            <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 800, fontSize: 18 }}>Beauty Meet</Link>
            
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="dropdown" style={{ position: "relative" }}>
                <button style={dropdownBtn}>Menu ▾</button>
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
            a:hover { opacity: 1 !important; color: #D4AF37 !important; }
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
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  marginBottom: 12
};

const dropdownBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "inherit",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  padding: "8px 16px",
  transition: "all 0.2s"
};

const dropdownContent: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "100%",
  background: "#121214",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  minWidth: 200,
  zIndex: 100,
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
  padding: "8px 0",
  marginTop: 8
};

const dropdownHeader: React.CSSProperties = {
  padding: "8px 16px 4px",
  fontSize: 11,
  opacity: 0.4,
  textTransform: "uppercase",
  fontWeight: 800,
  letterSpacing: "0.05em"
};

const dropdownItem: React.CSSProperties = {
  display: "block",
  padding: "10px 16px",
  fontSize: 14,
  textDecoration: "none",
  color: "inherit",
  opacity: 0.8,
  transition: "all 0.1s"
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "6px 0"
};
