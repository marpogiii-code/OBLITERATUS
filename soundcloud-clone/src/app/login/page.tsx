"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
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
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sc-gray mt-1">Sign in to your account</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-sc-gray mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                placeholder="Your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sc-orange hover:bg-sc-orange-dark text-white font-semibold py-2.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-sc-gray mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-sc-orange hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-sc-dark-4">
            <p className="text-xs text-sc-gray-dark text-center">
              Demo: demo@soundcloud.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
