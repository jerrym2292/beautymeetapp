import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import TopNav from "./TopNav";

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
        <TopNav user={user ? { role: user.role, providerId: user.providerId } : null} />

        {/* Push content below the fixed nav */}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "90px 16px 16px" }}>{children}</div>
      </body>
    </html>
  );
}

