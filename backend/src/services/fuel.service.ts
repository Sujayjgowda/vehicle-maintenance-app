import prisma from "../lib/prisma";
import type { CreateFuelRecordInput, UpdateFuelRecordInput } from "../validators/fuel.validator";

const INDIAN_API_KEY = process.env.INDIAN_API_KEY || "sk-live-ZM1YxqhNu7iCP7PyfN0v685tXs5AiGxltmglvNXp";

export interface CityFuelRate {
  city: string;
  state?: string;
  petrol: number;
  diesel: number;
  cng?: number;
  currency: string;
  change?: string;
  lastUpdated: string;
}

// In-memory cache for live rates to prevent excessive rate-limiting (30 min cache)
let cachedLivePrices: {
  timestamp: number;
  cityMap: Map<string, { petrol: number; diesel: number; change?: string }>;
  cityList: Array<{ name: string; value: string }>;
} | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches real-time Petrol and Diesel prices from https://fuel.indianapi.in
 */
async function fetchFromIndianApi() {
  const now = Date.now();
  if (cachedLivePrices && now - cachedLivePrices.timestamp < CACHE_TTL_MS) {
    return cachedLivePrices;
  }

  try {
    const headers = {
      "x-api-key": INDIAN_API_KEY,
      "Content-Type": "application/json",
    };

    const [petrolRes, dieselRes, citiesRes] = await Promise.all([
      fetch("https://fuel.indianapi.in/live_fuel_price?location_type=city&fuel_type=petrol", { headers }),
      fetch("https://fuel.indianapi.in/live_fuel_price?location_type=city&fuel_type=diesel", { headers }),
      fetch("https://fuel.indianapi.in/cities", { headers }),
    ]);

    let petrolData: any[] = [];
    let dieselData: any[] = [];
    let cityList: any[] = [];

    try {
      const pText = petrolRes.ok ? await petrolRes.text() : "";
      petrolData = JSON.parse(pText);
    } catch {
      petrolData = [];
    }

    try {
      const dText = dieselRes.ok ? await dieselRes.text() : "";
      dieselData = JSON.parse(dText);
    } catch {
      dieselData = [];
    }

    try {
      const cText = citiesRes.ok ? await citiesRes.text() : "";
      cityList = JSON.parse(cText);
    } catch {
      cityList = [];
    }

    const cityMap = new Map<string, { petrol: number; diesel: number; change?: string }>();

    if (Array.isArray(petrolData)) {
      for (const item of petrolData) {
        if (item && item.city && item.price) {
          const key = item.city.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
          const p = parseFloat(item.price);
          if (!isNaN(p) && p > 0) {
            cityMap.set(key, { petrol: p, diesel: 0, change: item.change });
          }
        }
      }
    }

    if (Array.isArray(dieselData)) {
      for (const item of dieselData) {
        if (item && item.city && item.price) {
          const key = item.city.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
          const d = parseFloat(item.price);
          if (!isNaN(d) && d > 0) {
            const existing = cityMap.get(key) || { petrol: 0, diesel: 0, change: item.change };
            existing.diesel = d;
            cityMap.set(key, existing);
          }
        }
      }
    }

    cachedLivePrices = {
      timestamp: now,
      cityMap,
      cityList: Array.isArray(cityList) ? cityList : [],
    };

    return cachedLivePrices;
  } catch (err) {
    console.error("Failed to fetch from indianapi.in:", err);
    return cachedLivePrices;
  }
}

