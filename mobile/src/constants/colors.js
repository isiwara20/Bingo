/**
 * BinGo – Color Palette
 *
 * Design system derived from high-fidelity wireframes.
 *
 * Theme:
 *   Primary    – dark forest green  (#1E3A1E, #2D5016)
 *   Accent     – amber/yellow       (#E8950A, #F5A623)
 *   Background – off-white/light green tint (#F4F6F0)
 *   Surface    – pure white         (#FFFFFF)
 *   Error/Warn – red                (#DC2626)
 *   Nav bar    – white bg, dark green active, centre FAB dark green
 */

const COLORS = {
  // ── Primary brand – dark forest green ──────────────────────────────────
  PRIMARY:        "#2D5016",   // dark green – headers, active nav, primary buttons
  PRIMARY_LIGHT:  "#4A7C28",   // medium green – step indicators, icons
  PRIMARY_DARK:   "#1A3010",   // deepest green – pressed states
  PRIMARY_TINT:   "#E8F0E0",   // very light green – card icon backgrounds, selected state bg

  // ── Accent – amber / yellow-orange ─────────────────────────────────────
  ACCENT:         "#E8950A",   // amber – CTA buttons ("Continue", "Submit")
  ACCENT_LIGHT:   "#F5C842",   // light yellow – highlights
  ACCENT_DARK:    "#B86E00",   // dark amber – pressed CTA

  // ── Backgrounds ────────────────────────────────────────────────────────
  BACKGROUND:     "#F4F6F0",   // app background – very light green tint
  SURFACE:        "#FFFFFF",   // card / input backgrounds
  CARD:           "#FFFFFF",

  // ── Text ───────────────────────────────────────────────────────────────
  TEXT_PRIMARY:   "#1A1A1A",   // near-black – headings, body
  TEXT_SECONDARY: "#6B7280",   // grey – subtitles, labels, inactive tabs
  TEXT_DISABLED:  "#B0B8B0",   // light grey – placeholder, char count
  TEXT_INVERSE:   "#FFFFFF",   // white – text on dark/green backgrounds
  TEXT_ACCENT:    "#E8950A",   // amber – highlighted text

  // ── Status colours ─────────────────────────────────────────────────────
  SUCCESS:        "#2D5016",   // use primary green for success
  WARNING:        "#E8950A",   // amber for warnings (matches accent)
  ERROR:          "#DC2626",   // red – errors, camera unavailable, denied
  INFO:           "#1D6FA4",   // blue – informational only

  // ── Report statuses ────────────────────────────────────────────────────
  STATUS_PENDING:      "#E8950A",   // amber
  STATUS_UNDER_REVIEW: "#1D6FA4",   // blue
  STATUS_CLEANED:      "#2D5016",   // dark green
  STATUS_REJECTED:     "#DC2626",   // red

  // ── Borders & dividers ─────────────────────────────────────────────────
  BORDER:         "#D8E0D0",   // light green-tinted border
  DIVIDER:        "#EEF2EA",   // very subtle divider

  // ── Bottom nav bar ─────────────────────────────────────────────────────
  NAV_BG:         "#FFFFFF",   // white nav bar background
  NAV_ACTIVE:     "#2D5016",   // dark green – active tab icon + label
  NAV_INACTIVE:   "#9CA3AF",   // grey – inactive tab icons
  NAV_FAB:        "#2D5016",   // dark green – centre floating action button
  NAV_FAB_ICON:   "#FFFFFF",   // white icon on FAB

  // ── Map markers ────────────────────────────────────────────────────────
  MARKER_REPORT:     "#DC2626",   // red pin – waste reports
  MARKER_RECYCLING:  "#2D5016",   // dark green – recycling centres
  MARKER_COLLECTION: "#1D6FA4",   // blue – collection points

  // ── Header bar ─────────────────────────────────────────────────────────
  HEADER_BG:      "#1A3010",   // very dark green – top app bars (from wireframe)
  HEADER_TEXT:    "#FFFFFF",   // white text on header

  // ── Step indicator ─────────────────────────────────────────────────────
  STEP_ACTIVE:    "#2D5016",   // filled green circle
  STEP_DONE:      "#4A7C28",   // slightly lighter green – completed
  STEP_INACTIVE:  "#D8E0D0",   // light grey-green – future steps
  STEP_LINE:      "#D8E0D0",   // connecting line

  // ── Misc ───────────────────────────────────────────────────────────────
  TRANSPARENT:    "transparent",
  OVERLAY:        "rgba(0, 0, 0, 0.45)",
  SHADOW:         "#000000",

  // ── Keep legacy aliases so existing screens don't break ────────────────
  SECONDARY:      "#E8950A",   // alias → ACCENT
  SECONDARY_LIGHT:"#F5C842",
  SECONDARY_DARK: "#B86E00",
};

export default COLORS;
