# Remote Business Partner — Public Website Design System
# Implementation-Ready Specification

## 1. Design System Overview

This design system governs every public page of the Remote Business Partner
lead-generation website. It produces a cohesive, professional marketing experience
across Home, About, Services, DocuShare, Offers, Applications, Resources, Contact,
and utility pages.

**What this is:** A marketing website design system.
**What this is not:** A SaaS dashboard, a member portal, an admin UI.

---

## 2. Design Principles

1. **Clarity over cleverness.** Every heading, every CTA, every section must
   communicate its purpose in under 3 seconds. No decorative ambiguity.

2. **Generous space signals quality.** Whitespace is not wasted space. Cramped
   layouts signal "cheap tool." Breathing room signals "trusted advisor."

3. **One action per context.** Every section has one primary thing the user
   should do next. Never compete two filled buttons in the same block.

4. **Marketing website, not software UI.** Large type, editorial rhythm,
   full-width sections, photography. No dense cards, sidebars, or metrics grids.

5. **Conversion-aware hierarchy.** The visual system guides the eye: headline →
   value statement → supporting content → call to action. Every page.

6. **Consistency is the brand.** Reuse the same card, the same button, the same
   spacing on every page. Distinctive pages come from content, not from
   inventing new components.

---

## 3. Color System

### Brand Palette
| Token             | Tailwind         | Hex       | Usage                                 |
|-------------------|------------------|-----------|---------------------------------------|
| background        | stone-50         | #FAFAF9   | Page canvas                           |
| surface           | white            | #FFFFFF   | Cards, nav, alternating sections      |
| surface-alt       | stone-100        | #F5F5F4   | Alternating section backgrounds       |
| primary           | emerald-800      | #065F46   | Primary CTAs, key brand moments       |
| primary-hover     | emerald-900      | #064E3B   | Primary button hover                  |
| secondary         | stone-900        | #1C1917   | Headings, secondary buttons, footer   |
| secondary-hover   | stone-800        | #292524   | Secondary button hover                |
| accent            | orange-700       | #C2410C   | Overlines, badges, micro-highlights   |
| text-heading      | stone-900        | #1C1917   | All headings                          |
| text-body         | stone-600        | #57534E   | Body copy                             |
| text-muted        | stone-500        | #78716C   | Captions, metadata                    |
| text-inverse      | white            | #FFFFFF   | Text on dark backgrounds              |
| border            | stone-200        | #E7E5E4   | Card borders, dividers                |
| focus-ring        | emerald-800      | #065F46   | Focus states                          |

### Color Rules
- Page background is always `stone-50` (warm off-white), never pure white.
- Sections alternate between `stone-50` and `white` for rhythm.
- Primary green is reserved for CTAs and key interactive moments. Never flood a section with it.
- Dark footer uses `stone-900` with `stone-400` body text and white headings.
- The accent orange appears only in overlines, category tags, and subtle highlights. Never as a background fill.
- No gradients on content sections. If a hero uses an image overlay, use `stone-900/60`.

---

## 4. Typography System

### Font Stack
| Role    | Font                  | Fallback              |
|---------|-----------------------|-----------------------|
| Heading | Outfit                | system-ui, sans-serif |
| Body    | Inter                 | system-ui, sans-serif |
| Mono    | JetBrains Mono        | monospace             |

**Load via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale
| Token      | Class                                                      | Usage                          |
|------------|------------------------------------------------------------|--------------------------------|
| h1         | text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium | Page hero headings             |
| h2         | text-3xl sm:text-4xl lg:text-5xl tracking-tight font-medium | Section headings               |
| h3         | text-2xl sm:text-3xl tracking-tight font-medium             | Sub-section headings           |
| h4         | text-xl sm:text-2xl font-medium                             | Card headings, feature titles  |
| body-lg    | text-lg leading-relaxed                                     | Hero subheadings, intros       |
| body       | text-base leading-relaxed                                   | Standard body copy             |
| small      | text-sm                                                     | Captions, metadata, dates      |
| overline   | text-xs font-bold tracking-[0.2em] uppercase                | Section labels, category tags  |

