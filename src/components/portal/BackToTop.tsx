"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Back to top"
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            width: 44, height: 44, borderRadius: "50%",
            background: "#16A34A", border: "none",
            boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1,
          }}
        >
          <svg viewBox="0 0 20 20" fill="#fff" width="18" height="18">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/>
          </svg>
          <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", letterSpacing: "0.05em", lineHeight: 1 }}>TOP</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
