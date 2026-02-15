import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BeautyMeetApp",
  description: "BeautyMeetApp — Book nails, lashes & brows",
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
          background: "#070709",
          color: "#F5F2EA",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