### Typography Rules
- Headings use `font-heading` (Outfit). Body uses `font-body` (Inter).
- Headings are always `text-stone-900`. Body is `text-stone-600`.
- Overlines use `text-orange-700` (accent color).
- Maximum comfortable reading width for body text: `max-w-2xl` (42rem).
- Paragraph spacing: `space-y-4` between paragraphs in content blocks.
- Never use bold for entire paragraphs. Bold is for emphasis within text only.

---

## 5. Spacing & Layout System

### Section Spacing
| Context         | Padding               |
|-----------------|-----------------------|
| Standard section| py-20 lg:py-32        |
| Compact section | py-12 lg:py-20        |
| Hero section    | py-24 lg:py-40        |
| CTA band        | py-16 lg:py-24        |

### Container
```
max-w-7xl mx-auto px-6 lg:px-8
```
All content is contained within `max-w-7xl` (80rem). No full-bleed content
except background colors and images.

### Grid System
| Layout        | Class                              |
|---------------|------------------------------------|
| 2-column      | grid md:grid-cols-2 gap-8 lg:gap-12|
| 3-column      | grid md:grid-cols-2 lg:grid-cols-3 gap-8 |
| 4-column      | grid md:grid-cols-2 lg:grid-cols-4 gap-8 |
| Content + sidebar | grid lg:grid-cols-[1fr_320px] gap-12 |

### Spacing Scale
Use Tailwind defaults. Key values: 4, 6, 8, 12, 16, 20, 24, 32.
Minimum gap between card grids: `gap-8`.
Minimum gap between section heading and content: `mt-12` or `mt-16`.

---

## 6. Component Specifications

### 6.1 Header
```
Position: sticky top-0 z-50
Background: bg-stone-50/80 backdrop-blur-xl
Border: border-b border-stone-200
Height: h-16 lg:h-20
```

**Desktop layout:**
```
[Logo]          [About] [Services] [DocuShare] [Offers] [Applications] [Resources]          [Contact Us](outline) [Book a Discovery Call](primary)
```

**Behavior:**
- Sticky on scroll. No height reduction — stays consistent.
- Active link: `text-stone-900 font-medium` (vs default `text-stone-600`).
- Nav links: `text-stone-600 hover:text-stone-900 transition-colors`.
- No dropdowns. Every nav item is a single destination.
- Logo links to `/`.

### 6.2 Mobile Navigation
```
Trigger: hamburger icon (Menu from lucide-react), visible below lg breakpoint
Drawer: full-height Sheet from left (use Radix/Shadcn Sheet)
```

**Drawer contents (top to bottom):**
- Logo + close button
- Nav links as large text items (text-lg, py-3 each)
- Divider
- [Book a Discovery Call] — full-width primary button

### 6.3 Footer
```
Background: bg-stone-900
Padding: py-20
Text: text-stone-400 (body), text-white (headings)
```

**4-column grid on desktop, stacked on mobile:**
- Column 1: Logo, brand tagline
- Column 2: Explore — About, Services, DocuShare, Offers, Applications
- Column 3: Resources — All Resources, Guides, Articles, Tools & Templates
- Column 4: Connect — Contact Us, Book a Discovery Call, email, LinkedIn icon

**Bottom bar:**
```
border-t border-stone-800 pt-8 mt-12
"© 2026 Remote Business Partner"    Privacy Policy · Terms of Service
```

### 6.4 Button System

| Variant   | Classes | Usage |
|-----------|---------|-------|
| Primary   | `bg-emerald-800 text-white rounded-lg px-6 py-3 font-medium hover:bg-emerald-900 hover:shadow-md hover:-translate-y-[1px] transition-all` | Main CTAs |
| Secondary | `bg-stone-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-stone-800 transition-all` | Supporting CTAs |
| Outline   | `border border-stone-300 text-stone-900 rounded-lg px-6 py-3 font-medium hover:border-stone-400 hover:bg-stone-50 transition-all` | Ghost/secondary actions |
| Ghost     | `text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-4 py-2 transition-colors` | Nav items, low-priority |
| Link      | `text-emerald-800 font-medium hover:text-emerald-900 inline-flex items-center gap-1` + arrow icon | "Learn more →" |
| External  | Same as Link but with `ArrowUpRight` icon | Links to separate apps |

