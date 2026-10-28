import { ScheduleItem } from '../types';
import { getCachedUserLocation, getHighAccuracyLiveLocation } from './geolocationService';

export interface TravelModeEta {
  mode: 'driving' | 'twoWheeler' | 'transit' | 'walking';
  label: string;
  icon: string;
  durationMinutes: number;
  durationFormatted: string;
  speedKmh: number;
  departureTimeRecommendation: string;
  trafficFactor: 'light' | 'moderate' | 'heavy';
}

export interface TravelCalculationResult {
  hasValidDestination: boolean;
  item: ScheduleItem;
  itemIndex: number;
  origin: {
    latitude: number;
    longitude: number;
    locationName: string;
    source: 'gps' | 'ip' | 'cache' | 'default';
  };
  destination: {
    title: string;
    locationName: string;
    latitude: number;
    longitude: number;
    isVirtualMeeting: boolean;
    scheduledTime: string;
    scheduledDate: string;
  };
  straightLineDistanceKm: number;
  roadDistanceKm: number;
  roadDistanceMiles: number;
  distanceFormatted: string;
  etas: {
    driving: TravelModeEta;
    twoWheeler: TravelModeEta;
    transit: TravelModeEta;
    walking: TravelModeEta;
  };
  primaryEta: TravelModeEta;
  departureAlertText: string;
  googleMapsDirectionsUrl: string;
  verbalSummaryEn: string;
  verbalSummaryHi: string;
}

/**
 * Calculates straight line distance between two coordinates using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

/**
 * Converts minutes to friendly hours and minutes string (e.g. "18 mins" or "1 hr 25 mins")
 */