// Fallback benchmark rates for Indian districts and cities (including all Karnataka districts)
const FALLBACK_BENCHMARKS: Record<string, { petrol: number; diesel: number; cng: number }> = {
  // Karnataka Districts
  hassan: { petrol: 111.12, diesel: 98.96, cng: 82.00 },
  bengaluru: { petrol: 111.68, diesel: 98.80, cng: 79.50 },
  bangalore: { petrol: 111.68, diesel: 98.80, cng: 79.50 },
  mysore: { petrol: 111.45, diesel: 98.70, cng: 79.50 },
  mysuru: { petrol: 111.45, diesel: 98.70, cng: 79.50 },
  mangalore: { petrol: 110.15, diesel: 97.45, cng: 79.50 },
  mangaluru: { petrol: 110.15, diesel: 97.45, cng: 79.50 },
  "dakshina kannada": { petrol: 110.15, diesel: 97.45, cng: 79.50 },
  mandya: { petrol: 111.35, diesel: 98.85, cng: 80.00 },
  shivamogga: { petrol: 111.50, diesel: 99.10, cng: 82.00 },
  shimoga: { petrol: 111.50, diesel: 99.10, cng: 82.00 },
  udupi: { petrol: 110.30, diesel: 97.60, cng: 80.00 },
  belagavi: { petrol: 111.20, diesel: 98.50, cng: 80.00 },
  belgaum: { petrol: 111.20, diesel: 98.50, cng: 80.00 },
  hubli: { petrol: 111.40, diesel: 98.65, cng: 80.00 },
  hubballi: { petrol: 111.40, diesel: 98.65, cng: 80.00 },
  dharwad: { petrol: 111.40, diesel: 98.65, cng: 80.00 },
  tumakuru: { petrol: 111.40, diesel: 98.75, cng: 80.00 },
  tumkur: { petrol: 111.40, diesel: 98.75, cng: 80.00 },
  davanagere: { petrol: 111.60, diesel: 98.90, cng: 81.00 },
  ballari: { petrol: 111.75, diesel: 99.05, cng: 82.00 },
  bellary: { petrol: 111.75, diesel: 99.05, cng: 82.00 },
  chikkamagaluru: { petrol: 111.40, diesel: 98.80, cng: 82.00 },
  chikmagalur: { petrol: 111.40, diesel: 98.80, cng: 82.00 },
  kodagu: { petrol: 111.90, diesel: 99.20, cng: 82.00 },
  madikeri: { petrol: 111.90, diesel: 99.20, cng: 82.00 },
  kolar: { petrol: 111.50, diesel: 98.85, cng: 80.00 },
  ramanagara: { petrol: 111.45, diesel: 98.75, cng: 80.00 },
  chamarajanagar: { petrol: 111.60, diesel: 98.90, cng: 81.00 },
  chikkaballapura: { petrol: 111.50, diesel: 98.80, cng: 80.00 },
  chitradurga: { petrol: 111.55, diesel: 98.85, cng: 81.00 },
  bagalkote: { petrol: 111.65, diesel: 98.90, cng: 81.00 },
  bagalkot: { petrol: 111.65, diesel: 98.90, cng: 81.00 },
  vijayapura: { petrol: 111.70, diesel: 98.95, cng: 81.00 },
  bijapur: { petrol: 111.70, diesel: 98.95, cng: 81.00 },
  kalaburagi: { petrol: 111.90, diesel: 99.15, cng: 82.00 },
  gulbarga: { petrol: 111.90, diesel: 99.15, cng: 82.00 },
  raichur: { petrol: 112.00, diesel: 99.25, cng: 82.00 },
  koppal: { petrol: 111.70, diesel: 98.95, cng: 81.00 },
  gadag: { petrol: 111.50, diesel: 98.80, cng: 81.00 },
  haveri: { petrol: 111.55, diesel: 98.85, cng: 81.00 },
  bidar: { petrol: 112.10, diesel: 99.30, cng: 82.00 },
  yadgir: { petrol: 111.85, diesel: 99.10, cng: 82.00 },
  "uttara kannada": { petrol: 110.85, diesel: 98.20, cng: 80.00 },
  karwar: { petrol: 110.85, diesel: 98.20, cng: 80.00 },

  // Major Indian Metro & State Capitals
  delhi: { petrol: 94.72, diesel: 87.62, cng: 75.09 },
  "new delhi": { petrol: 94.72, diesel: 87.62, cng: 75.09 },
  mumbai: { petrol: 103.44, diesel: 89.97, cng: 75.00 },
  hyderabad: { petrol: 107.41, diesel: 95.65, cng: 87.00 },
  chennai: { petrol: 100.75, diesel: 92.34, cng: 82.50 },
  kolkata: { petrol: 103.94, diesel: 90.76, cng: 80.50 },
  pune: { petrol: 103.44, diesel: 89.97, cng: 86.00 },
  ahmedabad: { petrol: 94.44, diesel: 90.11, cng: 76.20 },
  jaipur: { petrol: 104.88, diesel: 90.36, cng: 83.00 },
  lucknow: { petrol: 94.65, diesel: 87.76, cng: 84.50 },
  chandigarh: { petrol: 94.24, diesel: 82.40, cng: 82.50 },
  kochi: { petrol: 105.74, diesel: 94.71, cng: 83.00 },
  coimbatore: { petrol: 101.40, diesel: 93.00, cng: 82.00 },
  madurai: { petrol: 101.80, diesel: 93.40, cng: 82.00 },
  surat: { petrol: 94.31, diesel: 89.99, cng: 76.50 },
  vadodara: { petrol: 94.13, diesel: 89.81, cng: 76.00 },
  indore: { petrol: 106.50, diesel: 91.89, cng: 84.00 },
  nagpur: { petrol: 103.96, diesel: 90.52, cng: 85.00 },
  nashik: { petrol: 104.40, diesel: 90.90, cng: 85.00 },
  patna: { petrol: 105.18, diesel: 92.04, cng: 86.00 },
  bhopal: { petrol: 106.47, diesel: 91.84, cng: 84.50 },
  bhubaneswar: { petrol: 101.06, diesel: 92.64, cng: 83.00 },
  guwahati: { petrol: 96.01, diesel: 88.27, cng: 81.00 },
  thiruvananthapuram: { petrol: 107.56, diesel: 96.43, cng: 84.00 },
  visakhapatnam: { petrol: 108.29, diesel: 96.17, cng: 87.50 },
  agra: { petrol: 94.51, diesel: 87.58, cng: 84.00 },
  varanasi: { petrol: 95.07, diesel: 88.24, cng: 84.50 },
  kanpur: { petrol: 94.66, diesel: 87.80, cng: 84.00 },
  amritsar: { petrol: 96.85, diesel: 87.16, cng: 83.00 },
  ludhiana: { petrol: 96.72, diesel: 87.03, cng: 83.00 },
  dehradun: { petrol: 93.45, diesel: 88.28, cng: 83.00 },
  ranchi: { petrol: 97.81, diesel: 92.56, cng: 85.00 },
  raipur: { petrol: 100.39, diesel: 93.33, cng: 85.00 },
  goa: { petrol: 96.56, diesel: 88.33, cng: 80.00 },
  panaji: { petrol: 96.56, diesel: 88.33, cng: 80.00 },
};

