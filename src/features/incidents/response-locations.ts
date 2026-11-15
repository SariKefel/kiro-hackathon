export const responseLocations = [
  {
    id: "welfare",
    name: "Seksyen 7 welfare checks",
    shortName: "Welfare checks",
    coordinates: [101.489, 3.074] as [number, number],
    description: "Coordinate household welfare checks and evacuation assistance around Seksyen 7.",
    kind: "Community support",
  },
  {
    id: "boat",
    name: "Jalan Plumbum access point",
    shortName: "Boat support",
    coordinates: [101.497, 3.066] as [number, number],
    description: "Stage boat support for teams reporting restricted road access.",
    kind: "Rescue staging",
  },
  {
    id: "relief",
    name: "SK Seksyen 7 relief centre",
    shortName: "Relief centre",
    coordinates: [101.482, 3.068] as [number, number],
    description: "Coordinate medical support, relief supplies, and shelter assistance.",
    kind: "Relief support",
  },
];

export type LocationAssignments = Record<string, string>;
export const initialLocationAssignments: LocationAssignments = {
  "demo-user-1": "welfare",
  "demo-user-10": "welfare",
  "demo-user-2": "relief",
  "demo-user-4": "relief",
  "demo-user-6": "relief",
};

export function isLocationId(value: unknown): value is string {
  return responseLocations.some((location) => location.id === value);
}