**Button rules:**
- One primary button per visible section.
- Buttons always have `data-testid` attributes.
- Focus: `focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2`.
- Minimum touch target: 44×44px on mobile.

### 6.5 Card System

**Standard Card (Services, Features, Categories):**
```
bg-white p-8 rounded-xl border border-stone-200
hover:shadow-md hover:-translate-y-1 transition-all duration-300
```
Contents: Icon (top-left) → H4 heading → body text → Link button ("Learn more →")

**Article Card (Resources):**
```
Vertical layout. rounded-xl overflow-hidden border border-stone-200
hover:shadow-md transition-all
```
Contents: Image (16:9, rounded-t-xl) → Body container (p-6): overline category → H4 title → excerpt (2 lines) → date/read time

**Ecosystem Card (DocuShare, Offers, Applications on Home):**
Same as Standard Card but with a colored icon container background
(`bg-emerald-50` or `bg-orange-50`) and a stronger CTA with external arrow.

**Card rules:**
- All cards left-align text. Never center card content.
- Card grids are 3-column on desktop, 2-column on tablet, 1-column on mobile.
- Cards in the same grid must all be the same height (use `flex flex-col` and `flex-grow` on the body).

### 6.6 Icon Treatment
- Library: `lucide-react`
- Default size: `w-5 h-5` for inline, `w-6 h-6` for card icons
- Stroke width: 1.5 (the default)
- Color: `text-emerald-800` for brand icons, `text-stone-400` for decorative
- Icon containers (for cards): `w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center` with `text-emerald-800` icon inside

### 6.7 Form Styles
- Input: `w-full border border-stone-300 rounded-lg px-4 py-3 text-stone-900 bg-white focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 transition-colors`
- Label: `text-sm font-medium text-stone-900 mb-1.5 block`
- Textarea: Same as input but `min-h-[120px]`
- Select: Use Shadcn Select with matching border/focus styles
- Error: `text-sm text-red-600 mt-1`
- Submit button: Primary button variant, full-width on mobile

### 6.8 Trust / Testimonial Block
**Testimonial:**
```
Large blockquote: text-2xl font-light italic text-stone-900 leading-relaxed
Author: text-base font-medium text-stone-900
Role: text-sm text-stone-500
```
No star ratings. No review-widget styling. Clean editorial quote presentation.

**Logo Cloud:**
```
Grayscale logos with opacity-50 hover:opacity-100 transition-opacity
Flex row with gap-12, centered, wrapped
```

### 6.9 Feature Grid Block
**Side-by-side feature layout (alternating image/text):**
```
grid lg:grid-cols-2 gap-12 items-center
```
- Odd rows: text left, image right
- Even rows: image left, text right (use `lg:order-first` on image)
- Image: rounded-xl, subtle shadow-sm
- Text side: overline → H3 → body → bullet points or value statements

### 6.10 CTA Conversion Band
Used at the bottom of every page except Contact.
```
Section: bg-stone-900 text-white py-16 lg:py-24
Container: text-center max-w-2xl mx-auto
```
Contents:
- H2 heading (text-white, e.g., "Ready to strengthen your business?")
- Body text (text-stone-400, one sentence)
- Button cluster: Primary (Book a Discovery Call) + Outline (Contact Us, white border)

### 6.11 Article Page Content Styling (Resources)
```
Prose container: max-w-3xl mx-auto prose prose-stone prose-lg
```
- Headings: stone-900, font-heading
- Body: stone-600, line-height relaxed
- Links: emerald-800, underlined
- Blockquotes: left border emerald-800, italic
- Code blocks: bg-stone-100 rounded-lg p-4, font-mono
- Images: rounded-xl, full-width within prose container
- Lists: disc/numbered, proper indentation

**Article header:**
```
Breadcrumbs → Overline (category) → H1 (title) → Meta row (date · read time · author)
```

**Inline CTA block (mid-article or end-of-article):**
```
bg-stone-50 border border-stone-200 rounded-xl p-8
H4 heading + body + Primary CTA button
```

---

## 7. Section Pattern Library

### 7.1 Hero — Split Layout (Default for landing pages)
```
grid lg:grid-cols-2 gap-12 items-center py-24 lg:py-40
```
- Left: overline → H1 → body-lg paragraph → button cluster (primary + outline)
- Right: rounded-xl image or illustration