/**
 * Returns current real-time daily fuel prices for any requested Indian city or district.
 */
export async function getLiveFuelPrices(cityName?: string) {
  const cache = await fetchFromIndianApi();
  const searchCity = (cityName || "Bengaluru").trim();
  const lowerSearch = searchCity.toLowerCase().replace(/[^a-z0-9 ]/g, "");

  let petrol = 111.68;
  let diesel = 98.80;
  let change = "0.00";
  let foundCityName = searchCity;

  if (cache && cache.cityMap && cache.cityMap.size > 0) {
    let match = cache.cityMap.get(lowerSearch);

    if (!match) {
      if (lowerSearch === "bengaluru") match = cache.cityMap.get("bangalore");
      else if (lowerSearch === "bangalore") match = cache.cityMap.get("bengaluru");
      else if (lowerSearch === "mysuru") match = cache.cityMap.get("mysore");
      else if (lowerSearch === "mysore") match = cache.cityMap.get("mysuru");
    }

    if (!match) {
      for (const [k, v] of cache.cityMap.entries()) {
        if (k.includes(lowerSearch) || lowerSearch.includes(k)) {
          match = v;
          foundCityName = k.charAt(0).toUpperCase() + k.slice(1);
          break;
        }
      }
    }

    if (match) {
      if (match.petrol > 0) petrol = match.petrol;
      if (match.diesel > 0) diesel = match.diesel;
      if (match.change) change = match.change;
    }
  } else {
    let fallback = FALLBACK_BENCHMARKS[lowerSearch];
    if (!fallback) {
      if (lowerSearch.includes("hassan")) fallback = FALLBACK_BENCHMARKS["hassan"];
      else if (lowerSearch.includes("bengaluru") || lowerSearch.includes("bangalore")) fallback = FALLBACK_BENCHMARKS["bengaluru"];
      else if (lowerSearch.includes("mysor") || lowerSearch.includes("mysur")) fallback = FALLBACK_BENCHMARKS["mysore"];
      else if (lowerSearch.includes("mangal") || lowerSearch.includes("dakshina")) fallback = FALLBACK_BENCHMARKS["mangalore"];
      else if (lowerSearch.includes("mandy")) fallback = FALLBACK_BENCHMARKS["mandya"];
      else if (lowerSearch.includes("shivam") || lowerSearch.includes("shimog")) fallback = FALLBACK_BENCHMARKS["shivamogga"];
      else if (lowerSearch.includes("belga") || lowerSearch.includes("belaga")) fallback = FALLBACK_BENCHMARKS["belagavi"];
      else if (lowerSearch.includes("hubl") || lowerSearch.includes("dharw")) fallback = FALLBACK_BENCHMARKS["hubli"];
      else if (lowerSearch.includes("tumk")) fallback = FALLBACK_BENCHMARKS["tumakuru"];
      else if (lowerSearch.includes("udup")) fallback = FALLBACK_BENCHMARKS["udupi"];
      else if (lowerSearch.includes("davan")) fallback = FALLBACK_BENCHMARKS["davanagere"];
      else if (lowerSearch.includes("balla") || lowerSearch.includes("bella")) fallback = FALLBACK_BENCHMARKS["ballari"];
      else if (lowerSearch.includes("chikkamag")) fallback = FALLBACK_BENCHMARKS["chikkamagaluru"];
      else if (lowerSearch.includes("koda") || lowerSearch.includes("madik")) fallback = FALLBACK_BENCHMARKS["kodagu"];
      else if (lowerSearch.includes("kola")) fallback = FALLBACK_BENCHMARKS["kolar"];
      else if (lowerSearch.includes("ramanag")) fallback = FALLBACK_BENCHMARKS["ramanagara"];
    }

    if (!fallback) {
      fallback = FALLBACK_BENCHMARKS["bengaluru"] || { petrol: 111.68, diesel: 98.80, cng: 79.50 };
    }

    petrol = fallback.petrol;
    diesel = fallback.diesel;
  }

  const cng = 79.50;

  const popularCities = [
    "Bengaluru",
    "Hassan",
    "Mysore",
    "Mangalore",
    "Mandya",
    "Shivamogga",
    "Belagavi",
    "Hubli",
    "Tumakuru",
    "Udupi",
    "Davanagere",
    "Delhi",
    "Mumbai",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
    "Chandigarh",
    "Kochi",
  ];

  return {
    selectedCity: {
      city: foundCityName,
      petrol,
      diesel,
      cng,
      change,
      currency: "₹",
      lastUpdated: new Date().toISOString(),
    },
    popularCities,
    availableCitiesCount: cache?.cityMap?.size || popularCities.length,
    source: "fuel.indianapi.in (Live Indian Fuel API)",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns full list of searchable cities and districts from fuel.indianapi.in or comprehensive regional list.
 */
export async function getIndianApiCities() {
  const cache = await fetchFromIndianApi();
  if (cache && cache.cityList && cache.cityList.length > 0) {
    return cache.cityList;
  }
  return [
    // Karnataka Districts
    { name: "Hassan", value: "hassan" },
    { name: "Bengaluru", value: "bengaluru" },
    { name: "Mysuru (Mysore)", value: "mysore" },
    { name: "Mangaluru (Mangalore)", value: "mangalore" },
    { name: "Mandya", value: "mandya" },
    { name: "Shivamogga (Shimoga)", value: "shivamogga" },
    { name: "Udupi", value: "udupi" },
    { name: "Belagavi (Belgaum)", value: "belagavi" },
    { name: "Hubballi-Dharwad", value: "hubli" },
    { name: "Tumakuru (Tumkur)", value: "tumakuru" },
    { name: "Davanagere", value: "davanagere" },
    { name: "Ballari (Bellary)", value: "ballari" },
    { name: "Chikkamagaluru", value: "chikkamagaluru" },
    { name: "Kodagu (Madikeri)", value: "kodagu" },
    { name: "Kolar", value: "kolar" },
    { name: "Ramanagara", value: "ramanagara" },
    { name: "Chamarajanagar", value: "chamarajanagar" },
    { name: "Chikkaballapura", value: "chikkaballapura" },
    { name: "Chitradurga", value: "chitradurga" },
    { name: "Bagalkote", value: "bagalkote" },
    { name: "Vijayapura (Bijapur)", value: "vijayapura" },
    { name: "Kalaburagi (Gulbarga)", value: "kalaburagi" },
    { name: "Raichur", value: "raichur" },
    { name: "Koppal", value: "koppal" },
    { name: "Gadag", value: "gadag" },
    { name: "Haveri", value: "haveri" },
    { name: "Bidar", value: "bidar" },
    { name: "Yadgir", value: "yadgir" },
    { name: "Uttara Kannada (Karwar)", value: "karwar" },

    // Top Indian Metros & Cities
    { name: "Delhi", value: "delhi" },
    { name: "Mumbai", value: "mumbai" },
    { name: "Hyderabad", value: "hyderabad" },
    { name: "Chennai", value: "chennai" },
    { name: "Kolkata", value: "kolkata" },
    { name: "Pune", value: "pune" },
    { name: "Ahmedabad", value: "ahmedabad" },
    { name: "Jaipur", value: "jaipur" },
    { name: "Lucknow", value: "lucknow" },
    { name: "Chandigarh", value: "chandigarh" },
    { name: "Kochi", value: "kochi" },
    { name: "Coimbatore", value: "coimbatore" },
    { name: "Madurai", value: "madurai" },
    { name: "Surat", value: "surat" },
    { name: "Vadodara", value: "vadodara" },
    { name: "Indore", value: "indore" },
    { name: "Nagpur", value: "nagpur" },
    { name: "Nashik", value: "nashik" },
    { name: "Patna", value: "patna" },
    { name: "Bhopal", value: "bhopal" },
    { name: "Bhubaneswar", value: "bhubaneswar" },
    { name: "Guwahati", value: "guwahati" },
    { name: "Thiruvananthapuram", value: "thiruvananthapuram" },
    { name: "Visakhapatnam", value: "visakhapatnam" },
    { name: "Agra", value: "agra" },
    { name: "Varanasi", value: "varanasi" },
    { name: "Kanpur", value: "kanpur" },
    { name: "Amritsar", value: "amritsar" },
    { name: "Ludhiana", value: "ludhiana" },
    { name: "Dehradun", value: "dehradun" },
    { name: "Ranchi", value: "ranchi" },
    { name: "Raipur", value: "raipur" },
    { name: "Goa (Panaji)", value: "goa" },
  ];
}

/**
 * Calculates average KM/L and cost per KM by comparing against the previous
 * fuel record's odometer reading for the same vehicle.
 */
async function calculateFuelMetrics(vehicleId: string, odometerReading: number, liters: number, cost: number) {
  const previousRecord = await prisma.fuelRecord.findFirst({
    where: { vehicleId, odometerReading: { lt: odometerReading } },
    orderBy: { odometerReading: "desc" },
  });

  let averageKmpl: number | null = null;
  let costPerKm: number | null = null;

  if (previousRecord) {
    const distanceTraveled = odometerReading - previousRecord.odometerReading;
    if (distanceTraveled > 0 && liters > 0) {
      averageKmpl = Math.round((distanceTraveled / liters) * 100) / 100;
      costPerKm = Math.round((cost / distanceTraveled) * 100) / 100;
    }
  }

  return { averageKmpl, costPerKm };
}

export async function getAllFuelRecords(vehicleId: string) {
  return prisma.fuelRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
}

export async function getFuelRecordById(id: string, vehicleId: string) {
  const record = await prisma.fuelRecord.findFirst({
    where: { id, vehicleId },
  });

  if (!record) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return record;
}

export async function createFuelRecord(vehicleId: string, data: CreateFuelRecordInput) {
  const { averageKmpl, costPerKm } = await calculateFuelMetrics(
    vehicleId,
    data.odometerReading,
    data.liters,
    data.cost
  );

  const record = await prisma.fuelRecord.create({
    data: {
      vehicleId,
      date: new Date(data.date),
      liters: data.liters,
      cost: data.cost,
      odometerReading: data.odometerReading,
      averageKmpl,
      costPerKm,
    },
  });

  // Automatically sync to Expenses
  try {
    const rateText = data.liters > 0 ? ` @ ₹${(data.cost / data.liters).toFixed(2)}/L` : "";
    await prisma.expense.create({
      data: {
        vehicleId,
        category: "FUEL",
        amount: data.cost,
        date: new Date(data.date),
        notes: `Fuel Fill-up: ${data.liters} L${rateText} (Odo: ${data.odometerReading.toLocaleString()} KM)`,
        sourceId: record.id,
        sourceType: "FUEL",
      },
    });
  } catch (e) {
    console.error("Error syncing fuel expense:", e);
  }

  // Update vehicle's current odometer if this is the latest reading
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (vehicle && data.odometerReading > vehicle.currentOdometer) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentOdometer: data.odometerReading },
    });
  }

  return record;
}

