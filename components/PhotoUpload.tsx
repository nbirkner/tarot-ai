'use client';

import { useRef, useState, useCallback } from 'react';

interface PhotoUploadProps {
  value: string | null;
  onChange: (photo: string | null) => void;
}

function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    try {
      const base64 = await compressImage(file, 512);
      onChange(base64);
    } catch {
      setError('Could not process image. Please try another.');
    }
  }, [onChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div style={{ fontFamily: 'Cormorant Garamond, serif' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {value ? (
        /* Preview state */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--gold)',
                boxShadow: '0 0 20px rgba(196, 146, 42, 0.2)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Your photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <button
              onClick={handleRemove}
              title="Remove photo"
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--brown-mid)',
                color: 'var(--cream)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'sans-serif',
              }}
            >
              ×
            </button>
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--brown-mid)',
              fontStyle: 'italic',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Photo added ✦ Your cards will mirror your likeness.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--brown-light)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 13,
              textDecoration: 'underline',
              fontStyle: 'italic',
            }}
          >
            Change photo
          </button>
        </div>
      ) : (
        /* Upload area */
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `1.5px dashed ${isDragging ? 'var(--gold)' : 'var(--border-gold)'}`,
            borderRadius: 4,
            padding: '28px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'var(--gold-pale)' : 'var(--cream-card)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Portrait icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1.5px solid var(--border-gold)',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-muted)',
              fontSize: 22,
            }}
          >
            ☽
          </div>

          <p
            style={{
              fontSize: 16,
              color: 'var(--brown-dark)',
              margin: '0 0 4px',
              fontWeight: 500,
            }}
          >
            Add your photo{' '}
            <span style={{ color: 'var(--brown-light)', fontStyle: 'italic', fontSize: 14 }}>
              (optional)
            </span>
          </p>

          <p
            style={{
              fontSize: 14,
              color: 'var(--brown-mid)',
              fontStyle: 'italic',
              margin: '0 0 12px',
            }}
          >
            If your cards contain people, they&rsquo;ll resemble you ✦
          </p>

          <p style={{ fontSize: 13, color: 'var(--brown-light)', margin: 0 }}>
            Click to browse or drag and drop
          </p>
        </div>
      )}

      {error && (
        <p
          style={{
            color: 'var(--rose)',
            fontSize: 14,
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
