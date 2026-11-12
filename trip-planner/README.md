# ATLAS — Trip Intelligence Studio

**Made for arielbodik.com.** A deployable, browser-based travel planning application with a live geographic basemap, code-generated 3D globe, local itinerary and budget editing, POI discovery, external research/booking links, weather, exports, and optional server-side AI review.

> Status: working **starter application / vertical slice**, not a travel agency, production search aggregator, or live booking engine. It does **not** pretend to have indexed thousands of independently verified sites. The optional index builder scales to thousands of Wikivoyage *guide records* (one publisher). High-volume partner inventory, licensed content, and commercial bookings require API agreements and backend infrastructure.

## Quick start — preview locally

In the `atlas-trip-planner` folder:

```bash
python3 -m http.server 5500
```

Open <http://localhost:5500>. Python is needed only to serve the files locally; the UI is standard HTML, CSS and JavaScript. Avoid opening `index.html` from `file://`, since module loading and geographic data loading need HTTP.

**Important:** The map, Three.js, destination lookup, weather and travel data use external network connections. If you are offline, you can still edit/export trips; the map will display a fallback.

## Deploy to arielbodik.com

### Option A — Your existing Netlify website

1. Copy the `atlas-trip-planner/` directory into the **published site folder**, so it becomes `/trip-planner/`.
2. Copy `netlify/functions/ai-plan.mjs` from this project into the **existing site's root** `netlify/functions/ai-plan.mjs`.
3. Make sure the parent site's `netlify.toml` points its functions path to `netlify/functions` and deploy normally.
4. Visit `https://arielbodik.com/trip-planner/` (assuming arielbodik.com already points to that Netlify site).
5. Add a link to `/trip-planner/` in your site's navigation, or embed `<iframe src="/trip-planner/" title="ATLAS trip planner" style="width:100%;height:850px;border:0"></iframe>` where appropriate. Full-page use is recommended for the three-panel layout.

**The files are not deployed by ChatGPT.** The destination path assumes a static/Netlify site. If your site uses WordPress, another SPA router, or a different provider, copy the static files to its public path and adapt the optional AI backend.

### Option B — Standalone Netlify project

1. Deploy this folder as a new site. `netlify.toml` publishes the project root and mounts its serverless function.
2. Assign a subdomain such as `travel.arielbodik.com` in Netlify and configure its DNS.
3. To enable the optional AI review, configure `OPENAI_API_KEY` as a **server-side Netlify environment variable**; optionally set `OPENAI_MODEL` (default `gpt-6-astra`). Never put keys in static code.

## Included capabilities

| Feature | Works without API key? | Notes |
|---|---|---|
| 2D vector map | Yes, internet required | MapLibre + OpenFreeMap; rotate, pitch, zoom, change basemap |
| Procedural 3D Earth | Yes, internet required for Three.js module | Scene, globe mesh, lighting, clouds, atmosphere, stars, pins, arcs from code; bundled land polygons |
| Drag-and-drop day planner | Yes | Dates, times, expenses, durations, notes, custom coordinate stops |
| Interest/pace customization | Yes | Relaxed/balanced/packed presets, multiple interests |
| Place search | Yes, on-demand | Photon, public fair-use demo geocoder |
| Local POI discovery | Yes, on-demand | OpenStreetMap Overpass, community-maintained records |
| Weather | Yes, internet required | Open-Meteo current and near-term forecast; does not invent far-future forecasts |
| Destination briefing | Yes, internet required | Wikivoyage plain-text intro with link/attribution |
| Budget lab | Yes | Separate flight/hotel/transport/insurance expense tracking, per-day and per-person averages; no automatic FX conversion or verified booking rates |
| Packing and readiness checklists | Yes | Fully editable, checkable, auto-saved, included in JSON backup |
| Heuristic itinerary optimizer | Yes | Balances day stops and uses geographic proximity; **not transit time** |
| Google Maps directions | Yes, external browser | Actual navigation left to Google Maps; app routes are straight-line guides |
| Trusted research/source desk | Yes | 27 providers/datasets, direct booking research links; no inventory price claims |
| Calendar/CSV/JSON exports | Yes | Full backup, tabular itinerary, floating local calendar events |
| AI review | **Needs server-side key** | Optional Netlify function; read-only JSON review, no booking actions |
| Booking inside the app | **No** | Requires an approved partner integration and commercial/API credentials |

## Sources, data rights and API constraints