### 7.2 Hero — Center Aligned (Alternative)
```
text-center max-w-3xl mx-auto py-24 lg:py-40
```
- Overline → H1 → body-lg → button cluster → optional image below

### 7.3 Value Proposition Strip
```
grid md:grid-cols-2 lg:grid-cols-4 gap-8
```
Each item: icon container → H4 → short body text (2–3 lines max)

### 7.4 Card Grid Section
```
Overline → H2 → optional body → mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8
```
Uses Standard Card component.

### 7.5 Alternating Feature Rows
```
space-y-24
```
Each row is a side-by-side Feature Grid Block (see 6.9). Alternates direction.

### 7.6 Testimonial Section
```
bg-white py-20 lg:py-32
max-w-3xl mx-auto text-center
```
Single featured testimonial or 3-column grid of shorter quotes.

### 7.7 Logo Cloud Section
```
py-12 border-y border-stone-200
```
Centered flex row of grayscale logos.

### 7.8 Latest Resources Section (used on Home, Resources hub)
```
Overline → H2 → mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8
```
Uses Article Card component. Optionally includes "View all resources →" link.

### 7.9 Contact Split Section
```
grid lg:grid-cols-2 gap-12
```
- Left: enquiry form
- Right: discovery call booking embed + contact details

---

## 8. Responsive Behavior Rules

| Breakpoint | Behavior |
|------------|----------|
| < 640px (mobile) | Single column. Hamburger nav. Full-width buttons. Stacked cards. Hero text only (no hero image). |
| 640–1024px (tablet) | 2-column grids. Side drawer nav. Hero may show image below text. |
| > 1024px (desktop) | Full layout. Sticky header with all nav items. Side-by-side heroes. 3–4 column grids. |

**Specific responsive rules:**
- Hero images hide on mobile (`hidden lg:block`). Text content carries the message alone.
- Card grids: 1 col mobile → 2 col tablet → 3 col desktop.
- CTA buttons stack vertically on mobile (`flex-col`), horizontal on desktop (`flex-row`).
- Footer columns stack 1-column on mobile, 2×2 on tablet, 4 across on desktop.
- Article content: full-width on mobile, `max-w-3xl` centered on desktop.

---

## 9. Accessibility Rules

1. **Contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text). The stone-600 on stone-50 combination passes. White on emerald-800 passes.
2. **Focus states:** Every interactive element has `focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2`. Never remove focus outlines.
3. **Semantic HTML:** Proper heading hierarchy (one H1 per page, H2 for sections, H3 for sub-sections). Use `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>` landmarks.
4. **Alt text:** Every meaningful image has descriptive alt text. Decorative images use `alt=""`.
5. **Keyboard navigation:** All links, buttons, and form elements are keyboard accessible. Tab order follows visual order.
6. **Reduced motion:** Respect `prefers-reduced-motion`. Disable hover translations and scroll animations when active.
7. **Form labels:** Every input has a visible `<label>`. No placeholder-only labeling.
8. **Touch targets:** Minimum 44×44px for all interactive elements on mobile.
9. **Skip links:** Include a "Skip to main content" link as the first focusable element.

---

## 10. Consistency Rules

1. **Every page uses the same shell:** Header → Page content → CTA band → Footer. No exceptions.
2. **Section backgrounds alternate:** stone-50 ↔ white. The hero can use stone-900 with image overlay as a variation, but standard sections alternate warm/white.
3. **One card component, configured via props.** Do not build separate card components per page.
4. **One button component with variants.** Primary, secondary, outline, ghost, link.
5. **Overlines always precede H2 section headings.** Format: accent-colored, uppercase, tracked.
6. **CTA band is identical structure everywhere.** Only the heading/body text varies.
7. **Icons are always lucide-react, always 1.5 stroke weight, always in icon containers for cards.**
8. **No component uses dashboard patterns:** no sidebar layouts, no metric cards, no data tables, no toggle switches, no tabs-as-navigation, no status badges.
9. **Photography style is consistent:** professional, warm-toned, real people or architecture. No stock photo clichés (man pointing at whiteboard, woman smiling at laptop). No illustrations or abstract shapes.
10. **Every interactive element has a `data-testid` in kebab-case.**