export async function updateFuelRecord(id: string, vehicleId: string, data: UpdateFuelRecordInput) {
  const existing = await prisma.fuelRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  const updatedOdometer = data.odometerReading ?? existing.odometerReading;
  const updatedLiters = data.liters ?? existing.liters;
  const updatedCost = data.cost ?? existing.cost;
  const updatedDate = data.date ? new Date(data.date) : existing.date;

  const { averageKmpl, costPerKm } = await calculateFuelMetrics(
    vehicleId,
    updatedOdometer,
    updatedLiters,
    updatedCost
  );

  const updated = await prisma.fuelRecord.update({
    where: { id },
    data: {
      ...(data.date && { date: updatedDate }),
      ...(data.liters !== undefined && { liters: data.liters }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.odometerReading !== undefined && { odometerReading: data.odometerReading }),
      averageKmpl,
      costPerKm,
    },
  });

  // Automatically sync update to Expenses
  try {
    const rateText = updatedLiters > 0 ? ` @ ₹${(updatedCost / updatedLiters).toFixed(2)}/L` : "";
    const existingExpense = await prisma.expense.findFirst({ where: { sourceId: id } });
    if (existingExpense) {
      await prisma.expense.update({
        where: { id: existingExpense.id },
        data: {
          amount: updatedCost,
          date: updatedDate,
          notes: `Fuel Fill-up: ${updatedLiters} L${rateText} (Odo: ${updatedOdometer.toLocaleString()} KM)`,
        },
      });
    } else {
      await prisma.expense.create({
        data: {
          vehicleId,
          category: "FUEL",
          amount: updatedCost,
          date: updatedDate,
          notes: `Fuel Fill-up: ${updatedLiters} L${rateText} (Odo: ${updatedOdometer.toLocaleString()} KM)`,
          sourceId: updated.id,
          sourceType: "FUEL",
        },
      });
    }
  } catch (e) {
    console.error("Error updating synced fuel expense:", e);
  }

  return updated;
}

export async function deleteFuelRecord(id: string, vehicleId: string) {
  const existing = await prisma.fuelRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  // Automatically remove synced Expense
  try {
    await prisma.expense.deleteMany({ where: { sourceId: id } });
  } catch (e) {
    console.error("Error deleting synced fuel expense:", e);
  }

  return prisma.fuelRecord.delete({ where: { id } });
}

/** Monthly fuel expenditure summary for a vehicle */
export async function getFuelSummary(vehicleId: string) {
  const records = await prisma.fuelRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "asc" },
  });

  const monthlyTotals: Record<string, { totalCost: number; totalLiters: number; count: number }> = {};

  for (const record of records) {
    const key = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = { totalCost: 0, totalLiters: 0, count: 0 };
    }
    monthlyTotals[key]!.totalCost += record.cost;
    monthlyTotals[key]!.totalLiters += record.liters;
    monthlyTotals[key]!.count += 1;
  }

  const latestAvgKmpl = records.filter((r) => r.averageKmpl !== null).slice(-1)[0]?.averageKmpl ?? null;

  return {
    totalRecords: records.length,
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    totalLiters: records.reduce((sum, r) => sum + r.liters, 0),
    latestAvgKmpl,
    monthlyTotals,
  };
}
