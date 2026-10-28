export interface UserLocationResult {
  city: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'ip' | 'cache' | 'default';
  isAutoDetected: boolean;
}

const STORAGE_KEY = 'jarvis_user_geolocation';

/**
 * Purges inaccurate cell-tower / stale location cache (such as Hasanpur IP false positives)
 */
export function purgeErroneousLocationCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.debug('[GeolocationService] Purged stale/inaccurate geolocation cache');
  } catch (err) {
    console.warn('[GeolocationService] Failed to clear geolocation cache:', err);
  }
}

/**
 * Reads cached location from localStorage for instant rendering.
 * Automatically discards inaccurate 'Hasanpur' IP cell-tower false positives.
 */
export function getCachedUserLocation(): UserLocationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number' && parsed.city) {
      // Discard inaccurate 'Hasanpur' IP geolocation false positive
      if (typeof parsed.city === 'string' && parsed.city.toLowerCase().includes('hasanpur')) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return { ...parsed, source: 'cache' };
    }
  } catch (err) {
    console.warn('[GeolocationService] Failed to read cached location:', err);
  }
  return null;
}

/**
 * Saves detected location to localStorage
 */
export function cacheUserLocation(loc: UserLocationResult): void {
  if (typeof window === 'undefined') return;
  try {
    // Never persist erroneous Hasanpur false-positive
    if (loc.city && loc.city.toLowerCase().includes('hasanpur')) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch (err) {
    console.warn('[GeolocationService] Failed to cache location:', err);
  }
}

/**
 * Resolves city and country from GPS latitude and longitude using reverse-geocoding
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{ city: string; country: string; region?: string }> {
  // 1. Try BigDataCloud reverse geocode client API (fast, CORS-friendly, free, high precision)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        data.localityInfo?.administrative?.[2]?.name ||
        data.localityInfo?.administrative?.[1]?.name;
      if (city) {
        return {
          city,
          country: data.countryCode || data.countryName || '',
          region: data.principalSubdivision,
        };
      }
    }
  } catch (err) {
    console.debug('[GeolocationService] BigDataCloud reverse-geocode failed:', err);
  }

  // 2. Try OpenStreetMap Nominatim reverse geocode fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.state;
      if (city) {
        return {
          city,
          country: addr.country_code ? addr.country_code.toUpperCase() : addr.country || '',
          region: addr.state,
        };
      }
    }
  } catch (err) {
    console.debug('[GeolocationService] Nominatim reverse-geocode failed:', err);
  }

  // 3. Coordinate label fallback
  return {
    city: `GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    country: '',
  };
}

/**
 * Resolves location using IP-based Geolocation (works 100% in sandboxed iframes & mobile browsers without permission prompts)
 */
export async function getIpGeolocation(): Promise<UserLocationResult | null> {
  // 1. Try BigDataCloud client IP locator (calling without lat/lon auto-locates caller IP)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      const city = data.city || data.locality || data.principalSubdivision;
      if (!isNaN(lat) && !isNaN(lon) && city) {
        return {
          city,
          country: data.countryCode || data.countryName || '',
          region: data.principalSubdivision,
          latitude: lat,
          longitude: lon,
          source: 'ip',
          isAutoDetected: true,
        };
      }
    }
  } catch (err) {
    console.debug('[GeolocationService] BigDataCloud IP locate failed:', err);
  }

  // 2. Try server-side proxy /api/geolocation
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/geolocation', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json && json.latitude && json.longitude && json.city) {
        return {
          city: json.city,
          country: json.country || '',
          region: json.region,
          latitude: json.latitude,
          longitude: json.longitude,
          source: 'ip',
          isAutoDetected: true,
        };
      }
    }
  } catch (err) {
    console.debug('[GeolocationService] Server /api/geolocation proxy failed:', err);
  }

  // 3. Try ipapi.co fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude && (data.city || data.region)) {
        return {
          city: data.city || data.region,
          country: data.country_code || data.country_name || '',
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
          isAutoDetected: true,
        };
      }
    }
  } catch (err) {
    console.debug('[GeolocationService] ipapi.co fallback failed:', err);
  }

  return null;
}

