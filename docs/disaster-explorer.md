# Disaster Explorer

Disaster Explorer supports Regional Hazard Triage through genuine public USGS and GDACS reports.
Open it from commander navigation or visit `/explorer`.
The surrounding organization workspace remains in Demo Mode.
External Hazard Events do not create Managed Incidents or establish whether personnel are safe.

## Local setup

```sh
bun install --frozen-lockfile
bash scripts/setup-mapbox.sh
bun run dev
```

Use the existing wizard to save an intentionally public Mapbox `pk.` browser token in the ignored local environment file.
The token needs public style and font access and origin restrictions permitting the intended localhost or hosted origin.
Never use a secret `sk.` token, database connection string, or authentication secret in a public environment variable.
Restart the development server after changing local environment configuration.
The list, filters, details, and report links remain useful when the token, tiles, or WebGL are unavailable.
Configuring a token does not prove that the basemap or its origin restrictions work; verify them in a real browser.

## Source selection and interpretation

| Feed                    | Selection                                                              | Location and measurements                                                                    |
| ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| USGS earthquakes        | M4.5+ weekly GeoJSON, earthquake occurrence within the last seven days | Epicenter, source magnitude and magnitude type, depth in kilometers                          |
| GDACS floods            | Provider-selected current MAP flood listing                            | Provider Representative Location, native overall and episode impact labels when supplied     |
| GDACS tropical cyclones | Provider-selected current MAP tropical cyclone listing                 | Provider Representative Location, source episode metadata and meaningful native measurements |

GDACS representations are grouped by event type and provider event ID before counting events.
Only actual Point geometry with the exact `Point_Centroid` class is eligible for a marker.
Identical representations collapse into one point; conflicting or missing eligible centroids produce coverage diagnostics.
Polygons, tracks, cones, and other representations do not become approximate marker locations.
Cluster counts describe normalized source events, not independently verified unique physical disasters.

An epicenter or representative point is not an affected-area boundary.
A GDACS centroid is not a verified latest cyclone position, and its observation time and positional accuracy may be unknown.
Reported periods, occurrence time, source record modification, observation when supplied, and successful retrieval are separate concepts.
Undocumented offset-free source times retain their raw value and explicitly unspecified timezone.
Retrieving an old source record again does not make it a new observation.
GDACS current-list membership is a source selection rule rather than a verified ongoing-danger classification.
Magnitude and GDACS impact levels are different native measurements without a shared urgency score.

## Investigation workflow

The opening view is Southeast Asia.
Malaysia, Southeast Asia, and World presets deliberately move the camera; they do not apply administrative-boundary or affected-country filters.
The results list describes reported point locations in view and follows the same hazard-type filters as the map.
Events that share a point remain accessible through the list.
Select a marker or list record to inspect details, then use Back to results to continue.
The primary follow-up action opens the original provider report.

An empty viewport means no matching reported locations in the loaded data.
It does not imply complete local warning coverage or that a region is unaffected.
Use an explicit wider-region preset when a suitable event is outside the current view.
On mobile, use the results button to open the single results/details sheet; dragging is not required.
The list also supplies keyboard access to events independently of the canvas.

## Retrieval, failures, and coverage limits

The client attempts retrieval every five minutes while visible and online, with focus/reconnection recovery, throttled manual retry, a 15-second timeout, and bounded failure delays.
Hidden or offline views pause automatic activity.
Each feed has an independent last successful retrieval time and a delayed-refresh indication after 15 minutes.
Connectivity and a recent response timestamp do not establish fresh provider observations.

The server queries fixed provider destinations with independent eight-second timeouts and two-MiB streamed response limits.
Successful validated feed snapshots have 300-second cache revalidation eligibility.
Concurrent requests share work where practical; the cache does not guarantee distributed exactly-once retrieval or durable outage recovery.
Demand-driven revalidation can initially return a retained older snapshot.
Previously loaded data remains labeled when a retrieval fails, while a successful empty feed replaces its previous records.
A usable partial or empty snapshot produces HTTP 200; no usable feed snapshot produces a structured HTTP 503 response.

Normalized responses are bounded to 1,000 events and 512 KiB.
Coverage diagnostics disclose omitted records, invalid candidates, ambiguous locations, and limits with available/displayed counts.
Selection ordering does not represent a universal urgency rank.
The browser and service worker do not persist the hazard API response, and offline map tiles are not provided.
An open tab may retain previous reports; reloading offline does not promise a recoverable map.

## Two-minute demonstration

1. Open Disaster Explorer on Southeast Asia and identify the genuine external-report and source-selection explanations.
2. Inspect a genuine GDACS flood or tropical cyclone, explain its representative location and reported period, and open the original report.
3. Inspect a genuine earthquake and explain magnitude, depth, and occurrence time separately from retrieval.
4. Toggle a hazard type, expand a cluster, and select a record from the synchronized list.
5. Show the mobile results/details sheet and Back behavior.
6. Point out independent source health and the delayed-data behavior verified with controlled failures.

Use an explicit World or wider-region preset when no suitable report is visible initially.
Never substitute fabricated live reports for an empty region or unavailable provider.

## Verification

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run format:check
```

Deterministic tests exercise the public hazard-query contract using controlled provider transport, time, and snapshot conditions.
Live-provider smoke checks and browser acceptance remain separate from fixture tests.
Verify actual cache reuse and failure retention in a local production build, rather than inferring framework behavior solely from test doubles.
Browser acceptance includes presets, filtering, clustering, selection, refresh preservation, empty and unavailable views, phone width, keyboard focus, themes, reduced motion, attribution, and map failure.
Inspect genuine USGS and GDACS records and open their reports when live providers are available.
The existing check-in tests and the [offline verification workflow](../README.md#manually-verify-offline-behavior) protect the demo outbox and acknowledgement guarantees.

Publishing, deployment, paid-service enrollment, database changes, and credential rotation are separate operations.
Use the [operations runbook](operations.md) before a deployment or cloud configuration change.

## Provider references

Source contracts follow the [USGS GeoJSON feed documentation](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php), [GDACS API documentation](https://www.gdacs.org/gdacsapi/swagger/index.html), and [GDACS terms](https://www.gdacs.org/Documents/2025/GDACS_Terms_of_use_Mar_25.pdf).
Public browser-token setup follows [Mapbox token guidance](https://docs.mapbox.com/accounts/guides/tokens/).
