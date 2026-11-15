import type { Metadata } from "next";
import { DisasterExplorer } from "@/features/hazards/explorer";

export const metadata: Metadata = {
  title: "Disaster Explorer",
  description: "Source-attributed public hazard reports for regional investigation.",
};

export default function ExplorerPage() {
  return <DisasterExplorer />;
}
