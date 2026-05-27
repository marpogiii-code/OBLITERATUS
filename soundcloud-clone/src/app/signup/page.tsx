"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          displayName: form.displayName,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-102px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-sc-dark-3 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sc-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sc-gray mt-1">
              Join the world&apos;s largest music community
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-sc-gray mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-sc-gray mb-1">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                  })
                }
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="yourname"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-sc-gray mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="Your Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-sc-gray mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm text-sc-gray mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="Confirm your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sc-orange hover:bg-sc-orange-dark text-white font-semibold py-2.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-sc-gray mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-sc-orange hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
