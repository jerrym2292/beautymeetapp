"use client";

import { useState } from "react";

type Tab = "BOOKINGS" | "EARNINGS" | "CLIENTS" | "WAITLIST" | "SERVICES" | "MARKETING" | "SETTINGS";

export default function DashboardTabs({ 
  children,
  bookingsCount,
  servicesCount 
}: { 
  children: {
    bookings: React.ReactNode;
    earnings: React.ReactNode;
    clients: React.ReactNode;
    waitlist: React.ReactNode;
    services: React.ReactNode;
    marketing: React.ReactNode;
    settings: React.ReactNode;
  },
  bookingsCount: number,
  servicesCount: number
}) {
  const [activeTab, setActiveTab] = useState<Tab>("BOOKINGS");

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: activeTab === tab ? "2px solid #D4AF37" : "2px solid transparent",
    color: activeTab === tab ? "#D4AF37" : "rgba(255,255,255,0.6)",
    fontWeight: 800,
    fontSize: 14,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: 8
  });

  return (
    <div style={{ marginTop: 20 }}>
      <nav style={{ 
        display: "flex", 
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        marginBottom: 20,
        position: "sticky",
        top: 0,
        background: "#0a0a0b", 
        zIndex: 10,
        overflowX: "auto",
        whiteSpace: "nowrap"
      }}>
        <div onClick={() => setActiveTab("BOOKINGS")} style={tabStyle("BOOKINGS")}>
          Bookings
          <span style={badgeStyle}>{bookingsCount}</span>
        </div>
        <div onClick={() => setActiveTab("WAITLIST")} style={tabStyle("WAITLIST")}>
          Waitlist
        </div>
        <div onClick={() => setActiveTab("EARNINGS")} style={tabStyle("EARNINGS")}>
          Earnings
        </div>
        <div onClick={() => setActiveTab("CLIENTS")} style={tabStyle("CLIENTS")}>
          Clients
        </div>
        <div onClick={() => setActiveTab("SERVICES")} style={tabStyle("SERVICES")}>
          Services
          <span style={badgeStyle}>{servicesCount}</span>
        </div>
        <div onClick={() => setActiveTab("MARKETING")} style={tabStyle("MARKETING")}>
          Marketing
        </div>
        <div onClick={() => setActiveTab("SETTINGS")} style={tabStyle("SETTINGS")}>
          Settings
        </div>
      </nav>

      <div style={{ paddingBottom: 40 }}>
        {activeTab === "BOOKINGS" && children.bookings}
        {activeTab === "WAITLIST" && children.waitlist}
        {activeTab === "EARNINGS" && children.earnings}
        {activeTab === "CLIENTS" && children.clients}
        {activeTab === "SERVICES" && children.services}
        {activeTab === "MARKETING" && children.marketing}
        {activeTab === "SETTINGS" && children.settings}
      </div>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  background: "rgba(255,255,255,0.1)",
  padding: "2px 6px",
  borderRadius: 10,
  minWidth: 18,
  textAlign: "center"
};
