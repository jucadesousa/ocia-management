"use client";
import { useRef, useState } from "react";
import { uploadParticipantPhoto } from "@/app/actions/sacramental";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export function PhotoUploadForm({
  participantId,
  photoUrl,
  name,
}: {
  participantId: string;
  photoUrl: string | null;
  name: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(photoUrl);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10 MB). Try a lower-resolution photo.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("photo", file);
      const result = await uploadParticipantPhoto(participantId, fd);
      if (result.error) {
        setError(result.error);
      } else {
        setCurrentUrl(URL.createObjectURL(file));
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Photo</h2>
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-semibold text-blue-700 select-none">
              {initials(name)}
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
          />
          <p className="text-xs text-gray-400">JPEG, PNG, WebP, or HEIC (iPhone).</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-900 disabled:opacity-60 transition-colors"
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
        </form>
      </div>
    </div>
  );
}
