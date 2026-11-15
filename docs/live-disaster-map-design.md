# Live Disaster Intelligence Map - discovery

Status: product choices through Q11 accepted; [the final architecture and implementation plan](live-disaster-map-plan.md) awaits explicit approval, 15 November 2026.
Application implementation requires explicit approval of the final plan.
The decision log identifies accepted choices; other recommendations remain proposals.

## Confirmed constraints

- Keep one Next.js application, Bun, the locked dependencies, and the configured Webpack build.
- Mapbox is required.
- External hazards must use genuine provider data with provenance and transparent timestamps.
- External hazard events and managed incidents are separate concepts, defined in [the glossary](../CONTEXT.md).
- Preserve the existing Demo Mode, local check-in namespace, acknowledgement rules, and service-worker boundaries in [AGENTS.md](../AGENTS.md).
- Real operational reads and mutations require session-bound identity and organization, membership, incident, and assignment authorization first.

## Decision log

The user accepted the following first-round choices and then agreed to the second-round recommendations below.

| Decision             | Accepted scope                                                                                            | Remaining detail                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Primary audience     | Regional commanders assessing hazards relevant to Malaysia and Southeast Asia                             | Source-specific regional coverage limits                                                                                            |
| Operational action   | Read-only intelligence for the first milestone                                                            | No incident creation, local response drafts, or new authenticated operational workflow in this milestone                            |
| Integration envelope | Two initial providers on existing services, with additional integrations behind explicit acceptance gates | Provider identities, deadline, available implementation hours, and any permitted additional spending                                |
| Retrieval guarantee  | Refresh while viewed                                                                                      | Cache implementation and source-health presentation; durable fallback, unattended collection, and history are not required promises |

The user accepted USGS plus GDACS after regional source comparison and live payload checks.
The resource-envelope answer does not establish a deadline or an implementation-hour budget.
These choices are design decisions, not approval to implement.

Accepted second-round recommendations:

- The concrete outcome is regional hazard triage: identify reports deserving investigation and inspect their original sources.
  Comprehensive current Malaysian district-warning coverage is outside the first milestone's promise.
- Open with a Southeast Asia overview and explicit Malaysia, Southeast Asia, and World presets.
  Preserve an empty regional view rather than silently widening coverage.
- Attempt retrieval every five minutes while visible, pause while hidden, and refresh on return.
  Indicate retrieval delay after 15 minutes without success, separately from observation age.
  Keep loaded records labeled appropriately during temporary failures; reload or cache loss has no durable fallback guarantee.
- Reserve the final quarter of available time for verification and demonstration preparation.
  The actual deadline and implementation hours remain unspecified, so delivery estimates must remain provisional.

Accepted third-round recommendations:

- Use USGS earthquakes and GDACS floods and tropical cyclones as the two-provider coverage contract.
- Use representative point markers, with explicit geographic meaning, and defer footprint and track layers.
- Keep event inspection in one synchronized list/detail panel on desktop and one mobile bottom sheet.
  A selected event replaces the desktop list, Back restores results, and Open original source is the primary action.

The final technical defaults and source-specific temporal selection are proposed in [the implementation plan](live-disaster-map-plan.md).
That plan is the authoritative proposed architecture; historical recommendations below document the research context.

## Repository audit

The inspected working tree initially matched `main...origin/main` with no local changes.

| Area           | Existing behavior                                                                                                                  | Implication                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Dependencies   | Locked Next.js 16.4.6, React 19.3.1, Tailwind 4.3.5, Drizzle 0.45.4, Neon serverless 1.2.1, Dexie 4.4.7, Zod 4.6.7, TypeScript 6.x | Mapbox, react-map-gl, SWR, and TanStack Query are absent                          |
| Routes         | Entry, login, commander dashboard, incident list/detail, personnel, settings, responder home/check-in/tasks                        | No explorer route or incident creation workflow                                   |
| Authentication | Demo role links and unguarded dashboard layout                                                                                     | Demo commander identity is not authorization                                      |
| Incidents      | One fixed sample flood incident with read-only personnel and tasks                                                                 | New real incidents cannot enter an existing functional response backend           |
| Map            | Illustrative SVG with fixed sample positions                                                                                       | Geographic SDK integration starts fresh                                           |
| Database       | Organization, user, membership, incident, assignment, check-in, and task schema; initial migration                                 | No hazard records, source state, geometry, provenance, or hazard links            |
| Database usage | Lazy server-only Drizzle factory used by database checks                                                                           | Application routes currently use sample data rather than database reads           |
| API            | Only `POST /api/sync`, with bounded validated requests and per-operation unavailable responses                                     | No remote check-in writes, hazard endpoint, ingestion endpoint, or Server Actions |
| Offline        | Durable Dexie outbox, retries, cross-tab claims, independent offline shell                                                         | Reuse conventions, not the demo outbox, for hazard retrieval                      |
| Design         | Public Sans, navy/slate and teal, light/dark tokens, Radix, Lucide, button/badge/card/skeleton                                     | Reuse visual language; add map layout accommodation and accessible details        |
| Hosting        | Existing Vercel project, verified Hobby billing plan through read-only team API                                                    | Scheduling must match actual Hobby capabilities                                   |

