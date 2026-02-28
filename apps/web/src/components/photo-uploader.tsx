'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface PhotoUploaderProps {
  areaId: string;
  existingPhotos: Array<{ id: string; storage_path: string; created_at: string }>;
}

export function PhotoUploader({ areaId, existingPhotos }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${areaId}/${crypto.randomUUID()}.${ext}`;

        // Get signed upload URL via API
        const res = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'originals', path }),
        });

        if (!res.ok) throw new Error('Failed to get upload URL');

        const { signedUrl } = await res.json();

        // Upload file
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        // Record in database
        await supabase.from('area_photos').insert({
          area_id: areaId,
          storage_path: path,
        });
      }

      router.refresh();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {existingPhotos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg bg-gray-200">
            <div className="flex h-full items-center justify-center text-xs text-gray-500">
              Photo
            </div>
          </div>
        ))}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
        {uploading ? 'Uploading...' : 'Upload Photos'}
      </label>
    </div>
  );
}
