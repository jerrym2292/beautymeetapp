import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "BeautyMeetApp",
  description: "BeautyMeetApp — Book nails, lashes & brows",
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
            <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 800 }}>BM</Link>
            
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="dropdown" style={{ position: "relative" }}>
                <button style={dropdownBtn}>Menu ▾</button>
                <div className="dropdown-content" style={dropdownContent}>
                  <Link href="/book" style={dropdownItem}>Book Now</Link>
                  <Link href="/tech/apply" style={dropdownItem}>Apply as Tech</Link>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "4px 0" }} />
                  <div style={{ padding: "8px 16px", fontSize: 11, opacity: 0.5, textTransform: "uppercase", fontWeight: 700 }}>Affiliates</div>
                  <Link href="/affiliate/register" style={dropdownItem}>Sign Up</Link>
                  <Link href="/login" style={dropdownItem}>Partner Login</Link>
                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "4px 0" }} />
                  {user ? (
                    <Link href="/api/auth/logout" style={dropdownItem}>Logout</Link>
                  ) : (
                    <Link href="/login" style={dropdownItem}>Login</Link>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <style dangerouslySetInnerHTML={{ __html: `
            .dropdown-content { display: none; }
            .dropdown:hover .dropdown-content { display: block; }
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
  paddingBottom: 12,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  marginBottom: 12
};

const dropdownBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  padding: "4px 8px"
};

const dropdownContent: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: "100%",
  background: "#1a1a1c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  minWidth: 160,
  zIndex: 100,
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
  padding: "4px 0"
};

const dropdownItem: React.CSSProperties = {
  display: "block",
  padding: "8px 16px",
  fontSize: 14,
  textDecoration: "none",
  color: "inherit",
  opacity: 0.9
};
