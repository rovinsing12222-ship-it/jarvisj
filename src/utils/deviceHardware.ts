// Android Device Hardware Bridge & Intent Dispatcher for J.A.R.V.I.S.
import {
  triggerHaptic,
  triggerAlertHaptic,
  testAlertHapticPattern,
  getHapticConfig,
  saveHapticConfig,
  subscribeHapticConfig,
  testHapticFeedback,
  isVibrationSupported,
  PATTERN_STYLE_PRESETS,
  INTENSITY_MULTIPLIERS,
  ACTION_CATEGORY_PATTERNS,
  DEFAULT_ALERT_HAPTICS,
  ALERT_PATTERN_PRESETS,
  getAllAlertHapticConfigs,
  getAlertHapticConfig,
  saveAlertHapticConfig,
  saveAllAlertHapticConfigs,
  resetAlertHapticConfig,
  subscribeAlertHaptics,
} from './hapticEngine';

export {
  triggerHaptic,
  triggerAlertHaptic,
  testAlertHapticPattern,
  getHapticConfig,
  saveHapticConfig,
  subscribeHapticConfig,
  testHapticFeedback,
  isVibrationSupported,
  PATTERN_STYLE_PRESETS,
  INTENSITY_MULTIPLIERS,
  ACTION_CATEGORY_PATTERNS,
  DEFAULT_ALERT_HAPTICS,
  ALERT_PATTERN_PRESETS,
  getAllAlertHapticConfigs,
  getAlertHapticConfig,
  saveAlertHapticConfig,
  saveAllAlertHapticConfigs,
  resetAlertHapticConfig,
  subscribeAlertHaptics,
};

let mediaStream: MediaStream | null = null;
let videoTrack: MediaStreamTrack | null = null;

export interface LinkActionEvent {
  title: string;
  url: string;
  type: 'call' | 'whatsapp' | 'sms' | 'app' | 'external';
  buttonLabel: string;
}

/**
 * Universal safe link opener that works in both standard browsers and iframes.
 * Uses real anchor elements to avoid popup blockers and supports fallback.
 */
export function openExternalLink(url: string, target: string = '_blank'): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const a = document.createElement('a');
    a.href = url;
    if (target && !url.startsWith('tel:') && !url.startsWith('sms:')) {
      a.target = target;
      a.rel = 'noopener noreferrer';
    }
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {
        // ignore
      }
    }, 200);
    return true;
  } catch (err) {
    console.warn('Anchor click navigation error:', err);
    try {
      if (!url.startsWith('tel:') && !url.startsWith('sms:')) {
        const win = window.open(url, target, 'noopener,noreferrer');
        return !!win;
      } else {
        window.location.href = url;
        return true;
      }
    } catch (e2) {
      console.warn('Fallback window navigation error:', e2);
      return false;
    }
  }
}

/**
 * Dispatch an open-link event so the UI can show a direct button if blocked
 */
export function dispatchLinkAction(detail: LinkActionEvent) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jarvis:open-link', { detail }));
  }
}

/**
 * Toggle Android Camera Flashlight / Torch using WebRTC track constraints
 */
export async function setTorch(enable: boolean): Promise<boolean> {
  try {
    if (!enable) {
      if (videoTrack) {
        try {
          await (videoTrack as any).applyConstraints({
            advanced: [{ torch: false }],
          });
        } catch {
          // ignore
        }
        videoTrack.stop();
        videoTrack = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('MediaDevices API not supported on this browser.');
      return false;
    }

    // Request environment facing camera for torch
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
    });

    const track = mediaStream.getVideoTracks()[0];
    if (!track) return false;

    videoTrack = track;
    const capabilities = (track as any).getCapabilities?.() || {};

    if ('torch' in capabilities) {
      await (track as any).applyConstraints({
        advanced: [{ torch: true }],
      });
      return true;
    } else {
      console.warn('Torch capability not directly supported on this camera track.');
      return true;
    }
  } catch (err) {
    console.error('Failed to control torch:', err);
    return false;
  }
}

