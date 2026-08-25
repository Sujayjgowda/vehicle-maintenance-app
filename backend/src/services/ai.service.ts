import { GoogleGenAI } from "@google/genai";
import prisma from "../lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";

function getAiClient() {
  if (GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return null;
}

export interface DiagnosisResult {
  title: string;
  severity: "LOW" | "MEDIUM" | "CRITICAL";
  severityColor: string;
  summary: string;
  possibleCauses: string[];
  recommendedActions: string[];
  estimatedCostRangeInr: string;
  canDriveSafely: boolean;
  disclaimer: string;
}

export interface ComponentHealth {
  name: string;
  icon: string;
  score: number; // 0 - 100
  status: "GOOD" | "ATTENTION" | "CRITICAL";
  statusColor: string;
  wearPercentage: number;
  dueInKm: number;
  recommendation: string;
}

/**
 * 1. AI Mechanic & Diagnostic Assistant
 */
export async function diagnoseVehicleIssue(
  symptoms: string,
  vehicleInfo?: { make?: string; model?: string; year?: number; odometer?: number; fuelType?: string }
): Promise<DiagnosisResult> {
  const ai = getAiClient();

  if (ai) {
    try {
      const vehicleCtx = vehicleInfo
        ? `Vehicle: ${vehicleInfo.year || ""} ${vehicleInfo.make || ""} ${vehicleInfo.model || ""} (${vehicleInfo.fuelType || "Petrol"}, Current Odo: ${vehicleInfo.odometer || 0} KM)`
        : "Vehicle: Generic Automobile";

      const prompt = `You are "Garage Grid AI", an expert automotive mechanic and diagnostic specialist in India.
${vehicleCtx}

User Symptoms / Warning Lights / Trouble Codes:
"${symptoms}"

Analyze this issue and output ONLY a valid JSON object matching this schema:
{
  "title": "Short descriptive title of diagnosis",
  "severity": "LOW" | "MEDIUM" | "CRITICAL",
  "summary": "2-3 sentence clear non-technical explanation of what is happening",
  "possibleCauses": ["Cause 1", "Cause 2", "Cause 3"],
  "recommendedActions": ["Immediate step 1", "Step 2", "Step 3"],
  "estimatedCostRangeInr": "Estimated repair/parts cost in INR (e.g. ₹1,500 - ₹3,500)",
  "canDriveSafely": true or false
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const severity = parsed.severity === "CRITICAL" ? "CRITICAL" : parsed.severity === "LOW" ? "LOW" : "MEDIUM";
        return {
          title: parsed.title || "Diagnostic Assessment",
          severity,
          severityColor: severity === "CRITICAL" ? "#EF4444" : severity === "MEDIUM" ? "#F59E0B" : "#10B981",
          summary: parsed.summary || "Diagnosis completed based on reported symptoms.",
          possibleCauses: parsed.possibleCauses || ["Wear and tear", "Sensor calibration needed"],
          recommendedActions: parsed.recommendedActions || ["Inspect at authorized service center", "Check fluid levels"],
          estimatedCostRangeInr: parsed.estimatedCostRangeInr || "₹1,000 - ₹3,000",
          canDriveSafely: Boolean(parsed.canDriveSafely),
          disclaimer: "AI guidance is for informational triage. Always consult a certified technician.",
        };
      }
    } catch (e) {
      console.error("Gemini AI diagnosis error, using expert rule engine:", e);
    }
  }

  // Expert Automotive Knowledge Engine Fallback
  return fallbackAutomotiveDiagnosis(symptoms, vehicleInfo);
}

/**
 * Built-in expert automotive triage rule engine
 */
function fallbackAutomotiveDiagnosis(
  symptoms: string,
  vehicleInfo?: { make?: string; model?: string; year?: number; odometer?: number; fuelType?: string }
): DiagnosisResult {
  const query = symptoms.toLowerCase();

  if (query.includes("brake") || query.includes("squeal") || query.includes("grinding")) {
    return {
      title: "Brake System & Friction Pad Wear",
      severity: "MEDIUM",
      severityColor: "#F59E0B",
      summary: "Squealing or grinding indicates brake pad wear indicators have reached the rotor surface or dust buildup.",
      possibleCauses: [
        "Worn brake pads (< 3mm friction material left)",
        "Scored or glazed brake rotors / discs",
        "Moisture or dust accumulation in caliper pins",
      ],
      recommendedActions: [
        "Inspect front and rear brake pad thickness",
        "Check brake fluid level in reservoir",
        "Avoid aggressive high-speed braking until inspected",
      ],
      estimatedCostRangeInr: "₹1,200 - ₹3,500 (Pads + Labour)",
      canDriveSafely: true,
      disclaimer: "AI guidance is for informational triage. Always verify with a certified technician.",
    };
  }

  if (query.includes("overheat") || query.includes("temp") || query.includes("coolant") || query.includes("steam")) {
    return {
      title: "Engine Cooling System Overheating",
      severity: "CRITICAL",
      severityColor: "#EF4444",
      summary: "Engine temperature has exceeded safe operating thresholds. Continued driving can cause head gasket failure or engine seizure.",
      possibleCauses: [
        "Low coolant level or radiator hose leak",
        "Radiator fan failure or stuck thermostat valve",
        "Water pump malfunction or drive belt slippage",
      ],
      recommendedActions: [
        "Pull over immediately and turn off engine",
        "DO NOT open radiator cap while hot (risk of severe burns)",
        "Check coolant reservoir level after 20 minutes cooling",
        "Call roadside assistance / tow truck if coolant is dry",
      ],
      estimatedCostRangeInr: "₹800 - ₹5,000 (Coolant flush to Thermostat/Pump)",
      canDriveSafely: false,
      disclaimer: "AI guidance is for informational triage. Always verify with a certified technician.",
    };
  }

  if (query.includes("battery") || query.includes("start") || query.includes("crank") || query.includes("clicking")) {
    return {
      title: "Starting & Electrical Charging System",
      severity: "MEDIUM",
      severityColor: "#F59E0B",
      summary: "Slow cranking or clicking sounds usually indicate a degraded 12V battery, sulfation, or alternator charging deficit.",
      possibleCauses: [
        "12V Battery terminal corrosion or low resting voltage (<12.2V)",
        "Battery reached end of useful lifespan (3-4 years)",
        "Alternator belt slack or faulty starter solenoid",
      ],
      recommendedActions: [
        "Clean battery terminals with baking soda / wire brush",
        "Perform battery load test at nearest garage / Exide/Amaron dealer",
        "Jump-start vehicle if voltage is below threshold",
      ],
      estimatedCostRangeInr: "₹3,500 - ₹6,500 (New 12V Battery)",
      canDriveSafely: true,
      disclaimer: "AI guidance is for informational triage. Always verify with a certified technician.",
    };
  }

  if (query.includes("p0420") || query.includes("catalytic") || query.includes("check engine") || query.includes("p0300")) {
    return {
      title: "Check Engine Warning & Emissions System",
      severity: "MEDIUM",
      severityColor: "#F59E0B",
      summary: "The Engine Control Unit (ECU) detected an emissions or cylinder combustion irregularity.",
      possibleCauses: [
        "Loose fuel filler cap or EVAP purge valve leak",
        "Oxygen (O2) sensor degradation or catalytic converter threshold",
        "Spark plug fouling or ignition coil misfire",
      ],
      recommendedActions: [
        "Check if Check Engine Light is solid or blinking (blinking = STOP immediately)",
        "Tighten fuel cap securely",
        "Scan OBD-II port with scanner tool to clear confirmed fault codes",
      ],
      estimatedCostRangeInr: "₹500 (OBD Scan) - ₹4,000 (O2 Sensor / Plugs)",
      canDriveSafely: true,
      disclaimer: "AI guidance is for informational triage. Always verify with a certified technician.",
    };
  }

  // General Diagnostic
  return {
    title: "General Vehicle Triage Assessment",
    severity: "LOW",
    severityColor: "#10B981",
    summary: `Analyzed symptoms: "${symptoms}". Based on typical operating wear, standard preventative inspection is recommended.`,
    possibleCauses: [
      "Normal component wear & tear",
      "Minor sensor calibration or fluid top-up required",
      "Suspension bushing or wheel balancing alignment",
    ],
    recommendedActions: [
      "Check engine oil, coolant, and tyre pressure",
      "Log record in Garage Grid to track recurring symptoms",
      "Mention this symptom during your next scheduled routine service",
    ],
    estimatedCostRangeInr: "₹500 - ₹2,000 (Inspection & minor adjustments)",
    canDriveSafely: true,
    disclaimer: "AI guidance is for informational triage. Always verify with a certified technician.",
  };
}

/**
 * 2. Predictive Vehicle Health & Component Life Calculation
 */
export async function getPredictiveHealth(vehicleId: string): Promise<{
  overallScore: number;
  overallStatus: "EXCELLENT" | "GOOD" | "ATTENTION_NEEDED";
  components: ComponentHealth[];
  summary: string;
}> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      serviceRecords: { orderBy: { date: "desc" }, take: 5 },
      fuelRecords: { orderBy: { date: "desc" }, take: 5 },
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const currentOdo = vehicle.currentOdometer || 0;
  const lastService = vehicle.serviceRecords[0];
  const odoSinceService = lastService ? Math.max(0, currentOdo - (lastService.odometer || 0)) : currentOdo % 10000;
  const daysSinceService = lastService
    ? Math.floor((Date.now() - new Date(lastService.date).getTime()) / (1000 * 60 * 60 * 24))
    : 120;

  // 1. Engine Oil (due every 10,000 km or 180 days)
  const oilKmLeft = Math.max(0, 10000 - odoSinceService);
  const oilWear = Math.min(100, Math.round((odoSinceService / 10000) * 100));
  const oilScore = Math.max(10, 100 - oilWear);

  // 2. Brake Pads (due every 25,000 km)
  const brakeOdoMod = currentOdo % 25000;
  const brakeWear = Math.min(100, Math.round((brakeOdoMod / 25000) * 100));
  const brakeScore = Math.max(15, 100 - brakeWear);

  // 3. Tyres & Tread (due every 40,000 km)
  const tyreOdoMod = currentOdo % 40000;
  const tyreWear = Math.min(100, Math.round((tyreOdoMod / 40000) * 100));
  const tyreScore = Math.max(20, 100 - tyreWear);

  // 4. 12V Battery Health
  const vehicleAgeYears = new Date().getFullYear() - (vehicle.year || new Date().getFullYear());
  const batteryLifePct = Math.max(25, 100 - (vehicleAgeYears % 4) * 22);

  // 5. Air & Cabin Filter (due every 15,000 km)
  const filterOdoMod = currentOdo % 15000;
  const filterWear = Math.min(100, Math.round((filterOdoMod / 15000) * 100));
  const filterScore = Math.max(15, 100 - filterWear);

  const components: ComponentHealth[] = [
    {
      name: "Engine Oil & Filter",
      icon: "water",
      score: oilScore,
      status: oilScore > 70 ? "GOOD" : oilScore > 40 ? "ATTENTION" : "CRITICAL",
      statusColor: oilScore > 70 ? "#10B981" : oilScore > 40 ? "#F59E0B" : "#EF4444",
      wearPercentage: oilWear,
      dueInKm: oilKmLeft,
      recommendation:
        oilKmLeft < 1500
          ? "Engine oil replacement due soon. Schedule oil & filter change."
          : `Optimal lubrication condition. Good for another ${oilKmLeft.toLocaleString()} KM.`,
    },
    {
      name: "Brake Pads & Rotors",
      icon: "disc",
      score: brakeScore,
      status: brakeScore > 65 ? "GOOD" : brakeScore > 35 ? "ATTENTION" : "CRITICAL",
      statusColor: brakeScore > 65 ? "#10B981" : brakeScore > 35 ? "#F59E0B" : "#EF4444",
      wearPercentage: brakeWear,
      dueInKm: Math.max(0, 25000 - brakeOdoMod),
      recommendation:
        brakeScore < 40
          ? "Check friction lining thickness. Possible brake squeal risk."
          : "Brake friction thickness within safe operational tolerance.",
    },
    {
      name: "Tyre Health & Alignment",
      icon: "ellipse-outline",
      score: tyreScore,
      status: tyreScore > 60 ? "GOOD" : tyreScore > 30 ? "ATTENTION" : "CRITICAL",
      statusColor: tyreScore > 60 ? "#10B981" : tyreScore > 30 ? "#F59E0B" : "#EF4444",
      wearPercentage: tyreWear,
      dueInKm: Math.max(0, 40000 - tyreOdoMod),
      recommendation: "Rotate tyres every 10,000 KM for uniform tread wear and optimal fuel economy.",
    },
    {
      name: "12V Battery & Alternator",
      icon: "flash",
      score: batteryLifePct,
      status: batteryLifePct > 60 ? "GOOD" : "ATTENTION",
      statusColor: batteryLifePct > 60 ? "#10B981" : "#F59E0B",
      wearPercentage: 100 - batteryLifePct,
      dueInKm: 0,
      recommendation: "Terminal voltage and alternator charging output healthy.",
    },
    {
      name: "Air & Cabin Filter",
      icon: "leaf",
      score: filterScore,
      status: filterScore > 60 ? "GOOD" : "ATTENTION",
      statusColor: filterScore > 60 ? "#10B981" : "#F59E0B",
      wearPercentage: filterWear,
      dueInKm: Math.max(0, 15000 - filterOdoMod),
      recommendation: "Clean air filter ensures smooth engine combustion and peak KM/L mileage.",
    },
  ];

  const overallScore = Math.round(
    components.reduce((sum, c) => sum + c.score, 0) / components.length
  );

  const overallStatus =
    overallScore >= 80 ? "EXCELLENT" : overallScore >= 60 ? "GOOD" : "ATTENTION_NEEDED";

  return {
    overallScore,
    overallStatus,
    components,
    summary:
      overallScore >= 80
        ? `Your ${vehicle.make} ${vehicle.model} is in peak operating condition with high reliability.`
        : `Your ${vehicle.make} ${vehicle.model} has ${components.filter((c) => c.status !== "GOOD").length} components requiring attention soon.`,
  };
}

/**
 * 3. AI Receipt & Invoice OCR Parser
 */
export async function parseReceiptText(text: string): Promise<{
  liters?: number;
  cost?: number;
  ratePerLiter?: number;
  date?: string;
  odometer?: number;
  category?: string;
  notes?: string;
}> {
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are a receipt and invoice OCR parser for automotive fuel and garage bills in India.
Extract transaction details from this receipt text:
"${text}"

Output ONLY a JSON object:
{
  "liters": number or null,
  "cost": number or null,
  "ratePerLiter": number or null,
  "date": "YYYY-MM-DD" or null,
  "odometer": number or null,
  "category": "FUEL" | "SERVICE" | "REPAIR" | "TOLL" | "PARKING" | "OTHER",
  "notes": "Short summary of items/station/garage"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resText = response.text || "";
      const jsonMatch = resText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("AI receipt parser error:", e);
    }
  }

  // Simple regex fallback
  const costMatch = text.match(/(?:total|amount|rs|₹|inr)[\s:.]*([0-9,]+(?:\.[0-9]{2})?)/i);
  const litersMatch = text.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:liters|ltr|lts|l\b)/i);

  const parsedCost = costMatch && costMatch[1] ? parseFloat(costMatch[1].replace(/,/g, "")) : undefined;
  const parsedLiters = litersMatch && litersMatch[1] ? parseFloat(litersMatch[1]) : undefined;

  return {
    cost: parsedCost,
    liters: parsedLiters,
    category: text.toLowerCase().includes("petrol") || text.toLowerCase().includes("diesel") ? "FUEL" : "SERVICE",
    notes: "Scanned bill entry",
  };
}
