"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getGenres } from "@/lib/utils";
import Link from "next/link";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "details">("select");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "None",
    tags: "",
    isPublic: true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-sc-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Upload your tracks</h1>
        <p className="text-sc-gray mb-6">
          You need to be signed in to upload tracks.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-sc-orange hover:bg-sc-orange-dark text-white rounded-sm transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
      setStep("details");
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !form.title.trim()) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      if (coverFile) formData.append("cover", coverFile);
      formData.append("title", form.title.trim());
      formData.append("description", form.description);
      formData.append("genre", form.genre);
      formData.append("tags", form.tags);
      formData.append("isPublic", String(form.isPublic));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const track = await res.json();
      router.push(`/track/${track.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (step === "select") {
    return (
      <div className="max-w-screen-md mx-auto px-4 py-16">
        <div className="bg-sc-dark-3 rounded-lg p-12 text-center">
          <h1 className="text-2xl font-bold mb-2">
            Drag and drop your tracks & albums here
          </h1>
          <p className="text-sc-gray mb-8">
            Upload audio files (MP3, WAV, FLAC, AAC, OGG, M4A)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-3 bg-sc-orange hover:bg-sc-orange-dark text-white font-semibold rounded-sm transition-colors"
          >
            or choose files to upload
          </button>
          <p className="text-xs text-sc-gray-dark mt-6">
            Provide FLAC, WAV, ALAC, or AIFF for highest quality. Max file size: 50MB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="bg-sc-dark-3 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Upload details</h1>
          <button
            onClick={() => {
              setStep("select");
              setAudioFile(null);
            }}
            className="text-sm text-sc-gray hover:text-white"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Art */}
            <div className="flex-shrink-0">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-[260px] h-[260px] bg-sc-dark-4 rounded overflow-hidden flex items-center justify-center hover:bg-sc-dark-2 transition-colors group"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mx-auto text-sc-gray-dark group-hover:text-sc-gray mb-2"
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    <p className="text-sm text-sc-gray-dark group-hover:text-sc-gray">
                      Upload cover image
                    </p>
                  </div>
                )}
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm text-sc-gray mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                  placeholder="Name your track"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-sc-gray mb-1">
                  Genre
                </label>
                <select
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                >
                  {getGenres().map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-sc-gray mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange"
                  placeholder="Add tags to describe the genre and mood (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm text-sc-gray mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-sc-dark-4 text-white rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-sc-orange h-24 resize-none"
                  placeholder="Describe your track"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={form.isPublic}
                    onChange={() => setForm({ ...form, isPublic: true })}
                    className="accent-sc-orange"
                  />
                  <span className="text-sm">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!form.isPublic}
                    onChange={() => setForm({ ...form, isPublic: false })}
                    className="accent-sc-orange"
                  />
                  <span className="text-sm">Private</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-sc-dark-4 rounded text-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-sc-orange"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-sc-gray">{audioFile?.name}</span>
                <span className="text-sc-gray-dark ml-auto">
                  {audioFile
                    ? `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-sc-dark-4">
            <button
              type="submit"
              disabled={uploading}
              className="px-8 py-2.5 bg-sc-orange hover:bg-sc-orange-dark text-white font-semibold rounded-sm transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Save & publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
