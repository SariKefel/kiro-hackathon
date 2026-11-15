# Public hazard provider fixtures

These are bounded test fixtures captured from the public GDACS MAP listings on 15 November 2026.
They are never runtime fallbacks or evidence of current disaster activity.

- Floods: `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=FL`, nine features representing three events.
- Tropical cyclones: `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/MAP?eventtype=TC`, 103 features representing two eligible event centroids.

The fixtures retain provider identifiers, report links, native impact and measurement fields, dates, representation classes, and Point coordinates.
Unneeded properties and coordinate arrays for unsupported line and polygon products have been removed to bound test data.
Their geometry types remain intact so misleading class names cannot turn polygons into marker points.
Observed fixture counts are examples, not future provider guarantees.
