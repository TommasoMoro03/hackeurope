import React, { useEffect } from "react";
import { trackEvent } from "./tracking";

const SEGMENT_ID = 24;
const SEGMENT_NAME = "B";

const SegmentB: React.FC = () => {
  useEffect(() => {
    trackEvent("button_view", SEGMENT_ID, SEGMENT_NAME);
  }, []);

  const handleClick = () => {
    trackEvent("button_click", SEGMENT_ID, SEGMENT_NAME);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", backgroundColor: "#f9fafb" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "48px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 480, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Welcome to Pryo</h1>
        <p style={{ color: "#6b7280", marginBottom: "32px", fontSize: "16px" }}>The A/B testing automation platform for fast-moving teams.</p>
        <button
          onClick={handleClick}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px 32px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = "#15803d")}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = "#16a34a")}
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default SegmentB;
