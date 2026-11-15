import { demoSnapshot, personnel } from "@/features/incidents/demo-data";
import { responseLocations } from "@/features/incidents/response-locations";
import type { DispatchContext, DispatchSite, ResponderPosition } from "./logic";

// Dispatch uses the shared response locations so calls and map assignments agree.
const priorities: Record<string, DispatchSite["priority"]> = {
  boat: "critical",
  welfare: "high",
  relief: "normal",
};
const order = ["boat", "welfare", "relief"];
export const dispatchSites: DispatchSite[] = [...responseLocations]
  .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  .map((location) => ({
    id: location.id,
    name: location.name,
    need: location.description,
    priority: priorities[location.id] ?? "normal",
    latitude: location.coordinates[1],
    longitude: location.coordinates[0],
  }));

// Sample positions were laid out around the original boat site; shift them onto the shared one.
const boat = dispatchSites.find((site) => site.id === "boat")!;
const shift = [boat.latitude - 3.069, boat.longitude - 101.526];

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
      latitude: latitude + shift[0],
      longitude: longitude + shift[1],
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
