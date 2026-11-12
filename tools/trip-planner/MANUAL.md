# ATLAS user manual · v1

ATLAS is intended to be a single cockpit for researching, organizing, budgeting and sharing a trip. The default five-day Kyoto itinerary is **sample data**. All costs and durations shown in that sample are editable planning assumptions, not verified vendor prices.

### 1. Set up a trip
Set the trip name and search for a destination. A destination search uses a third-party geocoding service and returns possible locations; select one. Choose dates up to 30 days, number of travelers, currency label and a total target budget. Switching destination **does not erase existing itinerary stops** (this is intentional, to avoid accidental data loss). Remove or edit old stops, or choose Reset demo.

### 2. Find attractions, food and lodging
Choose a category on the left and press **Find**. Results come from OpenStreetMap's public Overpass data, rather than a paid booking provider. Press **+** on a place to add it to the currently selected day. Place names, coordinates and outbound official links are based on community-maintained tags; verify current schedules, entry prices, accessibility and closures yourself.

### 3. Edit a day
Select a date in the right-hand itinerary column. Expand it to see stops. Use **✎** to edit a start time, duration, custom budget expense, title and notes. Use up/down arrows or drag-and-drop to change order; **×** removes a stop. Use the round **+** button to create a custom stop, with optional place lookup and exact coordinates.

### 4. Optimize
Choose Easygoing, Balanced or All in, then use **Optimize my itinerary**. This runs an **explainable local heuristic**, balancing the number of activities per day and reordering each day by rough geographic closeness. This is not real traffic or public transportation routing. Opening hours, reservations, transfers and fixed-time events may make the optimized order impractical; treat it as a starting point.

### 5. Inspect the map
The **2D map** supports zooming, pitching, multiple basemap styles, and route sketches connecting stops on the selected day. The **3D globe** is made in Three.js from procedural meshes, lighting, cloud layers, atmosphere and vector land polygons; drag to rotate it, scroll to zoom and hover over a pin to identify a stop. Neither view asserts real-world walking/driving times; use **Open day route in Google Maps** to research those.

### 6. Check weather and destination guidance
The dashboard fetches current and near-term weather via Open-Meteo. For travel months in the future, the card is intentionally labeled **CURRENT, NOT TRIP DATES**. The destination brief is retrieved from the Wikivoyage API and links back to the guide for details; guide quality and recency vary.

### 7. Manage expenses
Enter a target total budget, then enter an estimated cost for each stop. ATLAS sums planned expenses and shows the remainder. It does **not** retrieve final tax-inclusive prices from booking systems. Selecting a different currency **relabels figures; it does not exchange-convert them**. Budget is for rough planning until actual quotes and reservations are entered.

### 8. Do research safely
**Browse sources** opens reputable official advice, open travel datasets, general guides, booking and transport search websites. The app does not harvest booking inventory or imply that any external rate is bookable. Look for original provider pages, cancellation rules, exact room/flight terms, entry formalities and accessibility information before paying.

### 9. More travel tools
Use **Budget lab** to add major expenses outside the day schedule (airfare, accommodation, trains, insurance) and see per-day and per-person averages. Use **Packing list** to track your equipment and **Travel readiness** for documents, transfers, safety and reservations; both checklists are editable. **Booking desk** opens external search providers for research without pretending they have confirmed rates. All tool data is saved in your JSON backup.

### 10. Optional AI reviews
**Ask AI to review this trip** uses the optional Netlify API endpoint, if its `OPENAI_API_KEY` has been configured by the site owner. It receives the destination, trip dates, interests, budgets and stop details, returning a readable assessment. It cannot verify live facts or change bookings. If no key is configured, the app explains how to enable the service.

### 11. Export, import and privacy
**Export** supports full JSON backup, tabular CSV, ICS calendar and a print view. **Import** restores a previously exported JSON plan. Plans are automatically saved to local storage on this device. Clearing browser data will remove local plans; use JSON backups for safekeeping. There is no account registration or cross-device syncing in this version. Exported ICS uses floating local times; check the destination timezone.

### 12. Website ownership and scaling
The source files belong in your website's public folder and can be extended with a database, cloud sync, per-account personalization, a licensed POI database, provider APIs, multi-user collaboration, transit routing and PDF trip dossiers. High-traffic production requires review of all external API licenses and limitations and a secure backend.
