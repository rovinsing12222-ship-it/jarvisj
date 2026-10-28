// Catalog of Installed Android Applications & Quick Access Launcher Store
// Allows users to pin custom Android app launchers to the PC Control Quick Access Bar

import { triggerHaptic } from './hapticEngine';
import { launchAndroidApp } from './deviceHardware';

export interface InstalledAndroidApp {
  id: string;
  packageName: string;
  name: string;
  category:
    | 'Social & Chat'
    | 'Media & Audio'
    | 'Productivity'
    | 'Navigation & Travel'
    | 'Finance & UPI'
    | 'Shopping & Food'
    | 'System & Utilities'
    | 'Government & Citizen'
    | 'Custom';
  icon: string;
  description: string;
  version?: string;
  size?: string;
  deepLinkUrl?: string;
  isSystemApp?: boolean;
}

export interface CustomAndroidLauncher {
  id: string;
  appId: string;
  name: string;
  packageName: string;
  icon: string;
  category: string;
  deepLinkUrl?: string;
  pinnedAt: number;
  customQuery?: string;
  isCustom?: boolean;
}

// Comprehensive catalog of installed Android applications on the device
export const DEFAULT_INSTALLED_ANDROID_APPS: InstalledAndroidApp[] = [
  // Social & Chat
  {
    id: 'whatsapp',
    packageName: 'com.whatsapp',
    name: 'WhatsApp',
    category: 'Social & Chat',
    icon: '💬',
    description: 'Instant messaging, voice & video calling for Android',
    version: '2.24.18.75',
    size: '68 MB',
    deepLinkUrl: 'https://wa.me/',
  },
  {
    id: 'instagram',
    packageName: 'com.instagram.android',
    name: 'Instagram',
    category: 'Social & Chat',
    icon: '📸',
    description: 'Photos, reels, stories & direct messaging',
    version: '318.0.0',
    size: '54 MB',
    deepLinkUrl: 'https://www.instagram.com',
  },
  {
    id: 'telegram',
    packageName: 'org.telegram.messenger',
    name: 'Telegram',
    category: 'Social & Chat',
    icon: '✈️',
    description: 'Fast, secure cloud-based messaging & channels',
    version: '10.8.1',
    size: '72 MB',
    deepLinkUrl: 'https://web.telegram.org',
  },
  {
    id: 'twitter',
    packageName: 'com.twitter.android',
    name: 'X (Twitter)',
    category: 'Social & Chat',
    icon: '🐦',
    description: 'Breaking news, trends & real-time discussions',
    version: '10.42.0',
    size: '42 MB',
    deepLinkUrl: 'https://x.com',
  },

  // Media & Audio
  {
    id: 'youtube',
    packageName: 'com.google.android.youtube',
    name: 'YouTube',
    category: 'Media & Audio',
    icon: '▶️',
    description: 'Official YouTube Android app for videos, music & shorts',
    version: '19.22.36',
    size: '124 MB',
    deepLinkUrl: 'https://www.youtube.com',
  },
  {
    id: 'spotify',
    packageName: 'com.spotify.music',
    name: 'Spotify Music',
    category: 'Media & Audio',
    icon: '🎵',
    description: 'Millions of songs, curated playlists & podcasts',
    version: '8.9.28',
    size: '38 MB',
    deepLinkUrl: 'https://open.spotify.com',
  },
  {
    id: 'netflix',
    packageName: 'com.netflix.mediaclient',
    name: 'Netflix',
    category: 'Media & Audio',
    icon: '🎬',
    description: 'Stream movies, series & documentaries',
    version: '8.104.0',
    size: '58 MB',
    deepLinkUrl: 'https://www.netflix.com',
  },
  {
    id: 'hotstar',
    packageName: 'in.startv.hotstar',
    name: 'Disney+ Hotstar',
    category: 'Media & Audio',
    icon: '⭐',
    description: 'Live cricket, blockbuster movies & specials',
    version: '24.03.11',
    size: '46 MB',
    deepLinkUrl: 'https://www.hotstar.com',
  },

  // Navigation & Travel
  {
    id: 'maps',
    packageName: 'com.google.android.apps.maps',
    name: 'Google Maps',
    category: 'Navigation & Travel',
    icon: '🗺️',
    description: 'GPS turn-by-turn navigation, live traffic & local search',
    version: '11.125.01',
    size: '95 MB',
    deepLinkUrl: 'https://maps.google.com',
  },
  {
    id: 'uber',
    packageName: 'com.ubercab',
    name: 'Uber',
    category: 'Navigation & Travel',
    icon: '🚗',
    description: 'Request rides, intercity cabs & moto rides',
    version: '4.512.1',
    size: '64 MB',
    deepLinkUrl: 'https://m.uber.com',
  },
  {
    id: 'irctc',
    packageName: 'cris.org.in.prs.ima',
    name: 'IRCTC Rail Connect',
    category: 'Navigation & Travel',
    icon: '🚆',
    description: 'Indian Railways train ticket booking & PNR status',
    version: '4.2.30',
    size: '34 MB',
    deepLinkUrl: 'https://www.irctc.co.in',
  },

  // Finance & UPI
  {
    id: 'phonepe',
    packageName: 'com.phonepe.app',
    name: 'PhonePe',
    category: 'Finance & UPI',
    icon: '🟣',
    description: 'Instant UPI money transfer, recharges & bill payments',
    version: '24.04.12',
    size: '56 MB',
    deepLinkUrl: 'phonepe://pay',
  },
  {
    id: 'gpay',
    packageName: 'com.google.android.apps.nbu.paisa.user',
    name: 'Google Pay (GPay)',
    category: 'Finance & UPI',
    icon: '💳',
    description: 'Fast, secure cashless payments via UPI',
    version: '182.1.2',
    size: '48 MB',
    deepLinkUrl: 'upi://pay',
  },
  {
    id: 'paytm',
    packageName: 'net.one97.paytm',
    name: 'Paytm UPI & Wallet',
    category: 'Finance & UPI',
    icon: '🔵',
    description: 'UPI payments, wallet, soundbox & fastag recharges',
    version: '10.36.0',
    size: '62 MB',
    deepLinkUrl: 'paytmmp://pay',
  },

  // Productivity & Office
  {
    id: 'gmail',
    packageName: 'com.google.android.gm',
    name: 'Gmail',
    category: 'Productivity',
    icon: '✉️',
    description: 'Secure, smart email with spam protection',
    version: '2024.05.05',
    size: '52 MB',
    deepLinkUrl: 'https://mail.google.com',
  },
  {
    id: 'chrome',
    packageName: 'com.android.chrome',
    name: 'Google Chrome Mobile',
    category: 'Productivity',
    icon: '🌐',
    description: 'Fast & safe web browsing on Android',
    version: '125.0.6422',
    size: '140 MB',
    deepLinkUrl: 'https://www.google.com',
  },
  {
    id: 'drive',
    packageName: 'com.google.android.apps.docs',
    name: 'Google Drive',
    category: 'Productivity',
    icon: '📂',
    description: 'Cloud backup, file storage & document scanning',
    version: '2.24.207',
    size: '76 MB',
    deepLinkUrl: 'https://drive.google.com',
  },

  // Shopping & Food
  {
    id: 'amazon',
    packageName: 'com.amazon.mShop.android.shopping',
    name: 'Amazon India',
    category: 'Shopping & Food',
    icon: '📦',
    description: 'Online shopping, deals, orders & prime delivery',
    version: '28.10.2',
    size: '88 MB',
    deepLinkUrl: 'https://www.amazon.in',
  },
  {
    id: 'flipkart',
    packageName: 'com.flipkart.android',
    name: 'Flipkart',
    category: 'Shopping & Food',
    icon: '🛍️',
    description: 'Electronics, fashion, mobiles & supercoins',
    version: '7.85',
    size: '45 MB',
    deepLinkUrl: 'https://www.flipkart.com',
  },
  {
    id: 'swiggy',
    packageName: 'in.swiggy.android',
    name: 'Swiggy Food & Instamart',
    category: 'Shopping & Food',
    icon: '🍔',
    description: 'Quick restaurant delivery & 10-minute groceries',
    version: '5.18.2',
    size: '52 MB',
    deepLinkUrl: 'https://www.swiggy.com',
  },
  {
    id: 'zomato',
    packageName: 'com.application.zomato',
    name: 'Zomato',
    category: 'Shopping & Food',
    icon: '🍕',
    description: 'Order food, dining out & live tracking',
    version: '17.8.2',
    size: '64 MB',
    deepLinkUrl: 'https://www.zomato.com',
  },

  // System & Utilities
  {
    id: 'camera',
    packageName: 'com.android.camera',
    name: 'System Camera',
    category: 'System & Utilities',
    icon: '📷',
    description: 'High-res photos, 4K video recording & portrait mode',
    version: '5.1.0',
    size: '22 MB',
    isSystemApp: true,
  },
  {
    id: 'calculator',
    packageName: 'com.google.android.calculator',
    name: 'Calculator',
    category: 'System & Utilities',
    icon: '🔢',
    description: 'Standard, scientific & conversion calculations',
    version: '8.4',
    size: '14 MB',
    isSystemApp: true,
  },
  {
    id: 'photos',
    packageName: 'com.google.android.apps.photos',
    name: 'Google Photos',
    category: 'System & Utilities',
    icon: '🖼️',
    description: 'Photo gallery, cloud backup & AI magic eraser',
    version: '6.84.0',
    size: '80 MB',
    deepLinkUrl: 'https://photos.google.com',
  },
  {
    id: 'settings',
    packageName: 'com.android.settings',
    name: 'Android Settings',
    category: 'System & Utilities',
    icon: '⚙️',
    description: 'Device hardware, network, display & security preferences',
    version: 'Android 15',
    size: '30 MB',
    isSystemApp: true,
  },

  // Government & Citizen
  {
    id: 'digilocker',
    packageName: 'com.digilocker.android',
    name: 'DigiLocker',
    category: 'Government & Citizen',
    icon: '🏛️',
    description: 'Govt. of India verified digital documents & certificates',
    version: '6.4.2',
    size: '38 MB',
    deepLinkUrl: 'https://www.digilocker.gov.in',
  },
  {
    id: 'umang',
    packageName: 'in.gov.umang.negd.g2c',
    name: 'UMANG Citizen Services',
    category: 'Government & Citizen',
    icon: '🇮🇳',
    description: 'Unified Mobile App for New-age Governance (EPFO, Aadhaar, Kisan)',
    version: '4.2.1',
    size: '40 MB',
    deepLinkUrl: 'https://web.umang.gov.in',
  },
  {
    id: 'jarvis_companion',
    packageName: 'com.rovinpal.jarvis',
    name: 'Jarvis Mobile Bridge Core',
    category: 'System & Utilities',
    icon: '🤖',
    description: 'Native Android bridge for hardware, telephony & wake sensor',
    version: '2.5.0-Release',
    size: '28 MB',
    isSystemApp: true,
  },
];

