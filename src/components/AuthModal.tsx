"use client";
import React, { useEffect, useState } from "react";

import { useAuth } from "@/src/lib/auth/session";

import { Button } from "./ui/button";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose }) => {
  const { signInWithGoogle, user, signOut } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with Supabase Auth
    onClose();
  };

  // Auto-close the modal shortly after successful sign-in
  useEffect(() => {
    if (open && user) {
      const t = setTimeout(() => onClose(), 600);
      return () => clearTimeout(t);
    }
  }, [open, user, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        {user ? (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700" role="status">
            Signed in as {user.email || user.id}
            <Button type="button" onClick={signOut} className="ml-2 bg-red-100 text-red-700 hover:bg-red-200">
              Sign out
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={signInWithGoogle} className="mb-4 flex w-full items-center justify-center gap-2">
            <span>Continue with Google</span>
          </Button>
        )}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={form.username}
            onChange={handleChange}
            className="rounded border px-3 py-2"
            aria-label="Username"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
            className="rounded border px-3 py-2"
            aria-label="Password"
          />
          {mode === "register" && (
            <>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="rounded border px-3 py-2"
                aria-label="Confirm Password"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={handleChange}
        className="rounded border px-3 py-2"
                aria-label="Email"
              />
            </>
          )}
          <Button type="submit" disabled={!!user}>
            {user ? "Already signed in" : mode === "login" ? "Login" : "Register"}
          </Button>
      <Button type="button" onClick={onClose} className="mt-2 bg-gray-200 text-gray-700">
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;