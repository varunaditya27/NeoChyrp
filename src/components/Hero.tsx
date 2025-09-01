import React from "react";
import { Button } from "./ui/button";
import BlogPreview from "./BlogPreview";

const Hero: React.FC<{ onAuthClick: (mode: "login" | "register") => void }> = ({ onAuthClick }) => (
  <section className="w-full bg-gradient-to-br from-blue-50 to-white py-16 px-4 flex flex-col items-center">
    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 text-center">NeoChyrp</h1>
    <p className="text-xl md:text-2xl text-gray-700 mb-8 text-center">
      Lightweight, modular, and modern blogging reimagined.
    </p>
    <div className="flex gap-4 mb-8">
    <Button onClick={() => onAuthClick("login")}>Login</Button>
    <Button onClick={() => onAuthClick("register")}>Register</Button>
    </div>
    <BlogPreview />
  </section>
);

export default Hero;