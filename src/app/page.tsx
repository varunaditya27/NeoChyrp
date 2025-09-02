"use client";
import React, { useState } from "react";

import AuthModal from "../components/AuthModal";
import Features from "../components/Features";
import Hero from "../components/Hero";

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Hero onAuthClick={handleAuthClick} />
      <Features />
      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
    </main>
  );
};

export default LandingPage;