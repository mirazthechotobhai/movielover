import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, Camera, AlertCircle, Upload } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerElementId = 'html5-qr-reader-container';

  const safeStopScanner = async (qr: Html5Qrcode | null) => {
    if (!qr) return;
    try {
      if (typeof qr.getState === 'function') {
        const state = qr.getState();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await qr.stop();
        }
      }
    } catch {
      // Ignored: scanner may already be stopped or not running
    }
    try {
      qr.clear();
    } catch {
      // Ignored
    }
  };

  const parseCodeFromText = (decodedText: string): string => {
    let code = decodedText.trim();
    if (code.includes('room=')) {
      try {
        const url = new URL(code);
        const rParam = url.searchParams.get('room');
        if (rParam) code = rParam;
      } catch {
        const match = code.match(/room=([0-9a-zA-Z_-]+)/);
        if (match && match[1]) code = match[1];
      }
    }
    return code;
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        const qr = scannerRef.current;
        scannerRef.current = null;
        safeStopScanner(qr);
      }
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setScannerError(null);

    const timer = setTimeout(async () => {
      let qrInstance: Html5Qrcode | null = null;
      try {
        const container = document.getElementById(readerElementId);
        if (!container || !isMounted) return;

        qrInstance = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        // Determine best camera config
        let cameraConfig: any = { facingMode: 'environment' };

        // Try enumerating video devices first for broader compatibility
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            // Find back camera if possible, otherwise use first camera
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('rear')
            );
            cameraConfig = { deviceId: { exact: backCam ? backCam.id : devices[0].id } };
          }
        } catch {
          // If getCameras fails or is restricted, fallback to facingMode or basic constraints
          cameraConfig = { facingMode: 'environment' };
        }

        if (!isMounted) {
          qrInstance.clear();
          return;
        }

        scannerRef.current = qrInstance;

        const onScan = (decodedText: string) => {
          const code = parseCodeFromText(decodedText);
          if (scannerRef.current) {
            const activeQr = scannerRef.current;
            scannerRef.current = null;
            safeStopScanner(activeQr);
          }
          onScanSuccess(code);
          onClose();
        };

        try {
          await qrInstance.start(
            cameraConfig,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            onScan,
            () => {}
          );
        } catch (initialErr: any) {
          // If exact back camera failed with NotFoundError, try generic user / default camera
          if (!isMounted) return;
          console.warn('Initial camera start failed, trying fallback camera constraint:', initialErr);
          await qrInstance.start(
            { facingMode: 'user' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            onScan,
            () => {}
          );
        }

        if (isMounted) {
          setIsInitializing(false);
        } else {
          safeStopScanner(qrInstance);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera QR scanner unavailable:', err?.message || err);
        const errMsg = err?.name === 'NotFoundError' || String(err).includes('NotFoundError')
          ? 'No camera found on this device or camera is disabled in your browser settings.'
          : err?.name === 'NotAllowedError' || String(err).includes('NotAllowedError')
          ? 'Camera permission denied. Please allow camera access to scan.'
          : err?.message || 'Could not access camera on this device.';
        setScannerError(errMsg);
        setIsInitializing(false);
        if (qrInstance) {
          safeStopScanner(qrInstance);
          scannerRef.current = null;
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        const qr = scannerRef.current;
        scannerRef.current = null;
        safeStopScanner(qr);
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let qr = scannerRef.current;
      if (!qr) {
        qr = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }
      const decodedResult = await qr.scanFile(file, true);
      const code = parseCodeFromText(decodedResult);
      safeStopScanner(qr);
      scannerRef.current = null;
      onScanSuccess(code);
      onClose();
    } catch {
      setScannerError('Could not detect a valid QR code in the selected image.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#16161e] border border-zinc-800/80 rounded-2xl p-5 shadow-2xl overflow-hidden text-center text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition"
          aria-label="Close camera scanner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base tracking-wide">Scan TV QR Code</h3>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          Point your device camera at the QR code displayed on your TV or player screen.
        </p>

        {scannerError ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col items-center gap-2.5">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <p className="leading-relaxed">{scannerError}</p>
            <p className="text-zinc-400 text-[11px]">
              You can still connect instantly by typing the 4-digit code in the Room Code box.
            </p>

            {/* Optional Image Upload Fallback */}
            <div className="pt-2 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image / Screenshot</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-black aspect-square max-h-72 mx-auto border border-zinc-800 flex items-center justify-center">
            <div id={readerElementId} className="w-full h-full" />
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-zinc-300 text-xs gap-2">
                <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Activating camera...</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 px-4 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-xl transition"
        >
          Cancel & Enter Code Manually
        </button>
      </div>
    </div>
  );
};