/**
 * Automatically discovers user's current city and coordinates using:
 * 1. Hardware GPS (navigator.geolocation) if available & permitted
 * 2. Instant IP-based Network Geolocation fallback (no permission required, works in iframe)
 * 3. Cached previous location
 * 4. Default baseline (New Delhi, IN)
 */
export async function autoDetectUserCityAndCoords(forceRefresh = false): Promise<UserLocationResult> {
  // Step 1: Check localStorage cache FIRST for instant 0ms app boot (if not forcing refresh)
  if (!forceRefresh) {
    const cached = getCachedUserLocation();
    if (cached) {
      return cached;
    }
  }

  // Step 2: Check if browser supports GPS with high accuracy
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const gpsResult = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 3500, maximumAge: 0 }
        );
      });

      const lat = gpsResult.coords.latitude;
      const lon = gpsResult.coords.longitude;
      const geoInfo = await reverseGeocodeCoords(lat, lon);

      // Discard inaccurate Hasanpur false positive
      const safeCity = geoInfo.city?.toLowerCase().includes('hasanpur')
        ? `GPS Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
        : geoInfo.city;

      const resolved: UserLocationResult = {
        city: safeCity,
        country: geoInfo.country,
        region: geoInfo.region,
        latitude: lat,
        longitude: lon,
        source: 'gps',
        isAutoDetected: true,
      };

      cacheUserLocation(resolved);
      return resolved;
    } catch (gpsError) {
      console.debug('[GeolocationService] GPS position unavailable or timed out, checking IP Geolocation:', gpsError);
    }
  }

  // Step 3: IP-based Network Geolocation (Auto-resolves current city without permission prompt)
  const ipResult = await getIpGeolocation();
  if (ipResult) {
    if (!ipResult.city.toLowerCase().includes('hasanpur')) {
      cacheUserLocation(ipResult);
      return ipResult;
    }
  }

  // Step 4: Ultimate Baseline (New Delhi, IN)
  return {
    city: 'New Delhi',
    country: 'IN',
    region: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    source: 'default',
    isAutoDetected: false,
  };
}

/**
 * Actively requests real-time High-Accuracy GPS coordinates from hardware sensor
 */
export async function getHighAccuracyLiveLocation(timeoutMs = 9000): Promise<UserLocationResult> {
  purgeErroneousLocationCache();

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
        );
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const geoInfo = await reverseGeocodeCoords(lat, lon);

      const cleanCity = geoInfo.city && !geoInfo.city.toLowerCase().includes('hasanpur')
        ? geoInfo.city
        : `Live GPS (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;

      const liveLoc: UserLocationResult = {
        city: cleanCity,
        country: geoInfo.country || 'IN',
        region: geoInfo.region,
        latitude: lat,
        longitude: lon,
        source: 'gps',
        isAutoDetected: true,
      };

      cacheUserLocation(liveLoc);
      return liveLoc;
    } catch (err) {
      console.warn('[GeolocationService] Live high-accuracy GPS query error:', err);
    }
  }

  // Fallback to autoDetect with refresh
  return autoDetectUserCityAndCoords(true);
}

/**
 * Opens Google Maps pointed directly at user's true current live GPS coordinates
 */
export function openGoogleMapsLiveLocation(coords?: { lat: number; lon: number } | null): void {
  let targetUrl = 'https://www.google.com/maps/search/?api=1&query=current+location';

  if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
    targetUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
  } else {
    const cached = getCachedUserLocation();
    if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
      targetUrl = `https://www.google.com/maps/search/?api=1&query=${cached.latitude},${cached.longitude}`;
    }
  }

  try {
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (isAndroid && coords) {
      window.location.href = `geo:${coords.lat},${coords.lon}?q=${coords.lat},${coords.lon}(Live Location)`;
      setTimeout(() => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }, 500);
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.warn('[GeolocationService] Failed to open Google Maps:', err);
    window.location.href = targetUrl;
  }
}

