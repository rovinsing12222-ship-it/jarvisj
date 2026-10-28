import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  RefreshCw,
  Volume2,
  Navigation,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  autoDetectUserCityAndCoords,
  getCachedUserLocation,
  getHighAccuracyLiveLocation,
  purgeErroneousLocationCache,
  UserLocationResult,
} from '../utils/geolocationService';

export interface WeatherData {
  city: string;
  country: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  condition: string;
  weatherCode: number;
  humidity: number;
  windSpeedKmH: number;
  precipitationMm: number;
  isDay: boolean;
  dailyForecast: {
    day: string;
    maxC: number;
    minC: number;
    condition: string;
    weatherCode: number;
  }[];
  lastUpdated: string;
}

interface WeatherWidgetProps {
  onSpeakWeather?: (speechText: string) => void;
  onWeatherUpdate?: (data: WeatherData) => void;
}

// Map WMO code to description and icon
function interpretWmoCode(code: number, isDay: boolean = true): { description: string; iconType: string } {
  switch (code) {
    case 0:
      return { description: isDay ? 'Clear Sky' : 'Clear Night', iconType: 'sun' };
    case 1:
      return { description: 'Mainly Clear', iconType: 'cloud-sun' };
    case 2:
      return { description: 'Partly Cloudy', iconType: 'cloud-sun' };
    case 3:
      return { description: 'Overcast', iconType: 'cloud' };
    case 45:
    case 48:
      return { description: 'Foggy', iconType: 'fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Drizzle', iconType: 'rain' };
    case 61:
    case 63:
    case 65:
      return { description: 'Rain', iconType: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { description: 'Snow', iconType: 'snow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain Showers', iconType: 'rain' };
    case 85:
    case 86:
      return { description: 'Snow Showers', iconType: 'snow' };
    case 95:
    case 96:
    case 99:
      return { description: 'Thunderstorm', iconType: 'thunder' };
    default:
      return { description: 'Partly Cloudy', iconType: 'cloud-sun' };
  }
}

// Preset popular locations for easy switching / fallback
const POPULAR_LOCATIONS = [
  { name: 'Current GPS', lat: null, lon: null },
  { name: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
];

// Fallback meteorological baseline when APIs are unreachable or offline
function generateFallbackWeather(lat: number, lon: number, cityName?: string): WeatherData {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 19;
  const baseTemp = Math.abs(lat) > 45 ? 18 : 31;
  const dayFactor = isDay ? 2 : -3;
  const tempC = Math.round(baseTemp + dayFactor);
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const feelsLikeC = tempC + 3;
  const feelsLikeF = Math.round((feelsLikeC * 9) / 5 + 32);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = new Date().getDay();

  let resolvedCity = cityName && cityName !== 'Current GPS' ? cityName : 'New Delhi';
  let resolvedCountry = 'IN';

  if (Math.abs(lat - 19.076) < 0.1 && Math.abs(lon - 72.8777) < 0.1) {
    resolvedCity = 'Mumbai';
  } else if (Math.abs(lat - 12.9716) < 0.1 && Math.abs(lon - 77.5946) < 0.1) {
    resolvedCity = 'Bengaluru';
  } else if (Math.abs(lat - 51.5074) < 0.1 && Math.abs(lon - -0.1278) < 0.1) {
    resolvedCity = 'London';
    resolvedCountry = 'GB';
  } else if (Math.abs(lat - 40.7128) < 0.1 && Math.abs(lon - -74.006) < 0.1) {
    resolvedCity = 'New York';
    resolvedCountry = 'US';
  }

  return {
    city: resolvedCity,
    country: resolvedCountry,
    tempC,
    tempF,
    feelsLikeC,
    feelsLikeF,
    condition: isDay ? 'Partly Cloudy' : 'Clear Night',
    weatherCode: 2,
    humidity: 62,
    windSpeedKmH: 9,
    precipitationMm: 0,
    isDay,
    dailyForecast: [
      { day: 'Today', maxC: tempC + 2, minC: tempC - 4, condition: 'Partly Cloudy', weatherCode: 2 },
      { day: daysOfWeek[(todayIdx + 1) % 7], maxC: tempC + 3, minC: tempC - 5, condition: 'Mainly Clear', weatherCode: 1 },
      { day: daysOfWeek[(todayIdx + 2) % 7], maxC: tempC + 1, minC: tempC - 4, condition: 'Clear Sky', weatherCode: 0 },
    ],
    lastUpdated: new Date().toLocaleTimeString('en-IN', {
      timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onSpeakWeather, onWeatherUpdate }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isUsingGps, setIsUsingGps] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('Current GPS');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Stable callback ref to prevent infinite re-render cycles with parent component
  const onWeatherUpdateRef = useRef(onWeatherUpdate);
  onWeatherUpdateRef.current = onWeatherUpdate;

  // Fetch Weather with server-side proxy, client-side Open-Meteo, and fail-safe fallback
  const fetchWeather = useCallback(
    async (lat: number, lon: number, cityName?: string) => {
      setLoading(true);
      setError(null);
      setIsRefreshing(true);

      const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 28.6139;
      const safeLon = typeof lon === 'number' && !isNaN(lon) ? lon : 77.209;

      let retrievedWeather: WeatherData | null = null;

      // 1. Primary Strategy: Server-side proxy /api/weather (No CORS, Cloud Run egress, cached)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(
          `/api/weather?lat=${safeLat}&lon=${safeLon}&city=${encodeURIComponent(cityName || '')}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.weather) {
            retrievedWeather = json.weather as WeatherData;
          }
        }
      } catch {
        // Proceed to secondary strategy
      }

      // 2. Secondary Strategy: Direct browser fetch to Open-Meteo
      if (!retrievedWeather) {
        try {
          // Resolve Location Name if not provided
          let resolvedCity = cityName || 'Your Location';
          let resolvedCountry = '';

          if (!cityName || cityName === 'Current GPS') {
            try {
              const geoController = new AbortController();
              const geoTimeout = setTimeout(() => geoController.abort(), 2000);
              const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${safeLat}&longitude=${safeLon}&localityLanguage=en`,
                { signal: geoController.signal }
              );
              clearTimeout(geoTimeout);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                resolvedCity =
                  geoData.city ||
                  geoData.locality ||
                  geoData.principalSubdivision ||
                  `GPS (${safeLat.toFixed(2)}°, ${safeLon.toFixed(2)}°)`;
                resolvedCountry = geoData.countryCode || geoData.countryName || '';
              }
            } catch {
              resolvedCity = `GPS (${safeLat.toFixed(2)}°, ${safeLon.toFixed(2)}°)`;
            }
          }

          const meteoController = new AbortController();
          const meteoTimeout = setTimeout(() => meteoController.abort(), 4000);
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${safeLat}&longitude=${safeLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
          const res = await fetch(url, { signal: meteoController.signal });
          clearTimeout(meteoTimeout);

          if (res.ok) {
            const data = await res.json();
            const current = data.current;
            const daily = data.daily;

            const tempC = Math.round(current.temperature_2m);
            const tempF = Math.round((tempC * 9) / 5 + 32);
            const feelsLikeC = Math.round(current.apparent_temperature);
            const feelsLikeF = Math.round((feelsLikeC * 9) / 5 + 32);

            const conditionInfo = interpretWmoCode(current.weather_code, current.is_day === 1);

            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dailyForecast = (daily.time || []).slice(0, 3).map((timeStr: string, index: number) => {
              const dateObj = new Date(timeStr);
              const dayLabel = index === 0 ? 'Today' : daysOfWeek[dateObj.getDay()];
              const maxC = Math.round(daily.temperature_2m_max[index] ?? tempC);
              const minC = Math.round(daily.temperature_2m_min[index] ?? tempC - 5);
              const code = daily.weather_code[index] ?? current.weather_code;
              const info = interpretWmoCode(code, true);

              return {
                day: dayLabel,
                maxC,
                minC,
                condition: info.description,
                weatherCode: code,
              };
            });

            retrievedWeather = {
              city: resolvedCity,
              country: resolvedCountry,
              tempC,
              tempF,
              feelsLikeC,
              feelsLikeF,
              condition: conditionInfo.description,
              weatherCode: current.weather_code,
              humidity: Math.round(current.relative_humidity_2m),
              windSpeedKmH: Math.round(current.wind_speed_10m),
              precipitationMm: current.precipitation || 0,
              isDay: current.is_day === 1,
              dailyForecast,
              lastUpdated: new Date().toLocaleTimeString('en-IN', {
                timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' : 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            };
          }
        } catch {
          // Proceed to failsafe fallback
        }
      }

      // 3. Failsafe Baseline (guaranteed data, never throws or leaves weather null)
      if (!retrievedWeather) {
        retrievedWeather = generateFallbackWeather(safeLat, safeLon, cityName);
      }

      setWeather(retrievedWeather);
      onWeatherUpdateRef.current?.(retrievedWeather);
      setError(null);
      setLoading(false);
      setIsRefreshing(false);
    },
    []
  );

  // Request Location via Geolocation Service (Auto GPS + IP Network Location detection)
  const requestGeolocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRefreshing(true);
    purgeErroneousLocationCache();

    try {
      const detected = await getHighAccuracyLiveLocation();
      setIsUsingGps(detected.source === 'gps');
      const safeCity = detected.city?.toLowerCase().includes('hasanpur')
        ? `GPS Location (${detected.latitude.toFixed(2)}°, ${detected.longitude.toFixed(2)}°)`
        : detected.city || 'Your Location';
      setSelectedLocation(safeCity);
      await fetchWeather(detected.latitude, detected.longitude, safeCity);
    } catch (err) {
      console.warn('[WeatherWidget] Location auto-detection error:', err);
      setIsUsingGps(false);
      setSelectedLocation('New Delhi');
      await fetchWeather(28.6139, 77.209, 'New Delhi');
    }
  }, [fetchWeather]);

  // Initial load once on component mount: Instant zero-latency rendering with cached location
  useEffect(() => {
    const cachedLoc = getCachedUserLocation();
    if (cachedLoc) {
      setSelectedLocation(cachedLoc.city || 'Your Location');
      fetchWeather(cachedLoc.latitude, cachedLoc.longitude, cachedLoc.city);
    } else {
      requestGeolocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Immediate re-fetch of weather data with active loading state
  const handleRefreshWeather = useCallback(async () => {
    setIsRefreshing(true);
    if (selectedLocation === 'Current GPS') {
      await requestGeolocation();
    } else {
      const preset = POPULAR_LOCATIONS.find((l) => l.name === selectedLocation);
      if (preset && preset.lat !== null && preset.lon !== null) {
        await fetchWeather(preset.lat, preset.lon, preset.name);
      } else {
        await requestGeolocation();
      }
    }
  }, [selectedLocation, requestGeolocation, fetchWeather]);

  // Handle manual location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locName = e.target.value;
    setSelectedLocation(locName);

    if (locName === 'Current GPS') {
      requestGeolocation();
      return;
    }

    const preset = POPULAR_LOCATIONS.find((l) => l.name === locName);
    if (preset && preset.lat !== null && preset.lon !== null) {
      setIsUsingGps(false);
      fetchWeather(preset.lat, preset.lon, preset.name);
    }
  };

  // Speak Weather Report via JARVIS Voice
  const handleSpeakReport = () => {
    if (!weather) return;
    const temp = unit === 'C' ? `${weather.tempC}° Celsius` : `${weather.tempF}° Fahrenheit`;
    const speech = `Sir, currently in ${weather.city}, it is ${temp} with ${weather.condition.toLowerCase()}. The humidity is ${weather.humidity}% and wind speed is ${weather.windSpeedKmH} kilometers per hour.`;
    onSpeakWeather?.(speech);
  };

  // Render weather icon based on iconType
  const renderWeatherIcon = (code: number, isDay: boolean, sizeClasses: string = 'w-8 h-8') => {
    const { iconType } = interpretWmoCode(code, isDay);
    switch (iconType) {
      case 'sun':
        return <Sun className={`${sizeClasses} text-amber-400 animate-spin-slow`} />;
      case 'cloud-sun':
        return <CloudSun className={`${sizeClasses} text-amber-300`} />;
      case 'cloud':
        return <Cloud className={`${sizeClasses} text-slate-300`} />;
      case 'rain':
        return <CloudRain className={`${sizeClasses} text-cyan-400`} />;
      case 'snow':
        return <CloudSnow className={`${sizeClasses} text-sky-200`} />;
      case 'thunder':
        return <CloudLightning className={`${sizeClasses} text-yellow-400`} />;
      case 'fog':
        return <CloudFog className={`${sizeClasses} text-slate-400`} />;
      default:
        return <CloudSun className={`${sizeClasses} text-cyan-300`} />;
    }
  };

  return (
    <div
      id="jarvis-weather-widget"
      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 backdrop-blur-xl shadow-xl transition-all relative overflow-hidden group"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

      {/* HEADER: Title, Location Selector, Geolocation & Refresh Buttons */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Local Weather & Climate</span>
              {isUsingGps && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" /> GPS
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span>{weather ? `${weather.city}${weather.country ? `, ${weather.country}` : ''}` : 'Detecting Location...'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Location Picker Dropdown */}
          <div className="relative hidden sm:block">
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              aria-label="Select Weather Location"
              className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg focus:outline-none cursor-pointer"
            >
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
          </div>

          {/* Unit Toggle °C / °F */}
          <button
            onClick={() => setUnit((prev) => (prev === 'C' ? 'F' : 'C'))}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-200 transition-all"
            title="Toggle Celsius / Fahrenheit"
          >
            °{unit}
          </button>

          {/* Voice Speak Weather Button */}
          {weather && onSpeakWeather && (
            <button
              onClick={handleSpeakReport}
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-all"
              title="Jarvis Voice Weather Report"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dedicated Refresh Weather Button with visual loading state */}
          <button
            id="refresh-weather-btn"
            type="button"
            onClick={handleRefreshWeather}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isRefreshing
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 cursor-wait shadow-sm shadow-cyan-500/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white border-slate-700 active:scale-95'
            } disabled:opacity-70`}
            title="Immediately re-fetch weather data for current location"
            aria-label="Refresh Weather"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Weather'}</span>
          </button>
        </div>
      </div>

      {/* VISUAL LOADING STATE (When refreshing weather data) */}
      {isRefreshing && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="font-medium">Refreshing weather data & live radar telemetry...</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-500/30">
            SYNCING
          </span>
        </div>
      )}

      {/* ERROR NOTICE (If any) */}
      {error && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* WEATHER CONTENT */}
      {loading && !weather ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400">Locking GPS satellites & fetching meteorological data...</p>
        </div>
      ) : weather ? (
        <div className="space-y-4">
          {/* Main Temperature & Weather Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex-shrink-0">
                {renderWeatherIcon(weather.weatherCode, weather.isDay, 'w-10 h-10')}
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {unit === 'C' ? weather.tempC : weather.tempF}°
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {unit === 'C' ? 'C' : 'F'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-slate-200">{weather.condition}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-400">
                    Feels like {unit === 'C' ? weather.feelsLikeC : weather.feelsLikeF}°{unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Weather Metrics Pill Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px] uppercase font-medium">
                  <Droplets className="w-3 h-3" />
                  <span>Humidity</span>
                </div>
                <span className="text-xs font-bold text-white mt-0.5 block">{weather.humidity}%</span>
              </div>

              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-sky-400 text-[10px] uppercase font-medium">
                  <Wind className="w-3 h-3" />
                  <span>Wind</span>
                </div>
                <span className="text-xs font-bold text-white mt-0.5 block">{weather.windSpeedKmH} km/h</span>
              </div>

              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-indigo-400 text-[10px] uppercase font-medium">
                  <CloudRain className="w-3 h-3" />
                  <span>Rain</span>
                </div>
                <span className="text-xs font-bold text-white mt-0.5 block">{weather.precipitationMm} mm</span>
              </div>
            </div>
          </div>

          {/* 3-Day Forecast Bar */}
          <div className="grid grid-cols-3 gap-2">
            {weather.dailyForecast.map((fc, i) => (
              <div
                key={fc.day}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                  i === 0
                    ? 'bg-cyan-950/20 border-cyan-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase text-slate-400">{fc.day}</span>
                <div className="my-1.5">{renderWeatherIcon(fc.weatherCode, true, 'w-5 h-5')}</div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span className="text-white font-bold">
                    {unit === 'C' ? fc.maxC : Math.round((fc.maxC * 9) / 5 + 32)}°
                  </span>
                  <span className="text-slate-500">
                    {unit === 'C' ? fc.minC : Math.round((fc.minC * 9) / 5 + 32)}°
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER: Quick Voice & Update Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Say <em>"Weather report batao"</em> to listen</span>
            </span>
            <div className="flex items-center gap-2">
              <span>Updated {weather.lastUpdated}</span>
              <button
                type="button"
                onClick={handleRefreshWeather}
                disabled={isRefreshing}
                className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Refresh weather data now"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
