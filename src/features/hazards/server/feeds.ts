import type { FeedId, HazardType, Provider } from "../types";

export const FEEDS: {
  id: FeedId;
  provider: Provider;
  type: HazardType;
  url: string;
  selection: string;
}[] = [
  {
    id: "usgs-earthquakes",
    provider: "USGS",
    type: "earthquake",
    url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
    selection: "USGS M4.5+ earthquakes occurring in the last seven days",
  },
  {
    id: "gdacs-floods",
    provider: "GDACS",
    type: "flood",
    url: "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=FL",
    selection: "GDACS current MAP flood listings; membership does not establish ongoing danger",
  },
  {
    id: "gdacs-cyclones",
    provider: "GDACS",
    type: "cyclone",
    url: "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=TC",
    selection:
      "GDACS current MAP tropical cyclone listings; representative points are not verified current cyclone positions",
  },
];

export type FeedDefinition = (typeof FEEDS)[number];