Evidence: [package manifest](../package.json), [lockfile](../bun.lock), [demo data](../src/features/incidents/demo-data.ts), [schema](../src/db/schema/index.ts), [sync service](../src/features/sync/service.ts), [SVG map](../src/components/incidents/incident-map.tsx), [README](../README.md), and [operations runbook](operations.md).

Baseline verification: `bun run test` passed all 12 tests and 38 assertions.
Application checks have not been represented as completed by this design-only session.

## Provider findings

### USGS

The [summary feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) publish hour, day, week, and month windows, updated every minute, with identifiers, event/update timestamps, and point coordinates including depth.
A read of the [M4.5+ weekly feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson) succeeded during discovery.
An epicenter is not a damage boundary, and magnitude is not an impact score.
Recommend this bounded feed first; use the [catalog API](https://earthquake.usgs.gov/fdsnws/event/1/) only when history or more selective spatial queries become a product requirement.

### NASA EONET

[Version 3](https://eonet.gsfc.nasa.gov/docs/v3) exposes categories, sources, lifecycle, and dated geometries.
An open event can have old observations, and closure is not a precise declaration that danger ended.
The [curation guidance](https://eonet.gsfc.nasa.gov/event-curation) explains category-specific lifecycle rules and that non-US wildfire inputs include GDACS.
Multiple aggregators are not independent corroboration.
Recommend selected wildfire, storm, and volcano categories, retaining the latest observation and original source references.

### GDACS

The [official API quickstart](https://gdacs.org/Documents/2025/GDACS_API_quickstart_v1.pdf) documents free GeoJSON search and attribution requirements.
[Swagger](https://www.gdacs.org/gdacsapi/swagger/index.html) distinguishes events, episodes, and geometry products.
The [terms](https://www.gdacs.org/Documents/2025/GDACS_Terms_of_use_Mar_25.pdf) describe potential humanitarian impact and warn about automated assessments and availability.
Selected for the first milestone's floods and cyclones, with provider-defined alert levels and episode revisions preserved.
Avoid adding another earthquake layer before explicit source linking exists.

### Malaysia weather

The [weather documentation](https://developer.data.gov.my/realtime-api/weather) documents forecast, warning, and earthquake-warning endpoints, supplied by MET Malaysia under CC BY 4.0.
Forecasts update daily; warnings update when required.
The documented warning payload has bilingual text and validity periods, but does not establish structured affected-region IDs, geometry, or stable warning IDs.
Timezone semantics and warning identity need payload verification.
The [Weather API limit](https://developer.data.gov.my/rate-limit) is four requests per minute.
Recommend an advisory list first; administrative mapping requires a reviewed location lookup and explicit uncertainty.

Live JSON retrieval for EONET, GDACS, and Malaysia was initially unverified because research tools could not retrieve the endpoints.
Follow-up read-only network requests successfully retrieved EONET and Malaysia JSON and some GDACS responses.
EONET returned JSON despite an RSS content-type header, so content-type alone is not a sufficient payload validator for that provider.
Follow-up EONET requests showed that open-only versus all-status selection materially changes recent regional coverage.
GDACS current MAP endpoints were successfully checked separately for floods and cyclones, using the singular `eventtype` parameter confirmed in its live Swagger schema.
The flood SEARCH request returned HTTP 204 while the current MAP response included recent floods; treat 204 as an empty response and do not assume SEARCH and MAP have interchangeable selection semantics.
Tool retrieval failures do not establish provider outages or empty feeds, and successful probes do not establish completeness or future availability.
Final request contracts and temporal selection semantics remain prerequisites to implementation estimates and adapter contracts.

### Follow-up regional payload checks

Read-only requests at approximately 04:14 UTC on 15 November 2026 established these bounded observations.

| Probe                                                                                                                      | Observed result                                                                        | Architectural implication                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [GDACS current floods](https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=FL)                            | Nine features representing three unique events, including Vietnam and Indonesia        | Collapse `Point_Centroid`, `Point_Affected`, and `Point_Global` representations into one source event before counting or clustering |
| [GDACS current cyclones](https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=TC)                          | 103 features, including points, lines, and polygons                                    | Select an appropriate documented point representation; feature count is not event count                                             |
| [EONET regional recent events](https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=30&limit=2000&bbox=90,30,145,-15) | 55 events, only one open, with the broad rectangle also covering northern Australia    | Open-only selection and rectangular coverage can produce misleading regional impressions                                            |
| [Malaysia warning sample](https://api.data.gov.my/weather/warning?limit=2)                                                 | Bilingual advisory prose with repeated issue/title/text and different validity windows | Records do not map one-to-one to a single place, hazard, or advisory identity                                                       |

The EONET Vietnam flood `EONET_26165` explicitly references GDACS `FL:1104271`.
EONET marked it closed on November 7, while GDACS's current MAP feed retained the event with a November 13 end date and November 14 modification date.
This demonstrates actual lifecycle disagreement and supports preserving source-native fields rather than merging them into universal ongoing status.
EONET bounding-box membership can match any historical event datapoint even when the latest location is outside the region.
GDACS affected-country information can include a regional country while its representative point is outside the viewport.
Viewport marker membership and an event's regional relevance must therefore be described separately.

For the accepted triage outcome, propose USGS earthquakes plus GDACS floods and cyclones.
EONET remains an alternative for recently observed natural-event exploration and a later integration, rather than a required third source.
Successful probes do not establish exhaustive coverage or an availability guarantee.

### Future providers

| Provider                                                                                                                  | Later role and prerequisite                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/map_key/)                                                           | Separate satellite detection layer; requires a MAP_KEY, and detections are not confirmed wildfire incidents                      |
| [Public InfoBanjir](https://publicinfobanjir.water.gov.my/)                                                               | Local river and flood context after a supported access and reuse contract is verified; no such API contract was established here |
| [NOAA/NWS](https://www.weather.gov/documentation/services-web-api)                                                        | US warning layer with identifying User-Agent and CAP lifecycle semantics                                                         |
| [ReliefWeb](https://apidoc.reliefweb.int/)                                                                                | Source-linked humanitarian reports; current access requires pre-approved appname                                                 |
| [Copernicus EMS](https://mapping.emergency.copernicus.eu/about/how-to-harvest-cems-mapping-data/emergency-response-data/) | Selected-event mapping products; distinguish activation AOIs from assessed hazard and damage geometries                          |

## Architectural critique and proposed direction

The strongest part of the proposal is explicit provenance, freshness, geographic uncertainty, and separation from organizational response.
The largest scope risk is treating a live explorer as a small bridge into response workflows that are currently demonstrations.

The regional audience and live payload checks led to accepting USGS plus GDACS for the first milestone.
The final proposed architecture is recorded in [the implementation plan](live-disaster-map-plan.md).
It uses a new explorer route, server-side adapters and validation, a bounded normalized response, and a narrow Mapbox client boundary.
Source success and failure must be independent so one provider cannot blank the whole explorer.
Preserve event occurrence, latest observation, provider update when available, and successful retrieval as separate nullable timestamps.
Fetching old observations successfully must not reset their observation freshness.
Provider lifecycle and review status need distinct meanings; an earthquake's reviewed status is not an ongoing-danger status.

Normalization should retain provider identity, external ID, record kind, hazard category, original sources, native measurements and units, geometry role, temporal precision, and provider metadata.
Do not force all source measurements into one severity ranking.
Do not link records solely using distance and time.
Clustering counts visible records, not guaranteed unique disasters.

PostGIS, historical archives, automatic cross-provider merging, and detailed overlay products are premature without corresponding accepted queries.
A bounded point feed can be filtered and clustered locally without a network request on every pan.
If durable last-known snapshots, retention, or unattended ingestion are required, evaluate small PostgreSQL snapshot/source-state tables before a full spatial event store.

The [Mapbox React guide](https://docs.mapbox.com/mapbox-gl-js/guides/get-started/use-with-npm/) supports direct integration.
Propose direct Mapbox GL JS behind a small adapter, GeoJSON layers and built-in point clustering, one map instance with data updates, and teardown on unmount.
Compare react-map-gl only if controlled camera and declarative layer composition justify the additional wrapper.
Map initialization is a [billable map load](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/), reinforcing stable lifecycle management.
Use a dedicated URL-restricted [public token](https://docs.mapbox.com/help/dive-deeper/access-tokens/) in the browser; secret tokens and database credentials stay server-side.
Public hazard endpoints must never join organizational records into their responses.

The verified Hobby plan has two different scheduling options in current documentation.
[Legacy Cron Jobs](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing) permit daily execution on Hobby.
The newer [Schedules beta](https://vercel.com/docs/schedules/limits) permits 15-minute intervals with a 15-minute jitter window and a 5,000-run billing-period limit.
This is not a five-minute freshness guarantee.
Evaluate demand-triggered cached refresh first unless unattended collection is required; any background design needs retries, idempotence, bounded concurrency, and durable retrieval state appropriate to its guarantee.

Promote clustering, a compact accessible list/map alternative, and usable mobile details into the initial scope.
Propose a list that becomes a detail panel on desktop and one bottom sheet on mobile, with hazard-type encoding and native measurement badges.
Avoid a separate concurrent popup, list, and drawer.
Keep source freshness visible, label empty geographic coverage honestly, and preserve the camera and selected event across refreshes.
Map or WebGL failure should leave the list usable.
The explorer must clearly distinguish genuine external data from surrounding sample organizational records.

## Interview decision tree

1. Regional commander audience, regional hazard triage, Southeast Asia opening view, USGS/GDACS source selection, and representative points are settled.
   Source-specific temporal selection, coverage labeling, and detail fields are proposed explicitly in the final plan.
2. Read-only operational scope is settled.
   Explorer navigation and truthful labeling within the demo application are proposed in the final plan.
   Authenticated incident creation and linking are outside the first milestone.
3. Two-provider integration envelope on existing services is settled.
   Deadline and implementation-hour budget remain unspecified; acceptance gates and fallback cuts are explicit in the final plan.
   New paid services have not been authorized.
4. Refresh while viewed, five-minute attempts, and a 15-minute retrieval-delay indicator are settled.
   Bounded dataset windows, cache implementation, source-health presentation, and partial failure are explicit proposals in the final plan.
   Unattended collection, durable fallback, and historical archives are not required promises.

Interview the unlocked branches before presenting the architecture and implementation milestones.
Create ADRs only for accepted decisions that satisfy the domain-modeling skill's trade-off criteria.
The current proposals do not authorize application implementation, cloud changes, deployment, commits, or pushes.

### Second interview frontier - accepted recommendations

- Q5: define the concrete monitoring outcome: regional hazard triage or current Malaysian district-warning coverage.
  Recommend regional hazard triage with transparent coverage limits; this answer determines the source-selection branch.
- Q6: choose the opening viewport and behavior when the current region contains no matching records.
  Recommend a Southeast Asia overview with explicit Malaysia, Southeast Asia, and World presets, preserving honest empty states.
- Q7: choose the retrieval cadence and failure presentation while the explorer is visible.
  Propose five-minute refresh attempts, pause while hidden, refresh on return, a retrieval-delay indication after 15 minutes without success, and separately labeled observation ages.
  In-memory last-success data may survive a temporary request failure, but reload or cache loss has no durable fallback guarantee.
- Q8: establish the actual submission deadline and implementation-hour budget.
  The two-provider answer settled scope but did not answer this scheduling constraint.

The user agreed to the recommendations for Q5, Q6, and Q7 and to reserving verification time in Q8.
No actual deadline or implementation-hour budget has been supplied.

### Third interview frontier - accepted recommendations

- Q9: choose USGS plus GDACS for earthquakes, floods, and cyclones, or USGS plus EONET for a wider curated natural-event selection.
  Recommend USGS plus GDACS for the accepted regional triage outcome, using separately verified MAP endpoints and one record per source event.
- Q10: choose representative point markers first or add selected footprint/track products.
  Recommend point markers with explicit geographic meaning; defer polygon and track products until their semantics can be explained and verified.
- Q11: choose the interaction package: synchronized compact list, hazard-type filtering, region presets, and responsive selected-event details, or a larger search and filter toolbox.
  Recommend the compact interaction package, using a desktop list/detail panel and one mobile bottom sheet, with an external source link as the action.

The user agreed to Q9, Q10, and Q11.
The remaining technical defaults, source-specific temporal contract, testing gates, and implementation milestones are now available for final review in [the implementation plan](live-disaster-map-plan.md).
No implementation is authorized until the user explicitly approves that plan.
