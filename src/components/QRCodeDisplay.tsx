import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 220,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setDataUrl(url);
        setError(null);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
        setError('Failed to generate QR');
      });
  }, [value, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl text-xs p-4 ${className}`}
        style={{ width: size, height: size }}
      >
        <span>{error}</span>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 border border-zinc-800 animate-pulse rounded-xl ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`p-2 bg-white rounded-xl shadow-2xl border border-zinc-200/40 inline-block overflow-hidden ${className}`}
    >
      <img
        src={dataUrl}
        alt={`QR code for ${value}`}
        width={size}
        height={size}
        className="block rounded-lg"
      />
    </div>
  );
};
