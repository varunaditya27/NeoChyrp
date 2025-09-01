"use client";
import React, { useState } from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/layout/footer";
import AuthModal from "../components/AuthModal";

const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Hero onAuthClick={handleAuthClick} />
      <Features />
      
      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
    </main>
  );
};

export default LandingPage;