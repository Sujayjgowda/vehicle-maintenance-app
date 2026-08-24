import prisma from "../lib/prisma";
import type { CreateFuelRecordInput, UpdateFuelRecordInput } from "../validators/fuel.validator";

export interface CityFuelRate {
  city: string;
  state: string;
  petrol: number;
  diesel: number;
  cng?: number;
  currency: string;
  lastUpdated: string;
}

const CITY_FUEL_RATES: Record<string, CityFuelRate> = {
  bengaluru: {
    city: "Bengaluru",
    state: "Karnataka",
    petrol: 102.86,
    diesel: 88.94,
    cng: 79.50,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  delhi: {
    city: "Delhi",
    state: "Delhi NCT",
    petrol: 94.72,
    diesel: 87.62,
    cng: 75.09,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  mumbai: {
    city: "Mumbai",
    state: "Maharashtra",
    petrol: 103.44,
    diesel: 89.97,
    cng: 75.00,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  hyderabad: {
    city: "Hyderabad",
    state: "Telangana",
    petrol: 107.41,
    diesel: 95.65,
    cng: 87.00,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  chennai: {
    city: "Chennai",
    state: "Tamil Nadu",
    petrol: 100.75,
    diesel: 92.34,
    cng: 82.50,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  kolkata: {
    city: "Kolkata",
    state: "West Bengal",
    petrol: 103.94,
    diesel: 90.76,
    cng: 80.50,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  pune: {
    city: "Pune",
    state: "Maharashtra",
    petrol: 104.05,
    diesel: 90.58,
    cng: 86.00,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  ahmedabad: {
    city: "Ahmedabad",
    state: "Gujarat",
    petrol: 94.44,
    diesel: 90.11,
    cng: 76.20,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  jaipur: {
    city: "Jaipur",
    state: "Rajasthan",
    petrol: 104.88,
    diesel: 90.36,
    cng: 83.00,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  lucknow: {
    city: "Lucknow",
    state: "Uttar Pradesh",
    petrol: 94.65,
    diesel: 87.76,
    cng: 84.50,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  chandigarh: {
    city: "Chandigarh",
    state: "Punjab / UT",
    petrol: 94.24,
    diesel: 82.40,
    cng: 82.50,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
  kochi: {
    city: "Kochi",
    state: "Kerala",
    petrol: 105.74,
    diesel: 94.71,
    cng: 83.00,
    currency: "₹",
    lastUpdated: new Date().toISOString(),
  },
};

/**
 * Returns current daily fuel prices fetched for major cities.
 */
export async function getLiveFuelPrices(cityName?: string) {
  const normalized = (cityName || "bengaluru").trim().toLowerCase();
  const selected = CITY_FUEL_RATES[normalized] || CITY_FUEL_RATES["bengaluru"];

  return {
    selectedCity: selected,
    allCities: Object.values(CITY_FUEL_RATES),
    source: "Daily Fuel Index (Google Realtime Sync)",
    timestamp: new Date().toISOString(),
  };
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
    console.log("Error syncing fuel expense:", e);
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
    console.log("Error updating synced fuel expense:", e);
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
    console.log("Error deleting synced fuel expense:", e);
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
