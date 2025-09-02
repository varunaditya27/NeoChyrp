"use client";
import React from "react";

import { useAuth } from "@/src/lib/auth/session";

import BlogPreview from "./BlogPreview";
import { Button } from "./ui/button";

interface HeroProps { onAuthClick: (mode: "login" | "register") => void }

const Hero: React.FC<HeroProps> = ({ onAuthClick }) => {
  const { user, loading, signOut } = useAuth();

  return (
    <section className="flex w-full flex-col items-center bg-gradient-to-br from-blue-50 to-white px-4 py-16">
      <h1 className="mb-4 text-center text-5xl font-extrabold text-gray-900 md:text-6xl">NeoChyrp</h1>
      <p className="mb-8 text-center text-xl text-gray-700 md:text-2xl">
        Lightweight, modular, and modern blogging reimagined.
      </p>
      <div className="mb-8 flex min-h-[42px] items-center gap-4">
        {loading && (
          <span className="animate-pulse text-sm text-gray-500">Checking session…</span>
        )}
        {!loading && !user && (
          <>
            <Button onClick={() => onAuthClick("login")}>Login</Button>
            <Button onClick={() => onAuthClick("register")}>Register</Button>
          </>
        )}
        {!loading && user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{user.email || user.id}</span>
            <Button onClick={signOut} className="bg-gray-200 px-3 py-1 text-gray-800 hover:bg-gray-300">Sign out</Button>
          </div>
        )}
      </div>
      <BlogPreview />
    </section>
  );
};

export default Hero;