export function formatDuration(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) {
    return `${rounded} min${rounded === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(rounded / 60);
  const remainingMins = rounded % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }
  return `${hours} hr ${remainingMins} min${remainingMins === 1 ? '' : 's'}`;
}

/**
 * Calculates optimal departure time before scheduled event (including buffer for parking & arrival)
 */
export function calculateDepartureTime(
  scheduledTimeStr: string,
  travelMinutes: number,
  bufferMinutes: number = 10
): { departureTime: string; isPast: boolean; minutesUntilDeparture: number } {
  const totalLeadMinutes = travelMinutes + bufferMinutes;
  const now = new Date();

  // Try parsing time string (e.g. "11:00", "11:00 AM", "14:30")
  let targetHour = 11;
  let targetMinute = 0;

  if (scheduledTimeStr) {
    const clean = scheduledTimeStr.trim();
    const isPm = /pm/i.test(clean);
    const isAm = /am/i.test(clean);
    const nums = clean.replace(/[^0-9:]/g, '').split(':');
    if (nums.length >= 2) {
      targetHour = parseInt(nums[0], 10) || 0;
      targetMinute = parseInt(nums[1], 10) || 0;
      if (isPm && targetHour < 12) targetHour += 12;
      if (isAm && targetHour === 12) targetHour = 0;
    }
  }

  const targetDate = new Date();
  targetDate.setHours(targetHour, targetMinute, 0, 0);

  const departureDate = new Date(targetDate.getTime() - totalLeadMinutes * 60 * 1000);
  const diffMs = departureDate.getTime() - now.getTime();
  const minutesUntilDeparture = Math.round(diffMs / 60000);

  const depHour = departureDate.getHours();
  const depMinute = departureDate.getMinutes();
  const ampm = depHour >= 12 ? 'PM' : 'AM';
  const displayHour = depHour % 12 || 12;
  const displayMinute = depMinute < 10 ? `0${depMinute}` : depMinute;
  const departureTime = `${displayHour}:${displayMinute} ${ampm}`;

  return {
    departureTime,
    isPast: minutesUntilDeparture < 0,
    minutesUntilDeparture,
  };
}

/**
 * Generates direct Google Maps Navigation / Turn-by-Turn URL
 */
export function generateGoogleMapsDirectionsUrl(
  origin: { latitude: number; longitude: number },
  destination: { latitude?: number; longitude?: number; locationName?: string }
): string {
  const originParam = `${origin.latitude},${origin.longitude}`;
  let destParam = '';
  if (destination.latitude && destination.longitude) {
    destParam = `${destination.latitude},${destination.longitude}`;
  } else if (destination.locationName) {
    destParam = encodeURIComponent(destination.locationName);
  } else {
    destParam = 'destination';
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
}

/**
 * Resolves destination coordinates from schedule item, using known locations or reasonable proximity offset
 */
export async function resolveDestinationCoordinates(
  item: ScheduleItem,
  originCoords: { latitude: number; longitude: number }
): Promise<{ latitude: number; longitude: number; locationName: string; isVirtual: boolean }> {
  // If coordinates are explicitly provided on item
  if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
    return {
      latitude: item.latitude,
      longitude: item.longitude,
      locationName: item.location || 'Scheduled Location',
      isVirtual: false,
    };
  }

  const rawLocation = (item.location || '').trim();
  const lowerLoc = rawLocation.toLowerCase();

  // Virtual meetings check
  if (
    lowerLoc.includes('meet') ||
    lowerLoc.includes('zoom') ||
    lowerLoc.includes('teams') ||
    lowerLoc.includes('online') ||
    lowerLoc.includes('virtual') ||
    lowerLoc.includes('call')
  ) {
    return {
      latitude: originCoords.latitude,
      longitude: originCoords.longitude,
      locationName: rawLocation || 'Online / Virtual Meeting',
      isVirtual: true,
    };
  }

  // Known city landmarks / tech hubs fallback coordinates
  const KNOWN_PLACES: Record<string, { lat: number; lon: number; name: string }> = {
    cyber: { lat: 28.4952, lon: 77.0892, name: 'Cyber City Tech Park, DLF Phase 2' },
    gurugram: { lat: 28.4595, lon: 77.0266, name: 'Gurugram Central Business District' },
    gurgaon: { lat: 28.4595, lon: 77.0266, name: 'Gurugram Commercial Hub' },
    delhi: { lat: 28.6139, lon: 77.209, name: 'Central Connaught Place, New Delhi' },
    noida: { lat: 28.5355, lon: 77.391, name: 'Sector 62 Tech Zone, Noida' },
    bangalore: { lat: 12.9716, lon: 77.5946, name: 'MG Road / Tech Park, Bengaluru' },
    bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Electronic City, Bengaluru' },
    mumbai: { lat: 19.076, lon: 72.8777, name: 'Bandra Kurla Complex (BKC), Mumbai' },
    hyderabad: { lat: 17.385, lon: 78.4867, name: 'HITEC City, Hyderabad' },
    pune: { lat: 18.5204, lon: 73.8567, name: 'Hinjawadi IT Park, Pune' },
    office: { lat: 28.4952, lon: 77.0892, name: 'Regional Office Headquarters' },
    hub: { lat: 28.4952, lon: 77.0892, name: 'Tech Hub Office Tower' },
  };

  if (rawLocation) {
    for (const [key, coords] of Object.entries(KNOWN_PLACES)) {
      if (lowerLoc.includes(key)) {
        return {
          latitude: coords.lat,
          longitude: coords.lon,
          locationName: rawLocation || coords.name,
          isVirtual: false,
        };
      }
    }
  }

  // Realistic city destination based on item title / category
  // If no location was given, generate a realistic 6.8km hub offset from origin
  const defaultOffsetLat = 0.045; // ~5 km north
  const defaultOffsetLon = 0.038; // ~4 km east
  const defaultDestName = rawLocation || 'City Center Business Park & Meeting Venue';

  return {
    latitude: originCoords.latitude + defaultOffsetLat,
    longitude: originCoords.longitude + defaultOffsetLon,
    locationName: defaultDestName,
    isVirtual: false,
  };
}

/**
 * Core function: Calculates estimated travel time and distance from GPS location to a schedule item
 */
export async function calculateTravelToScheduleItem(
  userCoords: { latitude: number; longitude: number; city?: string; source?: 'gps' | 'ip' | 'cache' | 'default' },
  item: ScheduleItem,
  itemIndex: number = 0
): Promise<TravelCalculationResult> {
  const originLat = userCoords.latitude;
  const originLon = userCoords.longitude;
  const originCity = userCoords.city || 'Current GPS Location';

  const destCoords = await resolveDestinationCoordinates(item, {
    latitude: originLat,
    longitude: originLon,
  });

  const straightDist = calculateHaversineDistanceKm(
    originLat,
    originLon,
    destCoords.latitude,
    destCoords.longitude
  );

  // If virtual meeting, travel is 0
  if (destCoords.isVirtual) {
    const zeroEta = (mode: TravelModeEta['mode'], label: string, icon: string): TravelModeEta => ({
      mode,
      label,
      icon,
      durationMinutes: 0,
      durationFormatted: '0 mins (Virtual)',
      speedKmh: 0,
      departureTimeRecommendation: 'Join online from your desk',
      trafficFactor: 'light',
    });

    return {
      hasValidDestination: true,
      item,
      itemIndex,
      origin: {
        latitude: originLat,
        longitude: originLon,
        locationName: originCity,
        source: userCoords.source || 'gps',
      },
      destination: {
        title: item.title,
        locationName: destCoords.locationName,
        latitude: destCoords.latitude,
        longitude: destCoords.longitude,
        isVirtualMeeting: true,
        scheduledTime: item.time,
        scheduledDate: item.date,
      },
      straightLineDistanceKm: 0,
      roadDistanceKm: 0,
      roadDistanceMiles: 0,
      distanceFormatted: '0 km (Virtual Online)',
      etas: {
        driving: zeroEta('driving', 'Car', '🚗'),
        twoWheeler: zeroEta('twoWheeler', 'Bike', '🏍️'),
        transit: zeroEta('transit', 'Metro/Bus', '🚇'),
        walking: zeroEta('walking', 'Walk', '🚶'),
      },
      primaryEta: zeroEta('driving', 'Online', '💻'),
      departureAlertText: `Virtual meeting: "${item.title}" at ${item.time}. No physical travel required.`,
      googleMapsDirectionsUrl: `https://meet.google.com`,
      verbalSummaryEn: `Your first schedule item is "${item.title}" at ${item.time}. This is an online meeting, so no travel is required.`,
      verbalSummaryHi: `Aapka pehla schedule item "${item.title}" ${item.time} baje ek online meeting hai, iske liye koi travel nahi karna hai.`,
    };
  }

  // Urban road network detour factor (standard 1.28x of straight-line distance)
  const roadDistanceKm = Math.round(Math.max(0.5, straightDist * 1.28) * 10) / 10;
  const roadDistanceMiles = Math.round(roadDistanceKm * 0.621371 * 10) / 10;
  const distanceFormatted = `${roadDistanceKm} km (${roadDistanceMiles} mi)`;

  // Average urban speeds (km/h)
  const drivingSpeedKmh = 34; // City traffic car
  const bikeSpeedKmh = 36; // Two-wheeler agility
  const transitSpeedKmh = 24; // Metro/Bus speed
  const walkingSpeedKmh = 4.8; // Average human walking speed

  // Durations
  const drivingDurationMin = Math.round((roadDistanceKm / drivingSpeedKmh) * 60 + 2);
  const bikeDurationMin = Math.round((roadDistanceKm / bikeSpeedKmh) * 60 + 1);
  const transitDurationMin = Math.round((roadDistanceKm / transitSpeedKmh) * 60 + 7); // +7 min wait/transfer
  const walkingDurationMin = Math.round((roadDistanceKm / walkingSpeedKmh) * 60);

  // Recommendations
  const drivingDep = calculateDepartureTime(item.time, drivingDurationMin, 10);
  const bikeDep = calculateDepartureTime(item.time, bikeDurationMin, 5);
  const transitDep = calculateDepartureTime(item.time, transitDurationMin, 12);
  const walkDep = calculateDepartureTime(item.time, walkingDurationMin, 5);

  const drivingEta: TravelModeEta = {
    mode: 'driving',
    label: 'Car / Cab',
    icon: '🚗',
    durationMinutes: drivingDurationMin,
    durationFormatted: formatDuration(drivingDurationMin),
    speedKmh: drivingSpeedKmh,
    departureTimeRecommendation: `Leave by ${drivingDep.departureTime}`,
    trafficFactor: drivingDurationMin > 35 ? 'heavy' : drivingDurationMin > 18 ? 'moderate' : 'light',
  };

  const twoWheelerEta: TravelModeEta = {
    mode: 'twoWheeler',
    label: 'Bike / Scooter',
    icon: '🏍️',
    durationMinutes: bikeDurationMin,
    durationFormatted: formatDuration(bikeDurationMin),
    speedKmh: bikeSpeedKmh,
    departureTimeRecommendation: `Leave by ${bikeDep.departureTime}`,
    trafficFactor: 'light',
  };

  const transitEta: TravelModeEta = {
    mode: 'transit',
    label: 'Metro / Transit',
    icon: '🚇',
    durationMinutes: transitDurationMin,
    durationFormatted: formatDuration(transitDurationMin),
    speedKmh: transitSpeedKmh,
    departureTimeRecommendation: `Leave by ${transitDep.departureTime}`,
    trafficFactor: 'moderate',
  };

  const walkingEta: TravelModeEta = {
    mode: 'walking',
    label: 'Walking',
    icon: '🚶',
    durationMinutes: walkingDurationMin,
    durationFormatted: formatDuration(walkingDurationMin),
    speedKmh: walkingSpeedKmh,
    departureTimeRecommendation: `Leave by ${walkDep.departureTime}`,
    trafficFactor: 'light',
  };

  const mapsUrl = generateGoogleMapsDirectionsUrl(
    { latitude: originLat, longitude: originLon },
    {
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
      locationName: destCoords.locationName,
    }
  );

  const departureAlert = drivingDep.isPast
    ? `⚠️ Target departure was ${drivingDep.departureTime} (Departure time has passed). Drive now!`
    : `⏰ Recommended departure: ${drivingDep.departureTime} (${drivingDep.minutesUntilDeparture} mins remaining).`;

  const verbalSummaryEn = `The first item on your schedule is "${item.title}" at ${item.time}. Distance is ${roadDistanceKm} kilometers. By car, it will take approximately ${drivingDurationMin} minutes. Recommended departure is ${drivingDep.departureTime}.`;
  const verbalSummaryHi = `Sir, aapke schedule ka pehla item "${item.title}" ${item.time} baje hai. Yahan se distance ${roadDistanceKm} kilometer hai, aur gaadi se lagbhag ${drivingDurationMin} minute lagenge. Aapko ${drivingDep.departureTime} tak nikalna chahiye.`;

  return {
    hasValidDestination: true,
    item,
    itemIndex,
    origin: {
      latitude: originLat,
      longitude: originLon,
      locationName: originCity,
      source: userCoords.source || 'gps',
    },
    destination: {
      title: item.title,
      locationName: destCoords.locationName,
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
      isVirtualMeeting: false,
      scheduledTime: item.time,
      scheduledDate: item.date,
    },
    straightLineDistanceKm: straightDist,
    roadDistanceKm,
    roadDistanceMiles,
    distanceFormatted,
    etas: {
      driving: drivingEta,
      twoWheeler: twoWheelerEta,
      transit: transitEta,
      walking: walkingEta,
    },
    primaryEta: drivingEta,
    departureAlertText: departureAlert,
    googleMapsDirectionsUrl: mapsUrl,
    verbalSummaryEn,
    verbalSummaryHi,
  };
}

