# Meijersweekendje - AI Agent Instructions

## Project Architecture

**PWA Datumprikker** - Real-time family availability scheduler with Firebase backend. Two-app architecture: public datumprikker (`index.html`) and password-protected admin panel (`admin.html`).

### Core Components

1. **Public App** (`index.html` + `app.js` + `styles.css`)
   - Access code login screen (optional, configured by admin)
   - Family selection → Weekend/date selection with real-time sync
   - Shows aggregated availability across families (color-coded 1-4 families)
   
2. **Admin Panel** (`admin.html` + `admin.js` + `admin.css`)
   - Password: `5790` (hardcoded in `admin.js`)
   - Configures entire app via Firebase `/config` node
   - Interactive calendar picker for manual date selection

3. **Service Worker** (`service-worker.js`)
   - Cache version must be bumped on every deployment (currently `v3`)
   - Skips Firebase/CDN URLs from caching

## Critical Data Structures

### Firebase Schema
```javascript
// /config - Single document, controls entire app
{
  app_name: "Meijersweekendje",
  access_code: "WEEKEND2025",           // Optional family login code
  families: ["Hoorn", "Limmen", ...],
  date_type: "weekends|midweek|week|single",
  date_range_start: "2025-11-16",
  date_range_end: "2026-12-31",
  selected_manual_dates: ["2025-12-25", ...], // Calendar-picked dates
  week_start_day: 1                     // 0=Sunday, 1=Monday
}

// /availability - User selections
{
  "-NXxxx...": {
    weekend_id: "2025-11-22",          // YYYY-MM-DD of start date
    family: "Hoorn",
    created_at: "2025-11-16T14:30:00.000Z"
  }
}
```

### Backwards Compatibility Pattern
**CRITICAL**: Old data uses `weekend_id`, but normalization code supports both `weekend_id` and `id`:
```javascript
// Always check both when reading
const recordId = record.weekend_id || record.id;
// Always write with weekend_id for consistency
await push(ref, { weekend_id: dateId, family, created_at });
```

## Date Generation Logic (Key Complexity)

`generateWeekends()` in `app.js` combines two sources:
1. **Manual dates** from `config.selected_manual_dates` (calendar picker)
2. **Range dates** from period (start/end date)

```javascript
const manualDates = new Set(); // Track to prevent duplicates
// 1. Add manual dates first
config.selected_manual_dates.forEach(dateStr => {
  manualDates.add(formatDateId(date));
  dates.push({ id, friday, sunday, label, manual: true });
});
// 2. Generate range dates, skip if already in manualDates
while (currentDate <= endDate) {
  if (!manualDates.has(dateId)) { /* add */ }
}
```

Date types transform the same dates:
- `weekends`: Friday → Sunday (3 days)
- `midweek`: Monday → Friday (5 days)
- `week`: Configurable start day → +6 days
- `single`: Individual days

## Key Conventions

### Styling Approach
- **No inline styles** - Move to CSS classes (linter enforces this)
- **Vendor prefixes**: `-webkit-backdrop-filter` BEFORE `backdrop-filter`
- **Gradient pattern**: `linear-gradient(135deg, lighter 0%, darker 100%)`
- **Color scheme**: Primary `#4a9d8f` (teal), states use green/blue/orange/red

### JavaScript Patterns
- ES6 modules with Firebase CDN imports (`type="module"`)
- Optional chaining for config: `config?.date_type || 'weekends'`
- Real-time listener pattern: `onValue()` updates global `availabilities` array
- LocalStorage for access code: `datumprikker_access` key

### Date Formatting Consistency
```javascript
function formatDateId(date) {
  // Always YYYY-MM-DD, no time component
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## Development Workflow

```bash
# Start dev server
npm start                    # Runs http-server on port 8080
# OR
python -m http.server 8000  # Alternative

# Generate PWA icons (requires sharp)
npm run generate-icons

# Deploy checklist:
# 1. Bump service-worker.js CACHE_NAME (e.g., 'datumprikker-v4')
# 2. Test both index.html and admin.html
# 3. Verify real-time sync with multiple browser tabs
```

## Admin Calendar Picker Architecture

Interactive calendar in admin panel allows clicking dates to select/deselect:
- State: `selectedManualDates` array of "YYYY-MM-DD" strings
- Highlights: Weekend starts (Friday) or week starts (Monday) based on `dateType`
- Chips: Selected dates shown as removable chips below calendar
- Visibility: Hidden when `date_type === 'single'` (uses textarea instead)

Calendar renders month-by-month with:
```javascript
renderCalendar() {
  // 42 cells (6 weeks), fills with prev/next month days
  // Adds classes: .today, .selected, .weekend-start
  // Click handler: toggleDateSelection(dateStr)
}
```

## Firebase Security Rules
Located at: `https://console.firebase.google.com/project/meijersweekendje/database`
```json
{
  "rules": {
    "config": { ".read": true, ".write": true },
    "availability": { 
      ".read": true, 
      ".write": true,
      "$record": { ".validate": "newData.hasChildren(['weekend_id', 'family'])" }
    }
  }
}
```

## Common Pitfalls

1. **Service worker cache**: Always bump version after code changes
2. **Date timezone issues**: Use `new Date(dateStr + 'T12:00:00')` to avoid UTC shifts
3. **Real-time sync**: Changes in one tab won't reflect until `onValue()` fires
4. **Admin password**: Currently hardcoded, not in Firebase config
5. **Access code**: Stored in localStorage, cleared on logout/code change

## File Organization

```
├── index.html, app.js, styles.css          # Public app
├── admin.html, admin.js, admin.css         # Admin panel
├── service-worker.js                       # PWA caching (bump version!)
├── manifest.json                           # PWA metadata (Dutch language)
├── generate-icons.js                       # Creates PWA icons from SVG
└── FIREBASE_INFO.md                        # Setup instructions
```

All UI text is **Dutch** - maintain this in any new features.