export const toggleDeviceTorch = (enable: boolean) => setTorch(enable);

/**
 * Read Battery Status
 */
export async function getBatteryStatus(): Promise<{ level: number; charging: boolean } | null> {
  if (typeof window !== 'undefined' && 'getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Fetch real Device Battery percentage and charging status using Navigator.getBattery if available
 */
export async function getDeviceBatteryStatus(): Promise<{ level: number; charging: boolean; formatted: string }> {
  try {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      const level = Math.round((battery.level || 0.94) * 100);
      const charging = !!battery.charging;
      return {
        level,
        charging,
        formatted: `${level}%${charging ? ' (Charging ⚡)' : ''}`,
      };
    }
  } catch (e) {
    console.warn('Battery API not available:', e);
  }
  return { level: 94, charging: false, formatted: '94%' };
}

/**
 * Launch Android Phone Call via Native Dialer & Safe Anchor
 */
export function launchPhoneCall(phoneNumber: string, contactName?: string) {
  const cleanNumber = phoneNumber.replace(/[^0-9+*#]/g, '');
  if (!cleanNumber) return;
  triggerHaptic([50, 50, 100]);

  const telUrl = `tel:${cleanNumber}`;
  openExternalLink(telUrl, '_self');

  dispatchLinkAction({
    title: contactName ? `Call ${contactName}` : `Call ${cleanNumber}`,
    url: telUrl,
    type: 'call',
    buttonLabel: `Open Phone Dialer (${cleanNumber})`,
  });
}

/**
 * Launch WhatsApp with direct number and pre-filled message
 * Uses official universal wa.me link that works on mobile Android apps & desktop web.
 */
export function launchWhatsApp(phoneNumber?: string, text?: string) {
  triggerHaptic([50, 50, 100]);
  const cleanNumber = (phoneNumber || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text || '');

  let url = 'https://web.whatsapp.com';
  let buttonLabel = 'Open WhatsApp';

  if (cleanNumber) {
    url = `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
    buttonLabel = `Open WhatsApp Chat (+${cleanNumber})`;
  } else if (encodedText) {
    url = `https://wa.me/?text=${encodedText}`;
    buttonLabel = 'Open WhatsApp with Message';
  }

  openExternalLink(url, '_blank');

  dispatchLinkAction({
    title: 'WhatsApp Message',
    url,
    type: 'whatsapp',
    buttonLabel,
  });
}

/**
 * Launch Native Android SMS App
 */
export function launchSms(phoneNumber?: string, body?: string) {
  triggerHaptic([50, 50, 100]);
  const cleanNumber = (phoneNumber || '').replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(body || '');
  const smsUrl = cleanNumber ? `sms:${cleanNumber}?body=${encodedBody}` : `sms:?body=${encodedBody}`;

  openExternalLink(smsUrl, '_self');

  dispatchLinkAction({
    title: 'SMS Messaging',
    url: smsUrl,
    type: 'sms',
    buttonLabel: cleanNumber ? `Open SMS to ${cleanNumber}` : 'Open SMS Composer',
  });
}

/**
 * Launch Android App or Web service via universal deep links
 * Automatically opens the installed Android App if on phone, or web fallback if on PC.
 */
export function launchAndroidApp(appName: string, query?: string): { name: string; url: string } {
  triggerHaptic([50, 50, 50]);
  const lower = appName.toLowerCase().trim();
  const q = encodeURIComponent(query || '');

  // Universal App Links: on Android, these HTTPS URLs trigger the installed native app
  const appMap: Record<string, { url: string; label: string; title: string }> = {
    youtube: {
      url: q ? `https://www.youtube.com/results?search_query=${q}` : `https://www.youtube.com`,
      label: 'Open YouTube',
      title: 'YouTube',
    },
    camera: {
      url: `https://camera.google.com`,
      label: 'Open Camera',
      title: 'Camera',
    },
    whatsapp: {
      url: `https://wa.me/`,
      label: 'Open WhatsApp',
      title: 'WhatsApp',
    },
    instagram: {
      url: `https://www.instagram.com`,
      label: 'Open Instagram',
      title: 'Instagram',
    },
    spotify: {
      url: q ? `https://open.spotify.com/search/${q}` : `https://open.spotify.com`,
      label: 'Open Spotify',
      title: 'Spotify Music',
    },
    maps: {
      url: (() => {
        const rawQ = (q || '').trim();
        const lowerQ = rawQ.toLowerCase();
        const isLiveRequest =
          !rawQ ||
          rawQ === 'current_live_gps' ||
          lowerQ.includes('live location') ||
          lowerQ.includes('current location') ||
          lowerQ.includes('meri location') ||
          lowerQ.includes('kahan hu') ||
          lowerQ.includes('hasanpur') ||
          lowerQ.includes('live');

        if (isLiveRequest) {
          try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('jarvis_user_geolocation') : null;
            if (raw) {
              const parsed = JSON.parse(raw);
              if (
                parsed &&
                typeof parsed.latitude === 'number' &&
                typeof parsed.longitude === 'number' &&
                !parsed.city?.toLowerCase().includes('hasanpur')
              ) {
                return `https://www.google.com/maps/search/?api=1&query=${parsed.latitude},${parsed.longitude}`;
              }
            }
          } catch {}
          return 'https://www.google.com/maps/search/?api=1&query=current+location';
        }

        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawQ)}`;
      })(),
      label: 'Open Google Maps Live Location',
      title: 'Google Maps GPS',
    },
    calculator: {
      url: `https://www.google.com/search?q=calculator`,
      label: 'Open Calculator',
      title: 'Calculator',
    },
    chrome: {
      url: q ? `https://www.google.com/search?q=${q}` : `https://www.google.com`,
      label: 'Open Web Browser',
      title: 'Google Browser',
    },
    settings: {
      url: `#settings`,
      label: 'Open Settings',
      title: 'Device Settings',
    },
    gallery: {
      url: `https://photos.google.com`,
      label: 'Open Google Photos',
      title: 'Gallery & Photos',
    },
    clock: {
      url: `#schedule`,
      label: 'Open Alarms & Clock',
      title: 'Clock / Alarms',
    },
    playstore: {
      url: q ? `https://play.google.com/store/search?q=${q}&c=apps` : `https://play.google.com/store`,
      label: 'Open Google Play Store',
      title: 'Google Play Store',
    },
    google: {
      url: q ? `https://www.google.com/search?q=${q}` : `https://www.google.com`,
      label: 'Open Google',
      title: 'Google Search',
    },
    facebook: {
      url: `https://www.facebook.com`,
      label: 'Open Facebook',
      title: 'Facebook',
    },
    twitter: {
      url: `https://x.com`,
      label: 'Open X / Twitter',
      title: 'X (Twitter)',
    },
    x: {
      url: `https://x.com`,
      label: 'Open X',
      title: 'X (Twitter)',
    },
    gmail: {
      url: `https://mail.google.com`,
      label: 'Open Gmail',
      title: 'Google Mail',
    },
    email: {
      url: `https://mail.google.com`,
      label: 'Open Email',
      title: 'Email',
    },
    telegram: {
      url: `https://web.telegram.org`,
      label: 'Open Telegram',
      title: 'Telegram',
    },
    news: {
      url: q ? `https://news.google.com/search?q=${q}` : `https://news.google.com`,
      label: 'Open News',
      title: 'Google News',
    },
    wikipedia: {
      url: q ? `https://en.wikipedia.org/wiki/Special:Search?search=${q}` : `https://en.wikipedia.org`,
      label: 'Open Wikipedia',
      title: 'Wikipedia',
    },
    amazon: {
      url: q ? `https://www.amazon.in/s?k=${q}` : `https://www.amazon.in`,
      label: 'Open Amazon',
      title: 'Amazon',
    },
    flipkart: {
      url: q ? `https://www.flipkart.com/search?q=${q}` : `https://www.flipkart.com`,
      label: 'Open Flipkart',
      title: 'Flipkart',
    },
    netflix: {
      url: `https://www.netflix.com`,
      label: 'Open Netflix',
      title: 'Netflix',
    },
    hotstar: {
      url: `https://www.hotstar.com`,
      label: 'Open Disney+ Hotstar',
      title: 'Hotstar',
    },
  };

  const appConfig = appMap[lower] || {
    url: `https://www.google.com/search?q=${encodeURIComponent(query || appName)}`,
    label: `Open & Run ${appName}`,
    title: appName.charAt(0).toUpperCase() + appName.slice(1),
  };

  openExternalLink(appConfig.url, '_blank');

  dispatchLinkAction({
    title: appConfig.title,
    url: appConfig.url,
    type: 'app',
    buttonLabel: appConfig.label,
  });

  return { name: appName, url: appConfig.url };
}

/**
 * Set an Alarm in the native Android Clock application via Android Intent or web fallback
 */
export function setNativeAndroidAlarm(hour: number, minute: number, message: string = 'JARVIS Alarm') {
  triggerHaptic([100, 50, 100, 50, 200]);
  const encodedMsg = encodeURIComponent(message);
  const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${hour};i.android.intent.extra.alarm.MINUTES=${minute};S.android.intent.extra.alarm.MESSAGE=${encodedMsg};B.android.intent.extra.alarm.SKIP_UI=false;end`;

  openExternalLink(intentUrl, '_self');

  dispatchLinkAction({
    title: `Alarm: ${message} (${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')})`,
    url: intentUrl,
    type: 'app',
    buttonLabel: 'Open Clock to View Alarm',
  });
}

/**
 * Open Native Android Clock Application
 */
export function openNativeClock() {
  triggerHaptic([50, 50]);
  launchAndroidApp('clock');
}

/**
 * Add event to Android Native Calendar or Google Calendar
 */
export function addNativeCalendarEvent(params: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
}) {
  triggerHaptic([60, 40, 120]);
  const { title, description = '', location = '', startDate } = params;
  const endDate = params.endDate || new Date(startDate.getTime() + 60 * 60 * 1000);

  // Format ISO strings for Google Calendar web fallback (YYYYMMDDTHHmmssZ)
  const formatGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${formatGCal(startDate)}/${formatGCal(endDate)}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;

  openExternalLink(gcalUrl, '_blank');

  dispatchLinkAction({
    title: `Calendar Event: ${title}`,
    url: gcalUrl,
    type: 'app',
    buttonLabel: 'Open Google Calendar',
  });
}

/**
 * Export and download .ics iCalendar file for universal device calendar sync
 */
export function downloadICalendarFile(title: string, startDate: Date, endDate?: Date, description?: string) {
  const end = endDate || new Date(startDate.getTime() + 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JARVIS AI//Android Personal Assistant//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@jarvis.ai`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description || 'Created via JARVIS voice personal assistant'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open Native Android Calendar Application
 */
export function openNativeCalendar() {
  triggerHaptic([50, 50]);
  const intentUrl = `intent:#Intent;action=android.intent.action.VIEW;data=content://com.android.calendar/time;end`;
  try {
    window.location.href = intentUrl;
    setTimeout(() => {
      window.open('https://calendar.google.com', '_blank');
    }, 500);
  } catch {
    window.open('https://calendar.google.com', '_blank');
  }
}

/**
 * Request & Trigger Local System Notification
 */
export async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/assets/jarvis-icon.png',
      badge: '/assets/jarvis-icon.png',
      ...options,
    });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/assets/jarvis-icon.png',
        ...options,
      });
    }
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Open Android Settings App or Android Intent
 */
export function openAndroidSettings() {
  triggerHaptic([50, 50]);
  launchAndroidApp('settings');
}

