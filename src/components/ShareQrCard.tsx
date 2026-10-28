import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  Send,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareQrCardProps {
  onOpenInstallModal?: (tab?: 'apk_build' | 'friend' | 'playstore' | 'android' | 'ios') => void;
  onToast?: (msg: string) => void;
}

export const ShareQrCard: React.FC<ShareQrCardProps> = ({
  onOpenInstallModal,
  onToast,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState<boolean>(false);

  const fallbackUrl = 'https://ais-pre-kp4ry4uzvcmzvbtpqlsykt-97908392068.asia-southeast1.run.app';
  const currentAppUrl =
    typeof window !== 'undefined'
      ? window.location.origin.replace('ais-dev-', 'ais-pre-')
      : fallbackUrl;

  const friendWhatsAppMessage = `Bhai! Maine JARVIS AI Voice Assistant banaya hai, jo voice commands se phone calls, WhatsApp, torch, camera aur settings control karta hai!

👇 Is link se apne phone me direct install kar lo:
${currentAppUrl}

📲 Install karne ka aasan tarika:
1. Link ko Google Chrome me kholein
2. Upar 3-dots (⋮ menu) par tap karein
3. "Install app" ya "Add to Home screen" par click karein
Asli Play Store app ki tarah phone me install ho jayega!`;

  useEffect(() => {
    if (currentAppUrl) {
      QRCode.toDataURL(currentAppUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR code in ShareQrCard:', err);
        });
    }
  }, [currentAppUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      if (onToast) onToast('JARVIS Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(friendWhatsAppMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    setCopiedWhatsapp(true);
    if (onToast) onToast('WhatsApp share opened!');
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = 'jarvis-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onToast) onToast('QR Code image downloaded!');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'JARVIS AI Voice Assistant',
          text: friendWhatsAppMessage,
          url: currentAppUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      id="jarvis-share-qr-card"
      className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 via-emerald-950/20 to-slate-950/90 border border-emerald-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <QrCode className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                JARVIS Live Link & QR Code
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold">
                Instant Scan
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Dost ke phone ke camera se scan karwayein ya WhatsApp par direct link share karein
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onOpenInstallModal) onOpenInstallModal('apk_build');
          }}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Build .APK File</span>
        </button>
      </div>

      {/* Main Content: QR Code + Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
        {/* QR Code Container */}
        <div className="bg-white p-2.5 rounded-2xl shadow-2xl border-2 border-emerald-400/40 flex-shrink-0 flex flex-col items-center group">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="JARVIS App QR Code"
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-lg"
            />
          ) : (
            <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-slate-900 text-xs font-mono">
              Generating QR...
            </div>
          )}
          <span className="text-[10px] font-semibold text-slate-700 mt-1 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Scan with Camera
          </span>
        </div>

        {/* Link Box & Quick Actions */}
        <div className="flex-1 w-full space-y-3 text-center sm:text-left">
          {/* Public Link Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 block text-left">
              Direct Public WebAPK / App Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentAppUrl}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 font-mono text-xs select-all focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                id="btn-copy-link-main-card"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow active:scale-95 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              id="btn-share-whatsapp-card"
              onClick={handleSendWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-slate-950" />
              <span>WhatsApp par Bhejo</span>
            </button>

            <button
              id="btn-download-qr-image-card"
              onClick={handleDownloadQr}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download QR Image</span>
            </button>

            <button
              id="btn-open-system-share-card"
              onClick={handleNativeShare}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>More Share Options</span>
            </button>
          </div>

          {/* Quick Tip for Friend */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2 text-left">
            <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Dost ke liye tip:</strong> Is QR code ko scan karke ya link ko Chrome me kholkar top-right 3-dots (⋮) par tap karein aur <strong>"Install app"</strong> dabayein. Yeh bina kisi warning ke sidhe phone me install ho jata hai!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
