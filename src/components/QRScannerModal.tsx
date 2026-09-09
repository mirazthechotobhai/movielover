import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (roomCode: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'streamcast-qr-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;
    setError(null);

    const startScanner = async () => {
      try {
        setIsScanning(true);
        // Wait for DOM container
        await new Promise((r) => setTimeout(r, 150));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success handler
            stopScanner();
            // Parse room code from URL or plain text
            let code = decodedText.trim();
            if (code.includes('room=')) {
              const match = code.match(/room=([0-9]{4})/i);
              if (match && match[1]) {
                code = match[1];
              }
            } else {
              const numericMatch = code.match(/\b([0-9]{4})\b/);
              if (numericMatch && numericMatch[1]) {
                code = numericMatch[1];
              }
            }
            onScanSuccess(code);
          },
          () => {
            // Scan progress (frame without QR code) - do nothing
          }
        );
      } catch (err: any) {
        if (isMounted) {
          console.warn('QR camera error:', err);
          setError(
            err.message ||
              'Camera access was denied or is not available. Please allow camera permissions or enter the 4-digit code manually.'
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#16161f] border border-white/10 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          id="btn-close-scanner"
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close Scanner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
          <Camera className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Scan TV QR Code</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Point your camera at the QR code displayed on your TV screen.
        </p>

        {/* Video stream container */}
        <div className="relative w-full aspect-square max-w-[280px] bg-black/60 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
          <div id={containerId} className="w-full h-full" />

          {/* Scanner Corner Guides */}
          {isScanning && !error && (
            <div className="absolute inset-6 pointer-events-none border-2 border-indigo-500/50 rounded-lg">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-[#16161f]/95 p-4 flex flex-col items-center justify-center text-center text-red-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-xs leading-relaxed mb-3">{error}</p>
              <button
                id="btn-retry-camera"
                onClick={() => {
                  stopScanner();
                  setError(null);
                  setIsScanning(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-500 mt-4">
          Or manually type the 4-digit code shown beneath the TV QR code.
        </p>
      </div>
    </div>
  );
};
