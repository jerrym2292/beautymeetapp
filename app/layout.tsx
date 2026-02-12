import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beauty Meet",
  description: "Beauty Meet — Atlanta booking for lashes/brows and nails",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
          margin: 0,
          background: "#0b0b0f",
          color: "#f5f5f7",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
