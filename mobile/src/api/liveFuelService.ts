import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api from './client';

const INDIAN_API_KEY = 'sk-live-ZM1YxqhNu7iCP7PyfN0v685tXs5AiGxltmglvNXp';
const CACHE_KEY = '@live_fuel_prices_cache';
const CACHE_TIME_KEY = '@live_fuel_prices_time';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CityPrice {
  city: string;
  petrol: number;
  diesel: number;
  cng: number;
  change?: string;
  lastUpdated: string;
}

// Built-in benchmark rates for instant 0ms fallback
const DEFAULT_RATES: Record<string, { petrol: number; diesel: number; cng: number }> = {
  bengaluru: { petrol: 110.93, diesel: 98.80, cng: 79.50 },
  bangalore: { petrol: 110.93, diesel: 98.80, cng: 79.50 },
  mumbai: { petrol: 111.21, diesel: 97.83, cng: 75.00 },
  delhi: { petrol: 94.72, diesel: 87.62, cng: 75.09 },
  hyderabad: { petrol: 107.41, diesel: 95.65, cng: 87.00 },
  chennai: { petrol: 100.75, diesel: 92.34, cng: 82.50 },
  kolkata: { petrol: 103.94, diesel: 90.76, cng: 80.50 },
  pune: { petrol: 104.05, diesel: 90.58, cng: 86.00 },
  mysore: { petrol: 102.75, diesel: 88.82, cng: 79.50 },
  mangalore: { petrol: 101.95, diesel: 87.98, cng: 79.50 },
  ahmedabad: { petrol: 94.44, diesel: 90.11, cng: 76.20 },
  jaipur: { petrol: 104.88, diesel: 90.36, cng: 83.00 },
  lucknow: { petrol: 94.65, diesel: 87.76, cng: 84.50 },
  chandigarh: { petrol: 94.24, diesel: 82.40, cng: 82.50 },
  kochi: { petrol: 105.74, diesel: 94.71, cng: 83.00 },
};

/**
 * Fetches real-time fuel price for any Indian city directly from fuel.indianapi.in
 * with instant local cache and zero-latency fallback.
 */
export async function getLiveCityPrice(cityName: string = 'Bengaluru'): Promise<CityPrice> {
  const normCity = cityName.trim().toLowerCase();

  // 1. Try local storage cache first for instant UI response
  let cachedData: Record<string, { petrol: number; diesel: number; change?: string }> = {};
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      cachedData = JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  // 2. Fetch fresh live data from fuel.indianapi.in
  try {
    const headers = { 'x-api-key': INDIAN_API_KEY };
    const [petrolRes, dieselRes] = await Promise.all([
      axios.get('https://fuel.indianapi.in/live_fuel_price?location_type=city&fuel_type=petrol', {
        headers,
        timeout: 6000,
      }),
      axios.get('https://fuel.indianapi.in/live_fuel_price?location_type=city&fuel_type=diesel', {
        headers,
        timeout: 6000,
      }),
    ]);

    const petrolList: Array<{ city: string; price: string; change?: string }> = petrolRes.data || [];
    const dieselList: Array<{ city: string; price: string; change?: string }> = dieselRes.data || [];

    const updatedMap: Record<string, { petrol: number; diesel: number; change?: string }> = {};

    for (const item of petrolList) {
      if (item.city && item.price) {
        const k = item.city.trim().toLowerCase();
        const p = parseFloat(item.price);
        if (!isNaN(p)) {
          updatedMap[k] = { petrol: p, diesel: 0, change: item.change };
        }
      }
    }

    for (const item of dieselList) {
      if (item.city && item.price) {
        const k = item.city.trim().toLowerCase();
        const d = parseFloat(item.price);
        if (!isNaN(d)) {
          if (updatedMap[k]) {
            updatedMap[k].diesel = d;
          } else {
            updatedMap[k] = { petrol: 0, diesel: d, change: item.change };
          }
        }
      }
    }

    if (Object.keys(updatedMap).length > 0) {
      cachedData = updatedMap;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updatedMap));
      await AsyncStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    }
  } catch (netErr) {
    // If direct API fails, try backend proxy
    try {
      const bRes = await api.get('/fuel/live-prices', { params: { city: cityName } });
      if (bRes.data?.selectedCity) {
        return bRes.data.selectedCity;
      }
    } catch (bErr) {
      // ignore
    }
  }

  // 3. Match requested city in cached data
  let match = cachedData[normCity];
  if (!match) {
    if (normCity === 'bengaluru') match = cachedData['bangalore'];
    else if (normCity === 'bangalore') match = cachedData['bengaluru'];
  }

  // Partial match in cached data
  if (!match) {
    for (const [k, v] of Object.entries(cachedData)) {
      if (k.includes(normCity) || normCity.includes(k)) {
        match = v;
        break;
      }
    }
  }

  const fallback = DEFAULT_RATES[normCity] || DEFAULT_RATES['bengaluru'] || { petrol: 110.93, diesel: 98.80, cng: 79.50 };

  return {
    city: cityName,
    petrol: match && match.petrol > 0 ? match.petrol : fallback.petrol,
    diesel: match && match.diesel > 0 ? match.diesel : fallback.diesel,
    cng: fallback.cng || 79.50,
    change: match?.change || '0.00',
    lastUpdated: new Date().toISOString(),
  };
}
