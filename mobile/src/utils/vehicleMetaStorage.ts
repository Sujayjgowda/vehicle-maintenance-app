import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vehicle_fuel_types_v1';

/**
 * Save a vehicle's chosen fuel type locally by vehicle ID and license plate
 */
export async function saveVehicleFuelType(vehicleId: string, licensePlate: string, fuelType: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    
    if (vehicleId) map[vehicleId] = fuelType;
    if (licensePlate) map[licensePlate.trim().toUpperCase()] = fuelType;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.log('Error saving vehicle fuel type locally:', e);
  }
}

/**
 * Get all locally stored vehicle fuel type overrides
 */
export async function getVehicleFuelTypeMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Enriches a list of vehicles by merging locally saved fuel types if missing or null
 */
export async function enrichVehiclesWithFuelType(vehicles: any[]): Promise<any[]> {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return [];
  try {
    const map = await getVehicleFuelTypeMap();
    return vehicles.map((v) => {
      const plate = (v.licensePlate || '').trim().toUpperCase();
      const localFuel = map[v.id] || map[plate];
      return {
        ...v,
        fuelType: v.fuelType || localFuel || 'PETROL',
      };
    });
  } catch {
    return vehicles;
  }
}
