/**
 * Screen Wake Lock Utility
 * Keeps phone screen continuously active like a PC background process.
 * Prevents mobile display from dimming, timing out, or sleeping while JARVIS/Mayra is active.
 */

let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      console.log('[WakeLock] Screen Wake Lock acquired: display will remain active.');
      
      wakeLockSentinel.addEventListener('release', () => {
        console.log('[WakeLock] Screen Wake Lock released');
      });
      return true;
    } catch (err) {
      console.warn('[WakeLock] Failed to acquire Screen Wake Lock:', err);
      return false;
    }
  }
  return false;
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (err) {
      console.warn('[WakeLock] Error releasing wake lock:', err);
    }
    wakeLockSentinel = null;
  }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}
