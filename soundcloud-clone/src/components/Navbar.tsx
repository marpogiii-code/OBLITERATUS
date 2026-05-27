"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-sc-dark-2 border-b border-sc-dark-4 z-40 h-[46px]">
      <div className="flex items-center h-full px-4 max-w-screen-2xl mx-auto gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-sc-orange rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">
            SoundCloud
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-sc-gray hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/explore"
            className="px-3 py-1.5 text-sm text-sc-gray hover:text-white transition-colors"
          >
            Explore
          </Link>
          {session && (
            <Link
              href="/library"
              className="px-3 py-1.5 text-sm text-sc-gray hover:text-white transition-colors"
            >
              Library
            </Link>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for artists, bands, tracks, podcasts"
              className="w-full bg-sc-dark-4 text-white text-sm rounded-sm py-1.5 px-3 pr-8 placeholder-sc-gray focus:outline-none focus:ring-1 focus:ring-sc-orange"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sc-gray hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Auth / Upload */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/upload"
                className="px-3 py-1.5 text-sm bg-sc-orange hover:bg-sc-orange-dark text-white rounded-sm transition-colors"
              >
                Upload
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-sc-gray hover:text-white transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-sc-dark-4 overflow-hidden">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm hidden lg:block">
                    {session.user?.name}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-sc-dark-3 border border-sc-dark-4 rounded shadow-lg py-1">
                    <Link
                      href={`/profile/${(session.user as { id: string }).id}`}
                      className="block px-4 py-2 text-sm text-sc-gray hover:text-white hover:bg-sc-dark-4"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/library"
                      className="block px-4 py-2 text-sm text-sc-gray hover:text-white hover:bg-sc-dark-4"
                      onClick={() => setShowDropdown(false)}
                    >
                      Library
                    </Link>
                    <hr className="border-sc-dark-4 my-1" />
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-sc-gray hover:text-white hover:bg-sc-dark-4"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-sc-gray hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 text-sm bg-sc-orange hover:bg-sc-orange-dark text-white rounded-sm transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
