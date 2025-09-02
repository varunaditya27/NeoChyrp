"use client";
import React, { useState } from "react";

import { AuthProvider } from "@/src/lib/auth/session";

import AuthModal from "../components/AuthModal";
import Features from "../components/Features";
import Hero from "../components/Hero";
import SiteHeader from "../components/layout/header";

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col">
  <SiteHeader />
        <Hero onAuthClick={handleAuthClick} />
        <Features />
        <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
      </main>
    </AuthProvider>
  );
};

export default LandingPage;