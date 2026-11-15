import { demoSnapshot, personnel } from "@/features/incidents/demo-data";
import type { DispatchContext, DispatchSite, ResponderPosition } from "./logic";

// Sample coordinates around Seksyen 7, Shah Alam. Illustrative, not surveyed.
export const dispatchSites: DispatchSite[] = [
  {
    id: "site-plumbum",
    name: "Jalan Plumbum boat access",
    need: "Residents stranded on upper floors. Boat support and evacuation.",
    priority: "critical",
    latitude: 3.069,
    longitude: 101.526,
  },
  {
    id: "site-kristal",
    name: "Jalan Kristal welfare block",
    need: "Elderly residents need welfare checks and medication.",
    priority: "high",
    latitude: 3.076,
    longitude: 101.515,
  },
  {
    id: "site-relief",
    name: "SK Seksyen 7 relief centre",
    need: "Extra hands for intake and supply distribution.",
    priority: "normal",
    latitude: 3.0725,
    longitude: 101.51,
  },
];

const seeded: Array<[number, number, string] | null> = [
  [3.071, 101.5235, "00:37"], // Amir Hassan
  [3.0728, 101.5105, "00:35"], // Mei Ling Tan
  [3.0688, 101.5268, "00:32"], // Ravi Kumar, needs help
  [3.0745, 101.513, "00:30"], // Siti Aisyah
  [3.0725, 101.511, "00:28"], // Daniel Lee, unable to continue
  [3.0735, 101.516, "00:25"], // Farah Ismail
  null, // Jason Wong, no location shared
  [3.077, 101.52, "00:22"], // Priya Nair
  [3.0695, 101.525, "2026-11-14T15:10:00Z"], // Hakim Zain, stale
  [3.066, 101.53, "00:18"], // Nur Izzati
];

export const responderPositions: ResponderPosition[] = personnel.flatMap((person, index) => {
  const entry = seeded[index];
  if (!entry) return [];
  const [latitude, longitude, time] = entry;
  return [
    {
      userId: person.id,
      latitude,
      longitude,
      capturedAt: time.includes("T") ? time : `2026-11-15T${time}:00Z`,
    },
  ];
});

export const dispatchContext: DispatchContext = {
  sites: dispatchSites,
  people: personnel,
  positions: responderPositions,
  snapshotMs: Date.parse(demoSnapshot),
};
