"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Avatar from "./ui/Avatar";
import { resizeImageToDataUrl } from "@/lib/imageResize";

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  avatarUrl: string | null;
  onSave: (update: { displayName: string; avatarUrl: string | null }) => Promise<void>;
}

export default function EditProfileSheet({
  open,
  onClose,
  displayName,
  avatarUrl,
  onSave,
}: EditProfileSheetProps) {
  const [name, setName] = useState(displayName);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync from the latest saved values every time the sheet opens, so it
  // never shows stale data from before the profile finished loading.
  useEffect(() => {
    if (open) {
      setName(displayName);
      setPreview(avatarUrl);
      setError(null);
    }
  }, [open, displayName, avatarUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreview(dataUrl);
      setError(null);
    } catch {
      setError("Could not process that image. Try a different one.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ displayName: name.trim(), avatarUrl: preview });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="focus-ring relative rounded-full"
          aria-label="Change profile picture"
        >
          <Avatar label={name || undefined} imageSrc={preview} size="lg" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-ink text-base">
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <label className="mb-1.5 mt-6 block text-body-sm text-muted" htmlFor="display-name">
        Display name
      </label>
      <Input
        id="display-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name…"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
      />

      {error && <p className="mt-2 text-body-sm text-muted">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