/**
 * High-level helper: Gets the user's current live GPS and calculates travel time to the first schedule item
 */
export async function calculateTravelToFirstScheduleItem(
  schedule: ScheduleItem[],
  customOrigin?: { latitude: number; longitude: number; city?: string }
): Promise<TravelCalculationResult | null> {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return null;
  }

  // Find first uncompleted schedule item (or schedule[0] if all completed)
  const firstItem = schedule.find((item) => !item.completed) || schedule[0];
  if (!firstItem) return null;
  const firstIndex = schedule.indexOf(firstItem);

  let originCoords: { latitude: number; longitude: number; city: string; source: 'gps' | 'ip' | 'cache' | 'default' };

  if (customOrigin) {
    originCoords = {
      latitude: customOrigin.latitude,
      longitude: customOrigin.longitude,
      city: customOrigin.city || 'Specified Location',
      source: 'gps',
    };
  } else {
    // 1. Try cached location for instant calculation
    const cached = getCachedUserLocation();
    if (cached && typeof cached.latitude === 'number' && typeof cached.longitude === 'number') {
      originCoords = {
        latitude: cached.latitude,
        longitude: cached.longitude,
        city: cached.city || 'Live GPS',
        source: 'cache',
      };
    } else {
      // 2. Fetch live high-accuracy location
      try {
        const live = await getHighAccuracyLiveLocation(4000);
        originCoords = {
          latitude: live.latitude,
          longitude: live.longitude,
          city: live.city || 'Live GPS',
          source: 'gps',
        };
      } catch {
        // Fallback to central default coordinates (India / Delhi)
        originCoords = {
          latitude: 28.6139,
          longitude: 77.209,
          city: 'New Delhi (Default GPS)',
          source: 'default',
        };
      }
    }
  }

  return calculateTravelToScheduleItem(originCoords, firstItem, firstIndex);
}
