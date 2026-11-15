import type { DriveStep } from "driver.js";

function step(target: string, title: string, description: string): DriveStep {
  return { element: `[data-tour="${target}"]`, popover: { title, description } };
}
const demo = step(
  "demo-mode",
  "A safe place to explore",
  "Incident and personnel records are samples. Map assignments stay in this browser. Check-ins save on this device and remain pending in Demo Mode.",
);
const locations = [
  step(
    "response-map",
    "One shared response map",
    "The overview and incident views use the same map and demo assignments. Pan or zoom for geographic context. Response positions are illustrative, not verified field locations.",
  ),
  step(
    "response-locations",
    "Choose a response location",
    "Click a map marker or one of these locations. Marker numbers show assigned responders, not people detected at the scene.",
  ),
  step(
    "response-roster",
    "See who is assigned",
    "Review the selected location's responders here. Removing an assignment frees that person from this demo location; it does not change their safety report.",
  ),
  step(
    "assign-responders",
    "Staff this location",
    "After the tour, select Assign responders. Search by name or team, then choose Assign or Move here. A move replaces the previous location. Only responders with a Safe sample report can receive a new assignment.",
  ),
];

export function tourForPath(path: string): { title: string; steps: DriveStep[] } {
  let title: string;
  let steps: DriveStep[];
  if (path === "/dashboard") {
    title = "Your command center";
    steps = [
      demo,
      step(
        "accountability-summary",
        "Account for every responder",
        "Start with these sample safety totals. Unknown means a check-in is missing or outdated, so it needs follow-up.",
      ),
      ...locations,
      step(
        "priority-alerts",
        "Follow up where it matters",
        "Open a priority alert to review a responder's latest report. Assigning a location does not resolve an assistance request.",
      ),
    ];
  } else if (path.startsWith("/incidents")) {
    title = "Coordinate the response";
    steps = [demo, ...locations];
  } else if (path === "/personnel") {
    title = "Know your people";
    steps = [
      demo,
      step(
        "personnel-filters",
        "Find a responder",
        "Search by name, team, or role. Combine team and safety filters to focus on people needing attention. Clear filters to see everyone again.",
      ),
      step(
        "personnel-records",
        "Open a person's report",
        "Select a row to see the latest sample report, check-in time, and demo response assignment. Location assignments made on the map appear here.",
      ),
    ];
  } else if (path === "/explorer") {
    title = "Explore reported hazards";
    steps = [
      step(
        "hazard-intro",
        "Public reports, separate from your response",
        "These are genuine external hazard reports from USGS and GDACS. A public report does not create a managed incident or assign responders.",
      ),
      step(
        "hazard-filters",
        "Focus your search",
        "Choose a region and toggle hazard types. These filters change the map and the report list together. Feed coverage is limited; no reports does not mean no risk.",
      ),
      step(
        "hazard-map",
        "Inspect a reported location",
        "Select a marker to inspect its source report. Select a cluster to zoom in. On mobile, use View reports to open the list. Points represent provider locations, not affected boundaries or responder positions.",
      ),
    ];
  } else if (path === "/responder/check-in") {
    title = "Report your safety";
    steps = [
      demo,
      step(
        "check-in-status",
        "Choose how you are doing",
        "Select Safe, Needs help, or Unable to continue. The tour will not choose a status or submit a report for you.",
      ),
      step(
        "check-in-details",
        "Add useful context",
        "Describe what your team should know. Location is optional; share it only if you choose. Keep an independent emergency contact channel available.",
      ),
      step(
        "check-in-save",
        "Save on this device first",
        "Save check-in writes to this browser, including when offline. In this demo it stays pending and is not delivered to command. Saved locally is not confirmation of receipt.",
      ),
      step(
        "check-in-result",
        "Your report is saved locally",
        "Review its delivery state here. Demo Mode keeps reports pending; return to responder home to review reports saved on this device.",
      ),
    ];
  } else if (path === "/responder/tasks") {
    title = "Understand your tasks";
    steps = [
      step(
        "responder-tasks",
        "Review your sample assignments",
        "Read each task's instructions, priority, and status. These are sample tasks; changing a location assignment on the command map does not update these task records.",
      ),
    ];
  } else if (path === "/responder") {
    title = "Your field workspace";
    steps = [
      demo,
      step(
        "responder-safety",
        "Start with your safety",
        "Review the sample incident and last confirmed status, then use Report my safety to create a new local check-in.",
      ),
      step(
        "responder-assignment",
        "Know your next task",
        "Read the sample task and open Tasks for its full instructions. Demo location assignments and task records are separate.",
      ),
      step(
        "local-reports",
        "Check what is saved here",
        "Reports saved on this device appear here with their delivery state. Demo reports remain pending, even after reconnecting or retrying.",
      ),
    ];
  } else {
    title = "Your demo workspace";
    steps = [
      demo,
      step(
        "device-settings",
        "Manage this device",
        "Choose a readable theme and review pending reports. Clearing browser data removes local check-ins and demo location assignments.",
      ),
      step(
        "about",
        "Explore both perspectives",
        "Use the field responder view to try a local check-in as Amir Hassan. Production sign-in, real assignments, and server delivery are not enabled in this demo.",
      ),
    ];
  }
  return {
    title,
    steps: [
      {
        popover: {
          title,
          description:
            "A quick guide to this view. Use Next and Back, or the arrow keys. Press Escape or close the guide whenever you are ready to explore.",
        },
      },
      ...steps,
      {
        popover: {
          title: "Ready to try it",
          description: path.startsWith("/responder")
            ? "Try the field workflow at your own pace. Use Tour this view in the header to replay this guide. Demo reports stay on this device."
            : "Explore this view, then try another from the navigation. A useful demo sequence is Overview, Incidents, Disaster Explorer, Personnel, then the field responder view. Replay this guide from Tour this view in the header.",
        },
      },
    ],
  };
}
