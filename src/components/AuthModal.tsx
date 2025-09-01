"use client";
import React, { useState } from "react";
import { Button } from "./ui/button";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose }) => {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={form.username}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            aria-label="Username"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
            className="border rounded px-3 py-2"
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
                className="border rounded px-3 py-2"
                aria-label="Confirm Password"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={handleChange}
                className="border rounded px-3 py-2"
                aria-label="Email"
              />
            </>
          )}
          <Button type="submit">{mode === "login" ? "Login" : "Register"}</Button>
          <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 mt-2">
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;