const STORAGE_KEY_QUICK_LAUNCHERS = 'jarvis_pc_quick_access_android_launchers';
const STORAGE_KEY_CUSTOM_APPS = 'jarvis_pc_custom_registered_android_apps';

// Default initial pinned Android launchers in Quick Access Bar
export const INITIAL_DEFAULT_LAUNCHERS: CustomAndroidLauncher[] = [
  {
    id: 'launcher-whatsapp',
    appId: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    icon: '💬',
    category: 'Social & Chat',
    deepLinkUrl: 'https://wa.me/',
    pinnedAt: Date.now() - 50000,
  },
  {
    id: 'launcher-youtube',
    appId: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    icon: '▶️',
    category: 'Media & Audio',
    deepLinkUrl: 'https://www.youtube.com',
    pinnedAt: Date.now() - 40000,
  },
  {
    id: 'launcher-maps',
    appId: 'maps',
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    icon: '🗺️',
    category: 'Navigation & Travel',
    deepLinkUrl: 'https://maps.google.com',
    pinnedAt: Date.now() - 30000,
  },
  {
    id: 'launcher-phonepe',
    appId: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    icon: '🟣',
    category: 'Finance & UPI',
    deepLinkUrl: 'phonepe://pay',
    pinnedAt: Date.now() - 20000,
  },
  {
    id: 'launcher-spotify',
    appId: 'spotify',
    name: 'Spotify Music',
    packageName: 'com.spotify.music',
    icon: '🎵',
    category: 'Media & Audio',
    deepLinkUrl: 'https://open.spotify.com',
    pinnedAt: Date.now() - 10000,
  },
];

