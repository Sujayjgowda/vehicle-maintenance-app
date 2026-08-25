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

    const petrolData: Array<{ city: string; price: string; change?: string }> = petrolRes.ok
      ? await petrolRes.json()
      : [];
    const dieselData: Array<{ city: string; price: string; change?: string }> = dieselRes.ok
      ? await dieselRes.json()
      : [];
    const cityList: Array<{ name: string; value: string }> = citiesRes.ok
      ? await citiesRes.json()
      : [];

    const cityMap = new Map<string, { petrol: number; diesel: number; change?: string }>();

    if (Array.isArray(petrolData)) {
      for (const item of petrolData) {
        if (item.city && item.price) {
          const key = item.city.trim().toLowerCase();
          const p = parseFloat(item.price);
          if (!isNaN(p)) {
            cityMap.set(key, { petrol: p, diesel: 0, change: item.change });
          }
        }
      }
    }

    if (Array.isArray(dieselData)) {
      for (const item of dieselData) {
        if (item.city && item.price) {
          const key = item.city.trim().toLowerCase();
          const d = parseFloat(item.price);
          if (!isNaN(d)) {
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

// Fallback benchmark rates
const FALLBACK_BENCHMARKS: Record<string, { petrol: number; diesel: number; cng: number }> = {
  bengaluru: { petrol: 102.86, diesel: 88.94, cng: 79.50 },
  bangalore: { petrol: 102.86, diesel: 88.94, cng: 79.50 },
  delhi: { petrol: 94.72, diesel: 87.62, cng: 75.09 },
  mumbai: { petrol: 103.44, diesel: 89.97, cng: 75.00 },
  hyderabad: { petrol: 107.41, diesel: 95.65, cng: 87.00 },
  chennai: { petrol: 100.75, diesel: 92.34, cng: 82.50 },
  kolkata: { petrol: 103.94, diesel: 90.76, cng: 80.50 },
  pune: { petrol: 104.05, diesel: 90.58, cng: 86.00 },
  ahmedabad: { petrol: 94.44, diesel: 90.11, cng: 76.20 },
  jaipur: { petrol: 104.88, diesel: 90.36, cng: 83.00 },
  lucknow: { petrol: 94.65, diesel: 87.76, cng: 84.50 },
  chandigarh: { petrol: 94.24, diesel: 82.40, cng: 82.50 },
  mysore: { petrol: 102.75, diesel: 88.82, cng: 79.50 },
  mangalore: { petrol: 101.95, diesel: 87.98, cng: 79.50 },
  kochi: { petrol: 105.74, diesel: 94.71, cng: 83.00 },
};

/**
 * Returns current real-time daily fuel prices for any requested Indian city.
 */
export async function getLiveFuelPrices(cityName?: string) {
  const cache = await fetchFromIndianApi();
  const searchCity = (cityName || "Bengaluru").trim();
  const lowerSearch = searchCity.toLowerCase();

  let petrol = 102.86;
  let diesel = 88.94;
  let change = "0.00";
  let foundCityName = searchCity;

  if (cache && cache.cityMap.size > 0) {
    // 1. Direct match
    let match = cache.cityMap.get(lowerSearch);

    // 2. Fallback check for alternate spellings (e.g. Bangalore vs Bengaluru)
    if (!match) {
      if (lowerSearch === "bengaluru") match = cache.cityMap.get("bangalore");
      else if (lowerSearch === "bangalore") match = cache.cityMap.get("bengaluru");
    }

    // 3. Partial match
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
    const fallback = FALLBACK_BENCHMARKS[lowerSearch] || FALLBACK_BENCHMARKS["bengaluru"] || { petrol: 102.86, diesel: 88.94, cng: 79.50 };
    petrol = fallback.petrol;
    diesel = fallback.diesel;
  }

  const cng = 79.50;

  const popularCities = [
    "Bengaluru",
    "Delhi",
    "Mumbai",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Mysore",
    "Mangalore",
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
    availableCitiesCount: cache?.cityMap.size || popularCities.length,
    source: "fuel.indianapi.in (Live Indian Fuel API)",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns full list of searchable cities from fuel.indianapi.in
 */
export async function getIndianApiCities() {
  const cache = await fetchFromIndianApi();
  if (cache && cache.cityList.length > 0) {
    return cache.cityList;
  }
  return [
    { name: "Bengaluru", value: "bengaluru" },
    { name: "Delhi", value: "delhi" },
    { name: "Mumbai", value: "mumbai" },
    { name: "Hyderabad", value: "hyderabad" },
    { name: "Chennai", value: "chennai" },
    { name: "Kolkata", value: "kolkata" },
    { name: "Pune", value: "pune" },
    { name: "Mysore", value: "mysore" },
    { name: "Mangalore", value: "mangalore" },
    { name: "Ahmedabad", value: "ahmedabad" },
    { name: "Jaipur", value: "jaipur" },
    { name: "Lucknow", value: "lucknow" },
    { name: "Chandigarh", value: "chandigarh" },
    { name: "Kochi", value: "kochi" },
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
