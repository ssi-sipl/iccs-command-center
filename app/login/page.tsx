"use client";

import type React from "react";

import { useState } from "react";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await login(email, password);

    if (!res.success) {
      setError(res.error || "Login failed");
      setIsLoading(false);
      return;
    }

    await refreshUser();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg space-y-6">
          {/* Logo and Title */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/icon.svg"
                alt="RUDRARAKSHAK 2.0 Logo"
                width={64}
                height={64}
                className="w-full h-full"
                priority
              />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                RUDRARAKSHAK 2.0
              </h1>
              {/* <p className="text-sm text-muted-foreground">Welcome back</p> */}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          {/* <p className="text-center text-xs text-muted-foreground"> */}
          {/* © 2026 I.C.C.S. All rights reserved. */}
          {/* </p> */}
        </div>
      </div>
    </div>
  );
}
