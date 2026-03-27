# Design System Strategy: Kinetic Precision

## 1. Overview & Creative North Star
This design system is anchored by the Creative North Star: **"The Kinetic Monolith."** 

Unlike standard athletic sites that rely on cluttered photography and generic "go-faster" stripes, this system treats the interface as a high-performance instrument. It breaks the "template" look by utilizing extreme typographic scaling and intentional asymmetry. We move away from the traditional centered grid, opting instead for a "staggered-start" layout where elements feel like they are in mid-motion. High-contrast "Electric Lime" accents cut through deep charcoal layers, mimicking the visibility gear of a night runner. The aesthetic is brutalist yet refined—characterized by razor-sharp corners (0px radius) and a refusal to use decorative lines.

## 2. Colors & Surface Architecture
The palette is built on high-velocity contrast. We are not just using "dark mode"; we are building a "Deep Space" environment where the primary colors function as light sources.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** To define a new section or a card, you must use a background shift. 
*   **Example:** A `surface-container-low` (#131313) feature block sitting on a `surface` (#0e0e0e) background. 
*   Visual separation is achieved through tonal weight, not structural outlines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical plates.
*   **Base:** `surface-container-lowest` (#000000) for deep backgrounds.
*   **Mid-Ground:** `surface-container` (#1a1a1a) for standard content blocks.
*   **High-Ground:** `surface-bright` (#2c2c2c) for interactive elements that need to "pop" toward the user.
*   **The "Glass & Gradient" Rule:** For hero sections or floating CTA containers, use a semi-transparent `surface-variant` (#262626 at 80% opacity) with a `backdrop-filter: blur(20px)`. This creates a high-end "frosted obsidian" look.

### Signature Textures
Apply a subtle linear gradient to `primary` (#f3ffca) CTAs, transitioning into `primary-container` (#cafd00) at a 135-degree angle. This prevents the lime from looking "flat" and gives it the metallic sheen of elite sports equipment.

## 3. Typography: The Athletic Editorial
We utilize **Lexend** and **Space Grotesk** to provide a technical, high-performance edge that feels more "bespoke" than standard Montserrat, while maintaining that requested athletic weight.

*   **Display-LG (Lexend, 3.5rem):** Used for "Power Words." Use tight letter-spacing (-0.04em) and all-caps for a monolithic impact.
*   **Headline-MD (Lexend, 1.75rem):** Primary section headers. Always paired with a `primary` color accent.
*   **Label-MD (Space Grotesk, 0.75rem):** Used for technical data, split times, or "Kicker" text above headlines. This font’s monospaced feel suggests precision and timing.
*   **Body-LG (Lexend, 1rem):** High readability for coaching philosophy and program descriptions. Set at a generous line-height (1.6) to provide breathing room against the dark background.

## 4. Elevation & Depth: Tonal Layering
In this system, "Elevation" does not mean "Shadow." We use light, not shadow, to indicate height.

*   **The Layering Principle:** To lift a card, move it from `surface-container-low` to `surface-container-highest`. The user’s eye perceives the lighter grey as being physically closer to the light source.
*   **Ambient Glow:** When a "floating" effect is mandatory (e.g., a sticky navigation bar), use a shadow color based on `primary` (#f3ffca) at 4% opacity with a 40px blur. This creates a "neon underglow" rather than a muddy drop shadow.
*   **The "Ghost Border" Fallback:** If an element needs a border for accessibility (like an input field), use `outline-variant` (#484847) at **15% opacity**. It should be felt, not seen.
*   **Sharpness is Performance:** All `roundedness` tokens are set to **0px**. Any rounding is a deviation from the brand's "High-Performance" precision.

## 5. Components

### Buttons: The "Engine"
*   **Primary:** Solid `primary` (#f3ffca) background, `on-primary` (#516700) text. 0px corners. On hover, transform-scale(1.02) and shift to `primary-fixed`.
*   **Secondary:** `outline` (#767575) at 20% opacity with a 2px stroke (the only exception to the no-line rule for high-contrast interactivity).
*   **Tertiary:** All-caps `label-md` text with a `primary` underline that expands on hover.

### Cards & Progress Trackers
*   **Containers:** Use `surface-container-high` (#20201f). No borders. Use `spacing-8` (2rem) for internal padding.
*   **Data Points:** Use `secondary` (#ece856) for metric numbers (e.g., "5:00 min/km") to differentiate performance data from standard UI text.

### Input Fields
*   **Base:** `surface-container-lowest` (#000000).
*   **Active State:** The bottom edge glows with a 2px `primary` (#f3ffca) line. No full-box border.

### New Component: "The Split-Timer List"
For workout schedules, do not use dividers. Use a staggered background:
*   Row 1: `surface-container-low`
*   Row 2: `surface-container`
*   This "zebra-striping" without lines keeps the UI clean and emphasizes the athletic "lane" metaphor.

## 6. Do’s and Don’ts

*   **DO:** Use extreme white space (`spacing-20` and `spacing-24`) between sections to create an editorial, premium feel.
*   **DO:** Overlap typography. Let a `display-lg` headline slightly bleed into the section below it or over a high-performance action shot.
*   **DON’T:** Use any border-radius. Even a 2px radius breaks the "Kinetic Monolith" aesthetic.
*   **DON’T:** Use standard grey for text on dark backgrounds. Use `on-surface-variant` (#adaaaa) for secondary text to maintain a sophisticated, low-fatigue contrast.
*   **DON’T:** Use centered layouts for everything. Use the "Staggered Start"—align the headline to the left (column 1) and the body copy to the right (column 6) of a 12-column grid.