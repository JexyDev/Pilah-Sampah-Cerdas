---
name: Lestari Dashboard System
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a3f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#6d7a6e'
  outline-variant: '#bccabc'
  surface-tint: '#006d37'
  primary: '#006d37'
  on-primary: '#ffffff'
  primary-container: '#27ae60'
  on-primary-container: '#00391a'
  inverse-primary: '#61de8a'
  secondary: '#006397'
  on-secondary: '#ffffff'
  secondary-container: '#5cb8fd'
  on-secondary-container: '#00476e'
  tertiary: '#446274'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e9cb0'
  on-tertiary-container: '#143444'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7efba4'
  primary-fixed-dim: '#61de8a'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#92ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#c8e7fd'
  tertiary-fixed-dim: '#accbe0'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#2c4a5c'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  data-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
  sidebar-width: 260px
  stack-sm: 8px
  stack-md: 12px
---

## Brand & Style

The design system is engineered for "Pilah Sampah Cerdas," a waste management platform that bridges the gap between environmental responsibility and data-driven administrative efficiency. The brand personality is **trustworthy, efficient, and civic-minded**, aiming to provide government and facility administrators with a professional tool that feels modern yet accessible.

The design style follows a **Corporate / Modern** aesthetic with a focus on high information density and clarity. It utilizes a clean "SaaS-style" layout characterized by:
- **Functional Clarity:** Distinguishing between waste types (Organic vs. Non-Organic) through consistent semantic color-coding.
- **Data-Centricity:** Prioritizing numerical metrics and geographic data through structured cards and clear data visualizations.
- **Regional Localization:** Following Indonesian localization standards, specifically using dots (.) as thousand separators and commas (,) for decimals.

## Colors

The palette is strategically bifurcated to represent the core function of waste segregation:

- **Primary Colors:** 
  - **Organic Green (#27AE60):** Used for all organic waste metrics, positive status badges, and sustainability-related icons.
  - **Non-Organic Blue (#3498DB):** Used for inorganic waste metrics and secondary informative actions.
- **Structural Colors:**
  - **Deep Navy (#1B3A4B):** Reserved for the sidebar and high-level navigation to provide a grounded, authoritative frame.
  - **Highlight Teal (#3AAFA9):** Used exclusively as an accent for active states and indicators to guide focus.
- **Backgrounds & Neutrals:**
  - The application uses a light gray background (**#F0F2F5**) to allow white cards to pop, with **#FFFFFF** surfaces used for all content containers to maximize legibility.

## Typography

This design system uses **Plus Jakarta Sans** for its modern, approachable geometric forms which maintain high legibility in data-heavy environments.

- **Headlines:** Used for page titles and card headers to establish hierarchy.
- **Data Display:** Specialized bold weighting for primary metrics (e.g., total waste weight) to ensure they are the first thing an administrator sees.
- **Labels:** Used for status badges and table headers, often utilizing `semibold` or `medium` weights at smaller sizes to maintain structure.
- **Localization:** Ensure all numerical strings are formatted with Indonesian locales (e.g., `1.236 kg`, `124.560`).

## Layout & Spacing

The layout utilizes a **fluid grid** model optimized for wide-screen administration. 

- **Sidebar:** A fixed-width left navigation (260px) providing consistent access to management modules.
- **Grid System:** A 12-column layout for the main content area.
  - **Desktop:** Cards typically span 2, 3, 4, or 6 columns depending on data complexity.
  - **Gutters:** Standardized 16px spacing between all dashboard cards.
- **Density:** The system uses a medium-density spacing rhythm to allow for a large volume of data without visual clutter. All primary containers use 20px internal padding.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**:

- **Level 0 (Background):** The base layer is the #F0F2F5 background.
- **Level 1 (Cards/Surface):** White surfaces (#FFFFFF) use a subtle ambient shadow: `0px 2px 8px rgba(0, 0, 0, 0.06)`. This creates a soft lift that distinguishes actionable data areas from the background.
- **Level 2 (Dropdowns/Modals):** Floating elements use a more pronounced shadow: `0px 8px 24px rgba(0, 0, 0, 0.12)` to indicate temporary interaction layers.
- **Sidebar Depth:** The sidebar is visually "flat" against the left edge but uses color contrast (Navy vs Light Gray) to define its presence as the primary navigational anchor.

## Shapes

The design system employs a **Rounded** shape language to soften the industrial nature of waste management data.

- **Primary Cards:** 12px (rounded-lg) corner radius for all main dashboard containers.
- **Interactive Elements:** Buttons and input fields use a consistent 8px (standard) radius.
- **Status Badges:** Fully pill-shaped (rounded-full) to distinguish them from structural elements and buttons.
- **Images/Avatars:** Standardized as circles for user profiles and square with 8px radius for facility thumbnails.

## Components

### Buttons & Navigation
- **Sidebar Items:** Default state is transparent. Active state features a #E8F4F8 background with a 4px solid #3AAFA9 left border to clearly mark the current location.
- **Primary Buttons:** Solid fills using the primary brand colors with white text.

### Data Display
- **Metric Cards:** Feature a circular icon container on the left, followed by a label and a large `data-display` value. Percentage trends are placed at the bottom with a small upward/downward arrow.
- **Status Badges:** Low-saturation backgrounds with high-saturation text (e.g., Light Green bg with #27AE60 text for "Aktif").

### Tables & Lists
- **Data Tables:** Minimalist style with no vertical borders. Horizontal dividers are 1px #E0E0E0. Row hover states use #F8FAFB.
- **Input Fields:** 1px #D1D5DB border, changing to #3498DB on focus. Labels are always positioned above the input.

### Specialized Components
- **Waste Composition Ring:** A donut chart showing the split between Organic (#27AE60) and Non-Organic (#3498DB).
- **Map Markers:** Teardrop shapes using the semantic colors of the facility type they represent.