/**
 * Retrieve all installed Android apps (defaults + user-registered custom APKs)
 */
export function getAllInstalledAndroidApps(): InstalledAndroidApp[] {
  if (typeof window === 'undefined') return DEFAULT_INSTALLED_ANDROID_APPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_APPS);
    if (!raw) return DEFAULT_INSTALLED_ANDROID_APPS;
    const customApps: InstalledAndroidApp[] = JSON.parse(raw);
    const customList = Array.isArray(customApps) ? customApps : [];
    // Merge without duplicates by packageName
    const existingPkgs = new Set(DEFAULT_INSTALLED_ANDROID_APPS.map((a) => a.packageName));
    const merged = [...DEFAULT_INSTALLED_ANDROID_APPS];
    for (const app of customList) {
      if (!existingPkgs.has(app.packageName)) {
        merged.push(app);
        existingPkgs.add(app.packageName);
      }
    }
    return merged;
  } catch (e) {
    console.warn('[InstalledApps] Error loading custom apps:', e);
    return DEFAULT_INSTALLED_ANDROID_APPS;
  }
}

/**
 * Register a new custom Android app into the installed apps catalog
 */
export function registerCustomAndroidApp(app: Omit<InstalledAndroidApp, 'id'>): InstalledAndroidApp {
  const newApp: InstalledAndroidApp = {
    ...app,
    id: `custom-app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_APPS);
      const existing: InstalledAndroidApp[] = raw ? JSON.parse(raw) : [];
      existing.unshift(newApp);
      localStorage.setItem(STORAGE_KEY_CUSTOM_APPS, JSON.stringify(existing));
    } catch (e) {
      console.warn('[InstalledApps] Failed to save custom app:', e);
    }
  }
  return newApp;
}

/**
 * Load saved Quick Access Android Launchers from localStorage
 */
export function getSavedQuickAccessLaunchers(): CustomAndroidLauncher[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_LAUNCHERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUICK_LAUNCHERS);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY_QUICK_LAUNCHERS,
        JSON.stringify(INITIAL_DEFAULT_LAUNCHERS)
      );
      return INITIAL_DEFAULT_LAUNCHERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEFAULT_LAUNCHERS;
  } catch (e) {
    console.warn('[InstalledApps] Error loading quick launchers:', e);
    return INITIAL_DEFAULT_LAUNCHERS;
  }
}

/**
 * Save updated Quick Access Android Launchers list
 */
export function saveQuickAccessLaunchers(launchers: CustomAndroidLauncher[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QUICK_LAUNCHERS, JSON.stringify(launchers));
    window.dispatchEvent(
      new CustomEvent('jarvis:pc-quick-access-updated', { detail: launchers })
    );
  } catch (e) {
    console.warn('[InstalledApps] Error saving quick launchers:', e);
  }
}

/**
 * Add an installed app to the Quick Access Bar
 */
export function addAppToQuickAccess(
  app: InstalledAndroidApp,
  customQuery?: string
): CustomAndroidLauncher {
  triggerHaptic([30, 20]);
  const current = getSavedQuickAccessLaunchers();
  // Check if already pinned
  const existing = current.find((l) => l.packageName === app.packageName);
  if (existing) {
    return existing;
  }

  const newLauncher: CustomAndroidLauncher = {
    id: `launcher-${app.id}-${Date.now()}`,
    appId: app.id,
    name: app.name,
    packageName: app.packageName,
    icon: app.icon,
    category: app.category,
    deepLinkUrl: app.deepLinkUrl,
    pinnedAt: Date.now(),
    customQuery,
    isCustom: app.category === 'Custom',
  };

  const updated = [...current, newLauncher];
  saveQuickAccessLaunchers(updated);
  return newLauncher;
}

/**
 * Remove an app launcher from the Quick Access Bar
 */
export function removeAppFromQuickAccess(launcherId: string): void {
  triggerHaptic([20]);
  const current = getSavedQuickAccessLaunchers();
  const updated = current.filter((l) => l.id !== launcherId);
  saveQuickAccessLaunchers(updated);
}

/**
 * Execute launching an Android App from the PC Control workspace
 */
export function dispatchAndroidAppLaunch(
  launcher: CustomAndroidLauncher,
  query?: string
): { success: boolean; message: string; targetUrl: string } {
  triggerHaptic([40, 30, 50]);

  // Use deepLinkUrl if provided or standard universal handler
  const targetQuery = query || launcher.customQuery;
  const launchResult = launchAndroidApp(launcher.appId || launcher.name, targetQuery);

  const message = `Launching Android App "${launcher.name}" (${launcher.packageName})`;

  // Broadcast event for audio/HUD tracking
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('jarvis:android-app-launched', {
        detail: {
          launcher,
          query: targetQuery,
          timestamp: Date.now(),
        },
      })
    );
  }

  return {
    success: true,
    message,
    targetUrl: launcher.deepLinkUrl || launchResult.url,
  };
}
