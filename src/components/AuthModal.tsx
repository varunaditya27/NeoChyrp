"use client";
import React, { useEffect, useState } from "react";

import { useAuth } from "@/src/lib/auth/session";

import AdminNotice from "./AdminNotice";
import { Button } from "./ui/button";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose }) => {
  const { user, login, logout } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const validateForm = () => {
    if (!form.username || !form.password) {
      setError("Username and password are required");
      return false;
    }

    if (mode === "register") {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return false;
      }
      // Email validation only if provided
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("Please enter a valid email address");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const result = await login(form.username, form.password);
        if (!result.success) {
          setError(result.error || "Login failed");
          return;
        }
      } else {
        // Registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
            displayName: form.displayName || form.username
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Registration failed");
          return;
        }

        // Refresh user context after successful registration
        window.location.reload();
      }

      // Clear form and close modal on success
      setForm({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        displayName: "",
      });
      onClose();
    } catch (error) {
      setError(mode === "login" ? "Login failed" : "Registration failed");
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {mode === "login" && <AdminNotice />}

        {user ? (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
            Signed in as {user.displayName || user.username}
            <Button type="button" onClick={logout} className="ml-2 bg-red-100 text-red-700 hover:bg-red-200">
              Sign out
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={form.username}
              onChange={handleChange}
              className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
              aria-label="Username"
              disabled={loading}
            />

            {mode === "register" && (
              <>
                <input
                  type="text"
                  name="displayName"
                  placeholder="Display Name (optional)"
                  value={form.displayName}
                  onChange={handleChange}
                  className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  aria-label="Display Name"
                  disabled={loading}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={handleChange}
                  className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  aria-label="Email"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 -mt-2">
                  Email is optional. You can add it later in your profile settings.
                </p>
              </>
            )}

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={handleChange}
              className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
              aria-label="Password"
              disabled={loading}
            />

            {mode === "register" && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
                aria-label="Confirm Password"
                disabled={loading}
              />
            )}

            <Button type="submit" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </Button>

            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              Cancel
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
