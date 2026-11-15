# RescueSync FRD: Proximity Dispatch and Responder Navigation

Status: draft for the Kiro hackathon. Scope is Demo Mode (Phase 1 boundaries).

## 1. Purpose

Two linked features:

- **F1. Proximity dispatch.** The commander assigns the nearest suitable responder to an incident site.
- **F2. Responder navigation.** The assigned responder is guided to the site by the nearest usable route.

## 2. Roles

| Role      | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| Commander | Demo identity (Nadia Rahman). Views incidents, dispatches responders.         |
| Responder | Demo identity (Amir Hassan). Receives assignments, navigates, reports status. |

## 3. Assumptions and constraints

- A1. Phase 1 stays in Demo Mode. Responder positions are seeded sample data, not live tracking.
- A2. Responder location comes from the last check-in (explicitly shared or last-known), as today. No background tracking.
- A3. Assignment accept/decline and status changes go through the existing offline sync queue.
- A4. Straight-line (haversine) distance is acceptable for ranking. Route distance and ETA are estimates.
- A5. Real authorization (Better Auth, org checks) is out of scope. The Phase 2 note in the README still applies.

## 4. F1: Proximity dispatch (commander)

### Functional requirements

| ID    | Requirement                                                                                                                                                     | Priority |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F1-1  | Each incident has site coordinates (latitude, longitude).                                                                                                       | Must     |
| F1-2  | From an incident detail page, the commander can open a "Dispatch" panel.                                                                                        | Must     |
| F1-3  | The panel lists responders ranked by distance from the site, nearest first.                                                                                     | Must     |
| F1-4  | Each row shows name, team, safety status, distance, estimated travel time, and "location last updated X min ago".                                               | Must     |
| F1-5  | Responders with status Unable to Continue, or already on an active assignment, are shown as unavailable and cannot be assigned.                                 | Must     |
| F1-6  | A location older than a stale threshold (default 30 min) is flagged "stale" and ranked below fresh locations at similar distance.                               | Should   |
| F1-7  | The commander can filter the list by team or skill.                                                                                                             | Should   |
| F1-8  | The commander can assign one responder with a single action and an optional note.                                                                               | Must     |
| F1-9  | The panel highlights a recommended responder (nearest available, fresh location) but the commander may pick any available one.                                  | Must     |
| F1-10 | After assignment, the incident shows the assignee and assignment state: Pending, Accepted, Declined, En route, Arrived.                                         | Must     |
| F1-11 | If the responder declines or does not respond within a timeout (default 5 min), the incident returns to unassigned and the next-nearest responder is suggested. | Should   |
| F1-12 | Missing location data: responders with no known location appear at the bottom, labelled "Location unknown".                                                     | Must     |
| F1-13 | Dispatch actions are recorded in an activity log (who, what, when).                                                                                             | Could    |

### Acceptance criteria

- AC1. With seeded data, the list order matches distance from the site; changing the site location reorders it.
- AC2. An unavailable responder has a disabled assign control and a stated reason.
- AC3. Assigning a responder changes the incident state and shows the assignee on the commander dashboard.
- AC4. Declining returns the incident to unassigned and the commander sees the next suggestion.

## 5. F2: Responder navigation

### Functional requirements

| ID    | Requirement                                                                                                                               | Priority |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F2-1  | The responder home shows an "Assigned to you" card with incident, site, distance, estimated time, and Accept / Decline.                   | Must     |
| F2-2  | Accepting changes state to Accepted and enables "Navigate". Decline requires picking a reason (too far, unsafe, already busy, other).     | Must     |
| F2-3  | "Navigate" opens the device's maps app with the site as destination via a deep link.                                                      | Must     |
| F2-4  | Inside the app, the responder sees a navigation view: site marker, own position, straight-line distance, and bearing.                     | Should   |
| F2-5  | The app shows the nearest route summary (distance and ETA) when online. When offline it shows the last cached estimate, labelled as such. | Should   |
| F2-6  | The responder can mark state: En route, Arrived. Arrived can be set manually and is suggested when within 100 m of the site.              | Must     |
| F2-7  | The responder can flag a blocked route or hazard with a short note. The commander sees the flag on the incident.                          | Could    |
| F2-8  | Assignment details and site coordinates are cached locally so the card and the Maps link work offline.                                    | Must     |
| F2-9  | Accept, decline and state changes are queued offline and sent on reconnect using stable operation IDs, like check-ins.                    | Must     |
| F2-10 | Location is requested only when the responder explicitly taps for it. The UI says so.                                                     | Must     |

### Acceptance criteria

- AC5. With the network off, the assignment card still opens and the Maps link works.
- AC6. An action taken offline appears as pending, then synced after reconnection, with no duplicates.
- AC7. Declining requires a reason and removes the assignment from the responder's active list.
- AC8. Denied location permission does not block the flow. The responder can still accept and open Maps.

## 6. Data additions (indicative)

- Incident: `siteLat`, `siteLng`, `siteLabel`.
- Responder location: `lat`, `lng`, `capturedAt`, `source` (shared or last-known).
- Assignment: `id`, `incidentId`, `responderId`, `state`, `assignedBy`, `assignedAt`, `respondedAt`, `declineReason`.
- Queue operation types: `assignment.respond`, `assignment.state`.

## 7. Non-functional requirements

- N1. Dispatch ranking recomputes in under 200 ms for 100 responders.
- N2. All new controls are keyboard operable with visible focus and semantic labels, matching the existing accessibility standard.
- N3. Distance and ETA are labelled "estimate". Straight-line distance is not presented as road distance.
- N4. Sample data stays clearly labelled as sample.

## 8. Out of scope

- Live GPS tracking and background location.
- In-app turn-by-turn routing and offline map tiles.
- Real authentication and authorization.
- Server persistence of assignments (Phase 2).

## 9. Open questions

1. Should dispatch consider skills or team only, or distance alone?
2. Decline timeout: 5 minutes, or configurable per incident priority?
3. Should the demo include a draggable site pin to show the ranking changing live?
4. Is "Open in Maps" enough for navigation, or do judges expect an in-app route?