- **OpenFreeMap:** https://openfreemap.org/ — free public vector tiles and OSM attribution; no personalized SLA. Review terms as site traffic grows.
- **OpenStreetMap:** https://www.openstreetmap.org/copyright — ODbL attribution/share-alike obligations; records may be incomplete or outdated.
- **Overpass:** https://wiki.openstreetmap.org/wiki/Overpass_API — public shared instances are not a production SLA. ATLAS runs requests only on user action, requests a limited area and at most 180 raw records, limits rendered results, and caches in the session. For a popular site, use your own OSM extract/commercial POI provider and a caching backend.
- **Photon:** https://github.com/komoot/photon — public demo service is fair-use only, subject to throttling; use a paid/self-hosted geocoder at scale. ATLAS searches only on explicit submit, not every keystroke.
- **Wikivoyage:** https://en.wikivoyage.org/ — guides are CC BY-SA; maintain attribution and links. Content quality varies.
- **Open-Meteo:** https://open-meteo.com/en/terms — free hosted API is for non-commercial use, and data is attributed to Open-Meteo. Commercial usage needs a subscription/license.
- **Natural Earth** (land polygons shipped in `assets/land.geojson`): https://www.naturalearthdata.com/about/terms-of-use/ — public-domain geographic outlines, simplified for use in code-generated globe.
- **Google Maps links:** https://developers.google.com/maps/documentation/urls/get-started — links open external Google Maps; no API credentials required for URL actions.
- **Booking.com Demand API:** https://developers.booking.com/demand/ — requires Managed Affiliate Partner status, credentials and approval. The default app **links** to the Booking.com search page; it cannot read live offers, availability, or confirm bookings.
- **OpenAI Responses API:** https://developers.openai.com/api/docs/quickstart — backend reviews the user's existing trip and warns about unverifiable claims. A key and billing are required; endpoints must be rate-limited for public deployment.

### Building a much larger research index

Run:

```bash
node scripts/build-research-index.mjs --max=2500
```

This **optional** script uses paginated MediaWiki listing with a one-second delay and generates `data/wikivoyage-index.json` containing **article titles, source URLs, provenance and licenses**, not scraped copyrighted commercial content. A record is a **page from one source**, not a unique publisher. The file is not included populated by default or treated as real-time facts. For thousands of independent publishers and booking listings, create a licensable provider ingestion system with a database, deduplication, timestamps, official-source links, human verification, robots/ToS compliance, and per-source refresh schedules.

Recommended next production layer:

```
Approved travel APIs / government feeds / licensed guides
   -> scheduled connectors with source licenses and timestamps
   -> ingestion queue + canonical place IDs + geospatial database
   -> deduplication, provenance, and confidence fields
   -> indexed search service + caching + rate limiting
   -> grounded AI planner using returned source identifiers
   -> booking partner search / redirect / checkout (where approved)
```

Suggested technology: Postgres/PostGIS, a managed queue, Redis-compatible caching, background workers, tenant/user authentication, analytics/error monitoring, and API quotas. **Do not scrape commercial booking sites or copy their reviews/photos without authorization.**

## Customize the site

- **Theme & typography:** `styles.css` top-level variables `--ink`, `--panel`, `--orange`, `--teal`.
- **Demo:** `demo()` and `baselineStops` in `app.js`. Sample fees are editable planning numbers, **not current admission prices**.
- **Available map styles:** `MAP_STYLES` in `app.js`. Add MapLibre-compatible styles as needed.
- **POI categories:** `PLACE_CATEGORIES` in `app.js`. Keep Overpass query areas selective and respect service policies.
- **Source desk:** `providers` in `app.js`. Add verified provider sites and label each as official, open data, editorial, community or commercial.
- **Optimization:** `optimizeTrip()` and `nearestNeighbor()`. For actual drive/transit time or multimodal optimization, use a licensed routing API, schedules and reservation constraints.
- **Globe:** `globe.js` (Three.js meshes, materials, geographic coordinates and routes); actual land vector data is local in `assets/land.geojson`.
- **AI prompts:** `netlify/functions/ai-plan.mjs`. Do not remove the explicit ban on fabricated live availability/pricing.

## Known limitations / engineering roadmap

1. **This is local-first, single-device storage.** For cross-device sync, add authenticated user accounts and a database; do not place sensitive trips in public URLs.
2. **No paid inventory API is configured.** Booking provider search pages are external links. Prices and availability must come from providers under approved partner terms.
3. **Map lines are straight geographic connections, not transit routes.** Actual routes open in Google Maps. Transport-aware optimization is a separate licensed routing integration.
4. **The 3D globe is a geographically grounded, textured Earth visualization**, not photogrammetric city buildings or a street-level 3D tour. It is built from code, not imported GLB meshes.
5. **External free APIs are best-effort** and have quotas, CORS/network requirements and no guaranteed uptime. The site preserves local planning when they fail.
6. **IATA/official entry rules must be checked for exact nationality and transit.** ATLAS does not make legal/health claims from AI alone.
7. **Timezones:** ICS files use floating local event times. Verify destination timezone and adjust in calendar software before relying on reminders.
8. **Budget currency selection changes only the displayed unit**, not the cost amounts. Add live FX conversion with explicit exchange-rate date before using currency swaps for financial decisions.
9. **Security:** Add auth, consent disclosures, server-side authorization, rate limiting and paid API quotas before inviting heavy public use. The basic function has a best-effort per-instance limiter only.

## Automated checks

`node --check app.js`, `node --check globe.js`, `node --check netlify/functions/ai-plan.mjs`.
Use browser automation for destination entry, adding/removing stops, export/import and mobile responsiveness; see `tests/test_smoke.py`.
