# Product Type Catalog

Maps ~80 product types to design parameters for Visionary Claude's style selection algorithm (context-inference.md, Step 1). Each entry provides domain categories, transplant categories, color/typography mood, motion tier, key effects, and anti-patterns.

**How to use this file:** The algorithm detects a product type from the user's prompt, then reads only the matching section. Do not load the full file into context.

**Fallback behavior:** If the product type is not listed here, pick the 2 closest entries and merge their candidate categories. If no entry is even close, fall back to the Step 1 table in context-inference.md.

---

## 1. Tech & SaaS

### SaaS B2B Dashboard
- **Pattern**: Feature-led hero with live dashboard preview, social proof bar, integration logos grid
- **Domain categories**: contemporary (bento-grid, glass-dashboard, data-visualization)
- **Transplant categories**: historical (bauhaus, swiss-rationalism, constructivism), hybrid (catalog-archive)
- **Color mood**: Professional muted — slate blue, neutral grey, single bright accent for CTAs
- **Typography mood**: Functional precision — geometric sans display, humanist sans body, tabular-nums for data
- **Motion tier**: Subtle (1)
- **Key effects**: Card entrance stagger on scroll, metric count-up animation, tab-switch crossfade
- **Anti-patterns**: Avoid sidebar+KPI+table cliche as hero; never open with a generic gradient mesh background; do not use stock dashboard screenshots

### Micro SaaS
- **Pattern**: Single-feature hero with inline demo, problem-solution narrative, pricing anchor
- **Domain categories**: contemporary (bento-grid, wireframe-aesthetic), emotional (playful-joyful)
- **Transplant categories**: historical (dieter-rams), typography (mono-aesthetic, big-bold-type)
- **Color mood**: Focused minimal — one bold primary on near-white, no gradient complexity
- **Typography mood**: Friendly technical — rounded geometric sans, generous weight for clarity
- **Motion tier**: Subtle (1)
- **Key effects**: Inline demo interaction preview, single-feature zoom reveal, testimonial fade cycle
- **Anti-patterns**: Avoid enterprise-scale feature grids; never show complex pricing tiers for a single-tool product; do not mimic large SaaS visual weight

### B2B Service Platform
- **Pattern**: Value proposition hero, workflow diagram, trust signals bar, case study cards
- **Domain categories**: industry (saas-b2b-dashboard), contemporary (bento-grid, data-visualization)
- **Transplant categories**: historical (swiss-rationalism, bauhaus), hybrid (newspaper-broadsheet, scientific-journal)
- **Color mood**: Corporate confident — deep navy or charcoal base, white space, restrained teal or green accent
- **Typography mood**: Authoritative clarity — medium-weight sans display, clean humanist body
- **Motion tier**: Subtle (1)
- **Key effects**: Workflow step reveal on scroll, integration logo carousel, metric counter animation
- **Anti-patterns**: Avoid jargon-heavy hero without visual explanation; never use playful illustration for enterprise buyers; do not default to blue-gradient-on-white

### Developer Tool / IDE
- **Pattern**: Code-first hero with syntax-highlighted example, CLI install one-liner, feature comparison grid
- **Domain categories**: industry (developer-tools), contemporary (terminal-cli)
- **Transplant categories**: historical (constructivism), typography (mono-aesthetic, kinetic-type)
- **Color mood**: Dark substrate — near-black background, syntax-highlight accents (violet, cyan, amber), high contrast text
- **Typography mood**: Monospace precision — monospace display and code, geometric sans for navigation and CTAs
- **Motion tier**: Subtle (1)
- **Key effects**: Code typing animation in hero, terminal command copy-click feedback, tab-switch for code examples
- **Anti-patterns**: Avoid slow decorative transitions; never exceed 300ms for any UI animation; do not use rounded playful shapes or illustration-heavy layouts

### AI / Chatbot Platform
- **Pattern**: Interactive demo hero with live chat preview, capability showcase grid, integration ecosystem
- **Domain categories**: futurist (neural-network-ai, generative-algorithmic), contemporary (glass-dashboard)
- **Transplant categories**: historical (swiss-rationalism), morphisms (aurora-mesh, holographic), typography (mono-aesthetic)
- **Color mood**: Intelligent gradient — deep purple to dark blue base, luminous accent nodes, controlled glow
- **Typography mood**: Future-functional — geometric sans with slight futurist lean, monospace for technical elements
- **Motion tier**: Expressive (2)
- **Key effects**: Node-edge network animation in background, chat message typing simulation, particle flow on scroll
- **Anti-patterns**: Avoid generic robot/brain imagery; never use rainbow gradients as substitute for design; do not animate every element simultaneously

### Cybersecurity Platform
- **Pattern**: Threat visualization hero, protection layer diagram, compliance badge grid, incident response timeline
- **Domain categories**: industry (developer-tools), futurist (sci-fi-hud, neon-dystopia, data-center)
- **Transplant categories**: contemporary (terminal-cli, dark-mode-first), historical (constructivism)
- **Color mood**: Sentinel dark — near-black base, electric green or amber alert accent, red for threat signals only
- **Typography mood**: Military precision — condensed sans display, monospace data elements, no decorative fonts
- **Motion tier**: Subtle (1)
- **Key effects**: Threat map pulse animation, shield-layer build reveal, real-time counter for blocked threats
- **Anti-patterns**: Avoid Matrix-style falling code cliche; never use playful colors or rounded corners; do not make threat data feel gamified

### API / Integration Platform
- **Pattern**: API endpoint showcase hero, interactive request/response demo, SDK language tabs, integration diagram
- **Domain categories**: industry (developer-tools), contemporary (terminal-cli, data-visualization)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), typography (mono-aesthetic)
- **Color mood**: Documentation clean — white or light grey base, syntax-colored accents, method-verb color coding (GET green, POST blue, DELETE red)
- **Typography mood**: Documentation grade — monospace for endpoints, clean sans for prose, clear hierarchy between code and content
- **Motion tier**: Subtle (1)
- **Key effects**: Request/response live demo, language tab switching, endpoint expand/collapse, copy-to-clipboard feedback
- **Anti-patterns**: Avoid hiding the API behind marketing language; never use heavy imagery over code examples; do not slow down navigation with decorative transitions

### No-Code / Low-Code Builder
- **Pattern**: Drag-and-drop demo hero, template gallery grid, before/after workflow comparison, use case cards
- **Domain categories**: contemporary (bento-grid, gamification), emotional (playful-joyful, dopamine-design)
- **Transplant categories**: historical (bauhaus), morphisms (claymorphism, flat)
- **Color mood**: Accessible bright — white base, vibrant primary (purple or blue), colorful node/block accents, friendly palette
- **Typography mood**: Approachable bold — rounded geometric sans, generous size for non-technical users
- **Motion tier**: Expressive (2)
- **Key effects**: Drag-and-drop simulation in hero, block snap-together animation, template preview hover reveal
- **Anti-patterns**: Avoid developer-centric terminology in visuals; never present as code-heavy; do not use dark mode as default for non-technical audience

### Project Management Tool
- **Pattern**: Board/timeline view hero, team collaboration preview, integration ecosystem, workflow automation showcase
- **Domain categories**: contemporary (bento-grid, data-visualization), industry (saas-b2b-dashboard)
- **Transplant categories**: historical (bauhaus, swiss-rationalism), hybrid (catalog-archive)
- **Color mood**: Organized calm — neutral grey base, color-coded status system (green done, amber in-progress, red blocked), muted primary accent
- **Typography mood**: Workspace functional — medium-weight sans, clear hierarchy for task names vs metadata, compact for density
- **Motion tier**: Subtle (1)
- **Key effects**: Kanban card drag preview, timeline zoom animation, status change micro-interaction, assignee avatar stack
- **Anti-patterns**: Avoid empty-state hero with no actual UI preview; never default to Asana/Monday.com blue-purple gradient; do not show overwhelming complexity in first view

### CRM / Sales Tool
- **Pattern**: Pipeline visualization hero, revenue dashboard preview, contact card interaction, integration badges
- **Domain categories**: contemporary (data-visualization, glass-dashboard), industry (saas-b2b-dashboard)
- **Transplant categories**: historical (swiss-rationalism), hybrid (newspaper-broadsheet), emotional (energetic-athletic)
- **Color mood**: Revenue confident — deep blue or dark base, green for positive metrics, warm orange for urgency, gold for wins
- **Typography mood**: Data-forward — geometric sans with tabular figures, bold metric display, compact body for density
- **Motion tier**: Subtle (1)
- **Key effects**: Pipeline stage drag animation, revenue chart count-up, deal card flip interaction, notification badge pulse
- **Anti-patterns**: Avoid showing empty pipelines; never use playful illustration for sales tools; do not obscure data density behind minimalist design

### Cloud Infrastructure / DevOps
- **Pattern**: Architecture diagram hero, service status dashboard, pricing calculator, documentation navigation, integration ecosystem
- **Domain categories**: industry (developer-tools), contemporary (terminal-cli, data-visualization, bento-grid)
- **Transplant categories**: futurist (data-center, sci-fi-hud), historical (swiss-rationalism), typography (mono-aesthetic)
- **Color mood**: Infrastructure dark — near-black or deep navy, status-coded accents (green healthy, amber degraded, red down), provider brand color
- **Typography mood**: Operations grade — monospace for infrastructure identifiers, geometric sans for navigation, condensed for status dashboards
- **Motion tier**: Subtle (1)
- **Key effects**: Service status indicator pulse, architecture diagram interactive zoom, pricing tier comparison slider, deployment log streaming
- **Anti-patterns**: Avoid consumer-friendly aesthetics for infrastructure tools; never use playful illustrations; do not sacrifice information density for clean minimalism

---

## 2. Finance

### Fintech / Digital Banking
- **Pattern**: App screen hero with transaction preview, security trust bar, feature benefit cards, social proof
- **Domain categories**: industry (fintech-trust, neobank-consumer, bloomberg-terminal)
- **Transplant categories**: historical (swiss-rationalism, bauhaus, art-deco, dieter-rams), hybrid (newspaper-broadsheet)
- **Color mood**: Trustworthy precision — deep navy or slate, controlled bright accent, zero gradient excess
- **Typography mood**: Financial authority — serif display for trust, geometric sans body, tabular-nums mandatory for all numbers
- **Motion tier**: Subtle (1)
- **Key effects**: Card flip for balance reveal, transaction list stagger entrance, security badge shimmer, number count-up
- **Anti-patterns**: Transplant is almost always better here; avoid generic dark-fintech; never bounce or scale-up near financial data; do not use playful animation near money

### Traditional Banking
- **Pattern**: Service overview hero, branch locator, product comparison table, trust/heritage bar
- **Domain categories**: industry (fintech-trust, legaltech), emotional (trust-safety)
- **Transplant categories**: historical (art-deco, dieter-rams), hybrid (newspaper-broadsheet), material (leather-craft)
- **Color mood**: Heritage institutional — deep navy, burgundy or forest green, gold accents, cream secondary backgrounds
- **Typography mood**: Established authority — classic serif display, traditional proportions, restrained contemporary sans body
- **Motion tier**: Static (0)
- **Key effects**: Minimal — smooth scroll anchoring, subtle card hover elevation, restrained fade entrances only
- **Anti-patterns**: Avoid startup aesthetics; never use neon accents or playful shapes; do not animate financial data; avoid mobile-app-first design language for traditional banking audience

### Insurance Platform
- **Pattern**: Quote calculator hero, coverage comparison cards, claims process timeline, trust certifications
- **Domain categories**: industry (fintech-trust), emotional (trust-safety)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), hybrid (scientific-journal, newspaper-broadsheet)
- **Color mood**: Protective calm — muted blue or teal, warm grey, green for positive outcomes, restrained and conservative
- **Typography mood**: Reassuring clarity — clean humanist sans, generous size, high readability for all ages
- **Motion tier**: Subtle (1)
- **Key effects**: Quote form step transitions, coverage tier comparison slider, claims timeline progress animation
- **Anti-patterns**: Avoid urgency-driven design (countdown timers, scarcity); never use red as primary; do not make claims feel transactional or gamified

### Personal Finance Tracker
- **Pattern**: Dashboard preview hero, spending visualization, budget category cards, goal progress display
- **Domain categories**: contemporary (data-visualization, bento-grid), industry (neobank-consumer)
- **Transplant categories**: emotional (playful-joyful, dopamine-design), cultural (scandinavian-nordic)
- **Color mood**: Friendly financial — soft pastels for categories, single bold accent for CTAs, warm neutral base
- **Typography mood**: Approachable data — rounded sans display, clear numeric presentation, friendly not clinical
- **Motion tier**: Expressive (2)
- **Key effects**: Spending chart animation on load, budget bar fill progress, category color-coded transitions, achievement unlock micro-interaction
- **Anti-patterns**: Avoid Bloomberg-style density; never make personal finance feel intimidating; do not use dark terminal aesthetics for consumer audience

### Invoice & Billing Tool
- **Pattern**: Invoice template preview hero, automation workflow diagram, payment status dashboard, client management preview
- **Domain categories**: industry (fintech-trust, saas-b2b-dashboard), contemporary (data-visualization)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), hybrid (catalog-archive), material (paper-editorial)
- **Color mood**: Document professional — white or light grey base, dark text, status color system (green paid, amber pending, red overdue)
- **Typography mood**: Document precision — clean sans with strong tabular figures, clear invoice hierarchy, print-friendly proportions
- **Motion tier**: Subtle (1)
- **Key effects**: Invoice template tab switching, payment status badge update, automation step reveal, send confirmation micro-interaction
- **Anti-patterns**: Avoid flashy marketing aesthetics for a utility tool; never obscure the invoice preview behind scroll; do not use playful colors for financial documents

### Cryptocurrency / Web3 Exchange
- **Pattern**: Live price ticker hero, trading pair chart, portfolio overview, order book preview
- **Domain categories**: industry (bloomberg-terminal, fintech-trust), futurist (neural-network-ai, cyberpunk-neon)
- **Transplant categories**: contemporary (terminal-cli, data-visualization), historical (constructivism)
- **Color mood**: Market dark — near-black base, green for gains, red for losses, electric blue or purple accent, high-contrast data
- **Typography mood**: Trading precision — condensed sans for data density, monospace for prices, bold display for pair names
- **Motion tier**: Subtle (1)
- **Key effects**: Real-time price tick animation, candlestick chart draw, order book depth update, portfolio value counter
- **Anti-patterns**: Avoid gambling aesthetics (spinning wheels, flash animations); never use playful design near trading; do not add unnecessary decoration that competes with price data

### Accounting Software
- **Pattern**: Ledger dashboard hero, report generation preview, reconciliation workflow, compliance badge bar
- **Domain categories**: industry (fintech-trust, saas-b2b-dashboard), contemporary (data-visualization)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams, bauhaus), hybrid (newspaper-broadsheet), material (paper-editorial)
- **Color mood**: Ledger clean — white or very light grey base, dark navy text, minimal accent (single green or blue), status colors for reconciliation
- **Typography mood**: Accounting grade — geometric sans with precise tabular figures, monospace for account numbers, clear hierarchy between labels and values
- **Motion tier**: Subtle (1)
- **Key effects**: Report generation progress indicator, reconciliation match animation, chart render on tab switch, export confirmation feedback
- **Anti-patterns**: Avoid trendy gradients; never animate financial totals with playful effects; do not sacrifice data density for visual minimalism; avoid startup aesthetics

---

## 3. Healthcare

### Medical Clinic / Hospital
- **Pattern**: Service finder hero, doctor directory cards, appointment booking CTA, location/hours bar, patient portal link
- **Domain categories**: industry (medtech-clinical, healthcare-wellness), emotional (trust-safety)
- **Transplant categories**: cultural (scandinavian-nordic), historical (swiss-rationalism, dieter-rams)
- **Color mood**: Clinical trust — white base, calming teal or blue, warm accent for human touch, high contrast for accessibility
- **Typography mood**: Medical clarity — clean humanist sans, large body text for all reading levels, clear heading hierarchy
- **Motion tier**: Subtle (1)
- **Key effects**: Department card hover reveal, doctor profile expand, appointment slot selection feedback, location map smooth pan
- **Anti-patterns**: Avoid cold sterile white-only design; never use red as decorative color (medical emergency association); do not use complex animations that slow task completion for worried patients

### Pharmacy / Drug Information
- **Pattern**: Drug search hero, medication information cards, interaction checker, pharmacy locator
- **Domain categories**: industry (medtech-clinical), emotional (trust-safety, clinical-cold)
- **Transplant categories**: extended (pharmaceutical-clean), hybrid (scientific-journal), historical (dieter-rams)
- **Color mood**: Pharmaceutical precise — clean white, clinical teal, safety orange for warnings, high contrast text
- **Typography mood**: Medical reference — clear sans body, monospace for dosage numbers, structured caption system for drug information
- **Motion tier**: Static (0)
- **Key effects**: Search autocomplete with drug name matching, interaction warning highlight, dosage calculator step transition
- **Anti-patterns**: Avoid any design that could be mistaken for medical advice delivery; never use playful design near medication data; do not sacrifice readability for aesthetics

### Dental Practice
- **Pattern**: Smile-focused hero, service cards with procedure info, booking CTA, team photos, patient testimonials
- **Domain categories**: industry (healthcare-wellness), emotional (trust-safety, romantic-soft)
- **Transplant categories**: cultural (scandinavian-nordic), material (glass-crystal), morphisms (claymorphism)
- **Color mood**: Fresh confident — bright white, clean mint or aqua, warm gold accent, photography-forward
- **Typography mood**: Welcoming professional — soft geometric sans, friendly weight, generous spacing for approachability
- **Motion tier**: Subtle (1)
- **Key effects**: Before/after slider for cosmetic work, service card hover zoom, booking calendar smooth expand, testimonial carousel
- **Anti-patterns**: Avoid clinical hospital aesthetics; never use anxiety-inducing design elements; do not show graphic dental imagery in hero section

### Veterinary
- **Pattern**: Pet-centric hero with warmth, services grid, emergency CTA (prominent), team cards, pet portal link
- **Domain categories**: industry (healthcare-wellness), emotional (playful-joyful, trust-safety)
- **Transplant categories**: cultural (scandinavian-nordic), extended (bloomcore-botanical), material (wood-natural)
- **Color mood**: Warm nurturing — earth tones with green and warm amber, soft cream backgrounds, pet-photography-forward
- **Typography mood**: Caring approachable — rounded sans with warmth, generous size, friendly without being childish
- **Motion tier**: Subtle (1)
- **Key effects**: Pet species tab switching, service card gentle hover, emergency banner pulse (restrained), appointment booking flow
- **Anti-patterns**: Avoid sterile clinical look; never use overly playful design that undermines medical credibility; do not hide emergency contact information

### Mental Health / Therapy
- **Pattern**: Empathetic hero with calming language, therapist matching preview, session booking, resource library cards
- **Domain categories**: emotional (zen-void, romantic-soft, trust-safety), industry (healthcare-wellness)
- **Transplant categories**: cultural (scandinavian-nordic, japanese-minimalism), material (paper-editorial)
- **Color mood**: Therapeutic calm — warm neutrals, sage green, soft lavender, no harsh contrasts, photography filtered warm
- **Typography mood**: Gentle authority — humanist serif display for warmth, light-weight sans body, generous line-height for breathing room
- **Motion tier**: Subtle (1)
- **Key effects**: Breathing-pace scroll transitions, gentle card entrance fades, therapist profile soft reveal, calming micro-interactions
- **Anti-patterns**: Avoid clinical or corporate aesthetics; never use urgency design; do not use bright saturated colors; avoid dense information layouts that create cognitive overwhelm

### Telemedicine / Health App
- **Pattern**: App interface hero, symptom checker preview, video consultation CTA, provider directory, health records access
- **Domain categories**: industry (medtech-clinical, healthcare-wellness), contemporary (bento-grid)
- **Transplant categories**: morphisms (glassmorphism, flat), cultural (scandinavian-nordic), historical (dieter-rams)
- **Color mood**: Digital health — clean white or soft blue base, calming teal primary, warm accent for human elements, high accessibility contrast
- **Typography mood**: App-native clarity — system-aligned geometric sans, clear data presentation, touch-friendly sizing
- **Motion tier**: Subtle (1)
- **Key effects**: Symptom selection interactive flow, appointment booking step transition, video call connection animation, health data chart render
- **Anti-patterns**: Avoid enterprise SaaS aesthetics; never make health data feel like a dashboard product; do not use dark mode as default for health contexts

### Medication Reminder App
- **Pattern**: Daily schedule hero, medication list with timing, adherence chart, refill reminders, caregiver sharing
- **Domain categories**: industry (healthcare-wellness), emotional (trust-safety, playful-joyful)
- **Transplant categories**: contemporary (gamification), cultural (scandinavian-nordic), morphisms (claymorphism)
- **Color mood**: Friendly medical — soft pastels for medication categories, warm white base, green for adherence confirmation, gentle palette
- **Typography mood**: Accessible friendly — large rounded sans, generous spacing, high contrast for elderly users, clear time formatting
- **Motion tier**: Expressive (2)
- **Key effects**: Pill check-off animation, streak counter celebration, schedule time-block reveal, refill reminder gentle bounce
- **Anti-patterns**: Avoid clinical aesthetic that feels like hospital software; never use small dense interfaces (elderly users); do not make adherence tracking feel punitive

---

## 4. E-commerce

### General E-commerce
- **Pattern**: Product hero with category navigation, featured product grid, promotional banner, trust bar (shipping, returns, security)
- **Domain categories**: industry (ecommerce-retail), contemporary (bento-grid)
- **Transplant categories**: hybrid (fashion-editorial, catalog-archive), material (paper-editorial), historical (swiss-rationalism)
- **Color mood**: Conversion-optimized — clean white base, brand-color primary CTA, secondary neutral, product photography dominant
- **Typography mood**: Shopping clarity — clean sans with strong weight contrast for prices, scannable product names, compact for grid density
- **Motion tier**: Subtle (1)
- **Key effects**: Product card hover zoom, add-to-cart confirmation, filter panel slide, image gallery transition, quick-view modal
- **Anti-patterns**: Avoid design that competes with product photography; never use dark backgrounds that distort product colors; do not sacrifice conversion clarity for artistic layout

### Luxury E-commerce
- **Pattern**: Full-bleed editorial hero, curated collection story, product detail with material close-ups, heritage section
- **Domain categories**: emotional (luxury-aspirational), industry (ecommerce-retail)
- **Transplant categories**: historical (art-deco, art-nouveau), material (leather-craft, metal-chrome, glass-crystal), hybrid (fashion-editorial)
- **Color mood**: Aspirational restraint — black, white, and gold or cream, maximum negative space, product as hero, no visual noise
- **Typography mood**: Editorial luxury — display serif or refined sans, tracking wide for elegance, minimal weight contrast, uppercase for labels
- **Motion tier**: Expressive (2)
- **Key effects**: Parallax product reveal, material texture zoom, editorial scroll narrative, subtle hover state with restrained feedback
- **Anti-patterns**: Avoid discount badges or urgency timers; never use bright promotional colors; do not show dense product grids; avoid visible trust badges (luxury implies trust)

### Marketplace (P2P)
- **Pattern**: Search-first hero, category browse grid, seller spotlight cards, trust/verification section, how-it-works flow
- **Domain categories**: industry (ecommerce-retail), contemporary (bento-grid, gamification)
- **Transplant categories**: hybrid (catalog-archive), emotional (playful-joyful, trust-safety), cultural (scandinavian-nordic)
- **Color mood**: Community warm — white base, warm primary (coral, amber, or green), multi-color category system, friendly and approachable
- **Typography mood**: Platform accessible — rounded geometric sans, clear seller/buyer distinction, friendly weight for community feel
- **Motion tier**: Subtle (1)
- **Key effects**: Category hover preview, seller rating animation, search suggestion dropdown, listing card entrance stagger
- **Anti-patterns**: Avoid luxury aesthetics for P2P platforms; never hide the search function; do not make seller profiles feel corporate; avoid single-brand visual language

### Subscription Box
- **Pattern**: Unboxing hero (product reveal), customization quiz CTA, past box gallery, subscriber testimonials, pricing toggle
- **Domain categories**: industry (ecommerce-retail), emotional (dopamine-design, playful-joyful)
- **Transplant categories**: material (paper-editorial, paper-cut), hybrid (fashion-editorial), internet (cottagecore-tech)
- **Color mood**: Unboxing excitement — brand-forward palette, warm energetic tones, seasonal color flexibility, photography-led
- **Typography mood**: Brand personality — display type with character (slab, rounded, or hand-drawn feel), friendly body sans
- **Motion tier**: Expressive (2)
- **Key effects**: Box open/reveal animation, product carousel with depth, quiz step progression, subscription tier comparison slide
- **Anti-patterns**: Avoid generic ecommerce grid layout; never downplay the unboxing experience; do not use clinical or enterprise design language

### Food Delivery App
- **Pattern**: Location/search hero, restaurant card grid with ratings, cuisine category pills, order tracking preview, promotional banner
- **Domain categories**: industry (ecommerce-retail), emotional (dopamine-design, energetic-athletic)
- **Transplant categories**: cultural (latin-fiesta), contemporary (gamification), morphisms (flat)
- **Color mood**: Appetite-driven — warm red-orange primary, yellow highlights, dark text on white, food photography dominant, vibrant category colors
- **Typography mood**: Quick-scan — bold sans for restaurant names, compact for metadata (rating, time, price), large for CTAs
- **Motion tier**: Expressive (2)
- **Key effects**: Restaurant card entrance stagger, cuisine filter pill animation, order progress tracker, delivery map pin animation, cart badge bounce
- **Anti-patterns**: Avoid luxury restaurant aesthetics for delivery context; never use slow transitions (users want speed); do not obscure restaurant ratings and delivery time

---

## 5. Services

### Beauty / Spa / Wellness
- **Pattern**: Sensory hero with treatment imagery, service menu cards, booking CTA, team/therapist profiles, testimonials
- **Domain categories**: emotional (romantic-soft, luxury-aspirational, zen-void), industry (healthcare-wellness)
- **Transplant categories**: cultural (japanese-minimalism, scandinavian-nordic), material (glass-crystal), morphisms (glassmorphism)
- **Color mood**: Luxurious calm — soft blush, champagne gold, sage green or lavender accent, warm whites, photography-forward
- **Typography mood**: Elegant softness — refined serif display, light-weight sans body, wide tracking for luxury, generous whitespace
- **Motion tier**: Subtle (1)
- **Key effects**: Treatment image parallax, service category tab switching, booking calendar smooth reveal, testimonial fade carousel
- **Anti-patterns**: Avoid clinical medical aesthetics; never use harsh contrast or bold corporate colors; do not create dense information layouts

### Restaurant / Cafe
- **Pattern**: Atmospheric hero (food/space photography), menu highlights, reservation CTA, location with hours, chef/story section
- **Domain categories**: emotional (romantic-soft), material (wood-natural, paper-editorial)
- **Transplant categories**: cultural (latin-fiesta, scandinavian-nordic, japanese-minimalism), hybrid (photography-portfolio)
- **Color mood**: Appetite warmth — warm earth tones, deep green or burgundy, cream backgrounds, food photography as primary color source
- **Typography mood**: Menu character — display serif or hand-lettered display, clean sans for details, clear price formatting
- **Motion tier**: Subtle (1)
- **Key effects**: Menu section tab switching, food image hover zoom, reservation time picker interaction, location map pan
- **Anti-patterns**: Avoid generic template restaurant design; never use blue (appetite suppressant); do not hide the menu behind excessive scrolling; avoid stock food photography

### Hotel / Hospitality
- **Pattern**: Full-bleed room/property hero, room type comparison cards, amenity icons grid, booking date picker, location map
- **Domain categories**: emotional (luxury-aspirational, romantic-soft), industry (proptech)
- **Transplant categories**: hybrid (photography-portfolio, fashion-editorial), material (leather-craft, glass-crystal), historical (art-deco)
- **Color mood**: Hospitality refined — warm neutrals, gold or brass accent, deep blue or forest green, property photography dominant
- **Typography mood**: Hospitality elegance — serif display for property name, clean sans for booking details, generous spacing
- **Motion tier**: Expressive (2)
- **Key effects**: Room gallery carousel with depth, date picker smooth interaction, amenity icon entrance stagger, property photo parallax
- **Anti-patterns**: Avoid generic travel-site design; never use discount urgency language for luxury properties; do not obscure room photography with overlay text

### Legal Services
- **Pattern**: Practice area hero, attorney directory, case result highlights, consultation CTA, credential badges
- **Domain categories**: industry (legaltech), emotional (trust-safety)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), hybrid (newspaper-broadsheet, scientific-journal), extended (legal-editorial)
- **Color mood**: Judicial authority — deep navy, dark grey, gold or burgundy accent, cream paper-reference backgrounds
- **Typography mood**: Legal tradition — serif display for authority, clean sans body for readability, structured heading hierarchy
- **Motion tier**: Static (0)
- **Key effects**: Minimal — practice area card hover, attorney profile expand, smooth scroll anchoring, restrained fade entrances
- **Anti-patterns**: Avoid playful or casual design; never use bright colors; do not use animation that feels unserious; avoid startup aesthetics entirely

### Home Services
- **Pattern**: Service search hero, category cards (plumbing, electrical, cleaning), booking flow preview, technician profiles, trust badges
- **Domain categories**: emotional (trust-safety, playful-joyful), contemporary (bento-grid)
- **Transplant categories**: cultural (scandinavian-nordic), morphisms (flat, material-design), historical (dieter-rams)
- **Color mood**: Reliable friendly — clean white base, trustworthy blue or green primary, warm accent for urgency, clear service iconography
- **Typography mood**: Service clear — bold geometric sans for categories, clean body for descriptions, large touch-friendly sizing
- **Motion tier**: Subtle (1)
- **Key effects**: Service category filter animation, booking step transition, technician arrival tracker, review score entrance
- **Anti-patterns**: Avoid luxury aesthetics; never use abstract design over clear service representation; do not hide pricing information behind consultation walls

### Booking / Appointment Platform
- **Pattern**: Availability search hero, calendar/time picker, provider cards, service type selection, confirmation flow
- **Domain categories**: contemporary (bento-grid, data-visualization), industry (saas-b2b-dashboard)
- **Transplant categories**: historical (swiss-rationalism, bauhaus), morphisms (flat, material-design), cultural (scandinavian-nordic)
- **Color mood**: Calendar functional — clean white, single primary accent for available slots, grey for unavailable, green for confirmed
- **Typography mood**: Time-data clarity — geometric sans with tabular figures, compact for calendar density, clear date formatting
- **Motion tier**: Subtle (1)
- **Key effects**: Calendar date selection highlight, time slot availability animation, booking confirmation checkmark, step progress indicator
- **Anti-patterns**: Avoid decorative design that competes with scheduling functionality; never use dark mode for calendar-heavy interfaces; do not hide available times behind extra clicks

### Consulting / Agency
- **Pattern**: Value proposition hero, case study grid, methodology section, team profiles, client logo bar
- **Domain categories**: hybrid (fashion-editorial, photography-portfolio), contemporary (bento-grid)
- **Transplant categories**: historical (swiss-rationalism, new-wave-swiss-punk), typography (big-bold-type, serif-revival)
- **Color mood**: Confident minimal — black and white base, single bold accent, generous negative space, case study imagery as color source
- **Typography mood**: Statement making — large display type with character, professional sans body, editorial weight contrast
- **Motion tier**: Expressive (2)
- **Key effects**: Case study card hover reveal, methodology step scroll animation, team photo parallax, client logo carousel
- **Anti-patterns**: Avoid generic corporate blue; never use stock photography; do not present as a SaaS product; avoid template-feeling grid layouts

---

## 6. Creative

### Portfolio / Personal Website
- **Pattern**: Statement hero with name/title, project grid or list, about section, contact CTA
- **Domain categories**: hybrid (photography-portfolio, fashion-editorial), typography (kinetic-type, big-bold-type)
- **Transplant categories**: historical (swiss-rationalism, new-wave-swiss-punk, bauhaus), internet (post-internet-maximalism)
- **Color mood**: Personal expression — entirely dependent on the individual; default to high-contrast monochrome with one signature accent
- **Typography mood**: Personality display — bold expressive display type, clean body, type choice IS the brand identity
- **Motion tier**: Expressive (2)
- **Key effects**: Project hover preview, scroll-triggered type animation, cursor-follow interaction, image reveal on scroll, page transition
- **Anti-patterns**: Avoid generic minimalist portfolio template; never use the same grid for every portfolio; do not suppress personality for "professionalism"

### Creative Agency
- **Pattern**: Showreel/hero project, case study grid with hover previews, capabilities section, awards/press, team culture
- **Domain categories**: hybrid (photography-portfolio, fashion-editorial), typography (kinetic-type, big-bold-type, deconstructed-type)
- **Transplant categories**: historical (new-wave-swiss-punk, constructivism, dada), internet (post-internet-maximalism)
- **Color mood**: Bold statement — high contrast, unexpected color combinations, work imagery as primary palette driver
- **Typography mood**: Typographic dominance — oversized display with strong personality, type as primary visual element
- **Motion tier**: Kinetic (3)
- **Key effects**: Full-page project transitions, scroll-driven type animation, cursor-reactive elements, video background hero, elastic scroll interactions
- **Anti-patterns**: Avoid corporate agency templates; never use safe blue/grey palettes; do not present creative work in boring grids; avoid slow-loading decorative animations that frustrate viewing work

### Photography Studio
- **Pattern**: Full-bleed image hero, gallery grid with category filters, about/process, booking/contact, client list
- **Domain categories**: hybrid (photography-portfolio), emotional (romantic-soft, luxury-aspirational)
- **Transplant categories**: historical (swiss-rationalism), typography (serif-revival, condensed-editorial), material (paper-editorial)
- **Color mood**: Photography servant — near-black or pure white, zero color competition with images, minimal accent for navigation only
- **Typography mood**: Caption precision — refined serif or clean sans, small and unobtrusive, never competing with imagery
- **Motion tier**: Expressive (2)
- **Key effects**: Image gallery lightbox with smooth transition, category filter crossfade, parallax scroll on image pairs, cursor-follow zoom
- **Anti-patterns**: Avoid colored backgrounds that distort photography; never use heavy decorative type over images; do not add filters or overlays to portfolio images

### Music / Audio Platform
- **Pattern**: Now-playing hero with visualizer, playlist/album grid, artist profiles, genre browse, social features
- **Domain categories**: hybrid (music-album-art), internet (synthwave, vaporwave, cyberpunk-neon)
- **Transplant categories**: typography (kinetic-type, big-bold-type), historical (new-wave-swiss-punk, psychedelic), futurist (neon-dystopia)
- **Color mood**: Audio atmospheric — dark base, vibrant accent colors tied to album art or genre, high saturation for energy, adaptive palette
- **Typography mood**: Record-cover energy — bold condensed display, genre-adaptive type personality, large artist names
- **Motion tier**: Kinetic (3)
- **Key effects**: Audio waveform visualization, album art parallax, beat-synced micro-animations, playlist scroll with cover art depth, play/pause transition
- **Anti-patterns**: Avoid static corporate music platform design; never use generic sans-serif for artist names; do not separate audio experience from visual experience

### Photo / Video Editor
- **Pattern**: Canvas-first hero with editing preview, tool panel showcase, before/after comparison, template gallery, export options
- **Domain categories**: contemporary (dark-mode-first, glass-dashboard), industry (developer-tools)
- **Transplant categories**: morphisms (glassmorphism, flat), historical (bauhaus, dieter-rams), typography (mono-aesthetic)
- **Color mood**: Tool-grade dark — near-black canvas, muted grey panels, single accent for active tools, content photography must read true-color
- **Typography mood**: Tool UI precision — small geometric sans for tool labels, monospace for values, minimal and unobtrusive
- **Motion tier**: Subtle (1)
- **Key effects**: Tool panel slide transitions, before/after slider interaction, filter preview thumbnail grid, export progress animation
- **Anti-patterns**: Avoid colorful UI that distorts content editing; never use large decorative type in tool interfaces; do not add slow transitions that impede workflow; avoid marketing aesthetics in tool UI

---

## 7. Education

### EdTech / Learning Platform
- **Pattern**: Course catalog hero, learning path visualization, progress dashboard preview, instructor cards, subject browse
- **Domain categories**: industry (edtech), emotional (playful-joyful, dopamine-design)
- **Transplant categories**: cultural (scandinavian-nordic), contemporary (gamification, bento-grid), morphisms (claymorphism)
- **Color mood**: Learning bright — white base, subject-coded color system, warm primary, illustrated accents, accessible contrast
- **Typography mood**: Educational friendly — rounded geometric sans display, clear humanist body, generous size for readability
- **Motion tier**: Expressive (2)
- **Key effects**: Progress bar fill animation, course card entrance stagger, learning path node connection, achievement unlock celebration
- **Anti-patterns**: Avoid corporate LMS aesthetics; never make learning feel like work software; do not use dark mode as default for educational content; avoid dense data displays

### LMS (Learning Management System)
- **Pattern**: Course dashboard hero, assignment list, grade tracker, calendar view, discussion forum preview
- **Domain categories**: industry (edtech, saas-b2b-dashboard), contemporary (data-visualization, bento-grid)
- **Transplant categories**: historical (swiss-rationalism, bauhaus), cultural (scandinavian-nordic), morphisms (flat)
- **Color mood**: Academic organized — clean white or light grey base, institutional blue or green primary, status colors for grades, high accessibility contrast
- **Typography mood**: Academic functional — clean sans with clear hierarchy, readable body text, structured heading system for course organization
- **Motion tier**: Subtle (1)
- **Key effects**: Assignment status update animation, grade reveal transition, calendar event hover expand, course module accordion
- **Anti-patterns**: Avoid consumer app playfulness for institutional LMS; never sacrifice feature density for visual minimalism; do not use entertainment aesthetics for academic tools

### Online Course Platform
- **Pattern**: Course catalog hero with search, course cards with instructor/rating, category browse, student testimonials, pricing
- **Domain categories**: industry (edtech), emotional (playful-joyful, trust-safety)
- **Transplant categories**: hybrid (catalog-archive), contemporary (bento-grid, gamification), cultural (scandinavian-nordic)
- **Color mood**: Knowledge marketplace — white base, warm primary accent, topic-coded categories, instructor photography prominent
- **Typography mood**: Course-catalog clear — bold sans for course titles, clean body for descriptions, prominent rating/price display
- **Motion tier**: Subtle (1)
- **Key effects**: Course card hover with preview video thumbnail, category filter animation, rating star entrance, enrollment count-up
- **Anti-patterns**: Avoid dense LMS-style design for public course marketplace; never hide pricing; do not use corporate B2B design language for consumer learners

### Language Learning App
- **Pattern**: Interactive lesson hero, progress streak display, language selection, daily goal tracker, leaderboard preview
- **Domain categories**: industry (edtech), emotional (dopamine-design, playful-joyful), contemporary (gamification)
- **Transplant categories**: cultural (any regional match for target language), morphisms (claymorphism, flat)
- **Color mood**: Gamified learning — bright primary green or blue, celebration gold, streak-red for missed days, colorful character illustrations
- **Typography mood**: Friendly game — rounded bold sans, large for primary content, playful weight contrast, clear for multi-script rendering
- **Motion tier**: Expressive (2)
- **Key effects**: Streak fire animation, XP counter celebration, lesson progress fill, character reaction micro-animation, correct/incorrect feedback animation
- **Anti-patterns**: Avoid academic formality; never use dense text-heavy layouts; do not make language learning feel like studying; avoid monochrome or muted palettes

### Kids / Children Learning App
- **Pattern**: Character-guided hero, activity selection grid, progress stars/rewards, parent dashboard link, themed content areas
- **Domain categories**: industry (edtech), emotional (playful-joyful, whimsical-storybook, dopamine-design)
- **Transplant categories**: morphisms (claymorphism), contemporary (gamification), extended (blob-world)
- **Color mood**: Joyful primary — bright primary colors, white base, illustrated character palette, high saturation safe for young eyes
- **Typography mood**: Child-readable — large rounded sans, generous spacing, clear letterforms for emerging readers, playful display
- **Motion tier**: Expressive (2)
- **Key effects**: Character reaction animations, star reward celebration, activity completion confetti, progress path node unlock, sound-synced interactions
- **Anti-patterns**: Avoid adult learning aesthetics; never use small or dense text; do not include attention-hijacking infinite scroll; avoid complex navigation for young users

---

## 8. Lifestyle

### Habit Tracker
- **Pattern**: Daily view hero with habit grid, streak calendar, progress charts, habit category management, social accountability
- **Domain categories**: contemporary (gamification, bento-grid), emotional (dopamine-design, playful-joyful)
- **Transplant categories**: cultural (scandinavian-nordic, japanese-minimalism), morphisms (claymorphism)
- **Color mood**: Achievement warm — soft white base, green for completed, gentle amber for pending, celebration colors for streaks, pastel category system
- **Typography mood**: Daily clarity — rounded sans, large checkmark-friendly sizing, clear date formatting, compact for calendar density
- **Motion tier**: Expressive (2)
- **Key effects**: Habit check-off celebration (confetti or glow), streak counter animation, calendar heat-map color fill, progress chart draw animation
- **Anti-patterns**: Avoid punitive design for missed habits; never use clinical productivity aesthetics; do not make the interface feel like work

### Recipe / Cooking App
- **Pattern**: Recipe hero with food photography, ingredient list, step-by-step instructions, timer integration, save/share
- **Domain categories**: emotional (romantic-soft, playful-joyful), material (wood-natural, paper-editorial)
- **Transplant categories**: cultural (latin-fiesta, scandinavian-nordic, japanese-minimalism), hybrid (photography-portfolio)
- **Color mood**: Kitchen warmth — cream or warm white base, food-photography-driven palette, warm earth accents, appetite-friendly warm tones
- **Typography mood**: Recipe readable — serif display for recipe names, clean sans body for instructions, clear fraction/measurement formatting
- **Motion tier**: Subtle (1)
- **Key effects**: Recipe step progression, ingredient checkbox interaction, timer countdown animation, serving size adjustment slider
- **Anti-patterns**: Avoid tech-forward design for cooking context; never use blue or cold palettes; do not hide the recipe behind excessive content; avoid dense multi-column layouts while cooking

### Meditation / Mindfulness App
- **Pattern**: Breathing exercise hero, session library, streak/consistency tracker, ambient sound selector, guided meditation player
- **Domain categories**: emotional (zen-void, romantic-soft, melancholic), cultural (japanese-minimalism)
- **Transplant categories**: cultural (scandinavian-nordic), material (stone-geological), futurist (cosmic-astronomical)
- **Color mood**: Deep calm — muted deep blue or purple, warm earth neutrals, dawn/dusk gradient transitions, no bright saturations
- **Typography mood**: Mindful minimal — light-weight serif or humanist sans, generous spacing, breathing-room line-height, whisper-quiet hierarchy
- **Motion tier**: Subtle (1)
- **Key effects**: Breathing circle expand/contract animation, ambient gradient slow shift, session timer pulse, nature sound wave visualization
- **Anti-patterns**: Avoid gamification; never use achievement pressure; do not use bright colors or high contrast; avoid busy interfaces with many options visible at once

### Weather App
- **Pattern**: Current conditions hero with dynamic background, hourly forecast strip, weekly forecast cards, radar map, air quality index
- **Domain categories**: contemporary (data-visualization, bento-grid), emotional (playful-joyful)
- **Transplant categories**: futurist (cosmic-astronomical), cultural (scandinavian-nordic), morphisms (aurora-mesh, glassmorphism)
- **Color mood**: Atmospheric adaptive — palette shifts with conditions (warm amber for sunny, cool blue for rain, grey for overcast, dark for night)
- **Typography mood**: Forecast display — bold geometric sans for temperature, clean compact sans for details, tabular figures for data
- **Motion tier**: Expressive (2)
- **Key effects**: Weather condition icon animation (rain drops, sun rays, clouds drifting), temperature transition, hourly scroll with time shift, radar map animation
- **Anti-patterns**: Avoid static design that ignores weather conditions; never use the same palette regardless of weather; do not sacrifice readability for atmospheric effects

### Diary / Journal App
- **Pattern**: Today's entry hero, past entries timeline, mood/tag system, writing prompt, media attachment gallery
- **Domain categories**: emotional (romantic-soft, melancholic, zen-void), material (paper-editorial, leather-craft)
- **Transplant categories**: cultural (japanese-minimalism, scandinavian-nordic), typography (handwritten-gestural, serif-revival)
- **Color mood**: Personal warmth — cream or aged paper base, soft ink tones, muted accent for tags, warm and intimate palette
- **Typography mood**: Written character — serif body for journal content, handwritten-style display optional, comfortable reading proportions
- **Motion tier**: Subtle (1)
- **Key effects**: Entry expand with soft transition, calendar day selection, mood tag selection feedback, writing area focus animation
- **Anti-patterns**: Avoid social-media design patterns; never add public-facing features to private journals; do not use bright corporate colors; avoid productivity-tool aesthetics

### Mood Tracker
- **Pattern**: Daily mood input hero, mood history chart, pattern analysis, journaling prompt, trigger identification
- **Domain categories**: emotional (romantic-soft, playful-joyful), contemporary (data-visualization)
- **Transplant categories**: cultural (scandinavian-nordic, japanese-minimalism), morphisms (claymorphism, aurora-mesh)
- **Color mood**: Emotional spectrum — mood-mapped palette (warm yellow for happy, blue for sad, red for angry, green for calm), soft pastel base
- **Typography mood**: Gentle expressive — rounded sans, large for mood selection, friendly and non-clinical, clear chart labels
- **Motion tier**: Expressive (2)
- **Key effects**: Mood selection animation with color shift, history chart draw animation, pattern reveal transition, gentle celebration for logging streaks
- **Anti-patterns**: Avoid clinical mental health assessment design; never use harsh or judgmental visual language; do not make mood tracking feel like diagnostic testing

### Plant Care / Garden App
- **Pattern**: Plant collection hero, care schedule calendar, identification tool, watering reminder, community tips
- **Domain categories**: emotional (romantic-soft, playful-joyful), extended (bloomcore-botanical)
- **Transplant categories**: cultural (scandinavian-nordic, japanese-minimalism), material (wood-natural), internet (cottagecore-tech)
- **Color mood**: Botanical alive — fresh greens across the spectrum, warm soil brown, bloom accents (pink, yellow, orange), cream or white base
- **Typography mood**: Nature friendly — rounded sans with warmth, clear for plant names (including Latin), generous spacing for outdoor readability
- **Motion tier**: Expressive (2)
- **Key effects**: Watering animation, growth progress visualization, plant identification camera transition, seasonal care calendar shift, care streak celebration
- **Anti-patterns**: Avoid clinical database design for plant collections; never use cold tech-forward aesthetics; do not use dark mode as default for an outdoor-use app

---

## 9. Real Estate & Property

### PropTech / Real Estate Platform
- **Pattern**: Property search hero with map, listing card grid, filter sidebar, virtual tour CTA, agent contact
- **Domain categories**: industry (proptech), contemporary (bento-grid, data-visualization)
- **Transplant categories**: hybrid (map-cartographic, photography-portfolio, architecture-inspired), material (concrete-brutalist-material)
- **Color mood**: Property professional — clean white base, dark navy or charcoal text, single accent (green or blue), photography-dominant layout
- **Typography mood**: Listing clarity — clean sans for property details, bold for prices, compact for listing metadata, clear hierarchy between address and features
- **Motion tier**: Expressive (2)
- **Key effects**: Map pin cluster animation, property card hover gallery preview, filter panel slide transition, virtual tour launch, price range slider
- **Anti-patterns**: Avoid generic real estate template design; never use stock interior photography as decoration; do not hide the search and filter functionality; avoid over-designing at the expense of property browsing speed

### Property Management
- **Pattern**: Portfolio dashboard hero, property list with status indicators, maintenance request tracker, tenant communication, financial overview
- **Domain categories**: industry (proptech, saas-b2b-dashboard), contemporary (data-visualization, bento-grid)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), hybrid (catalog-archive), material (concrete-brutalist-material)
- **Color mood**: Management functional — light grey or white base, status color system (green occupied, amber maintenance, red urgent), professional navy accent
- **Typography mood**: Property data — geometric sans with tabular figures, compact for dashboard density, clear status labels
- **Motion tier**: Subtle (1)
- **Key effects**: Property status badge update, maintenance request progress animation, occupancy chart render, tenant notification indicator
- **Anti-patterns**: Avoid consumer real estate search aesthetics; never use photography-dominant design for management tools; do not sacrifice data density for visual appeal

---

## 10. Travel & Hospitality

### Travel Booking Platform
- **Pattern**: Destination search hero with date picker, deal cards, destination photography grid, review highlights, trip planning tools
- **Domain categories**: emotional (romantic-soft, luxury-aspirational), hybrid (photography-portfolio, map-cartographic)
- **Transplant categories**: cultural (any regional match), contemporary (bento-grid), material (paper-editorial)
- **Color mood**: Wanderlust warm — destination photography as primary color source, warm accent for CTAs, clean white for booking interfaces, blue for trust elements
- **Typography mood**: Travel editorial — serif display for destination names, clean sans for booking details, clear date and price formatting
- **Motion tier**: Expressive (2)
- **Key effects**: Destination image parallax, date picker smooth interaction, deal card entrance stagger, map destination pin animation, photo gallery transition
- **Anti-patterns**: Avoid corporate travel-management aesthetics; never use stock photography of generic beaches; do not hide pricing behind search; avoid dense enterprise UI for consumer travelers

### Airline
- **Pattern**: Flight search hero, booking flow, seat map, loyalty program showcase, fleet/route information
- **Domain categories**: industry (fintech-trust), emotional (trust-safety, luxury-aspirational)
- **Transplant categories**: futurist (white-futurism, sci-fi-hud), historical (swiss-rationalism), material (metal-chrome)
- **Color mood**: Aviation brand — airline brand colors as primary, clean white base, status colors for flight info, premium cabin gold/navy
- **Typography mood**: Precision functional — condensed sans for flight data, clear tabular figures, brand display type, compact for booking density
- **Motion tier**: Subtle (1)
- **Key effects**: Flight search loading animation, seat map interactive selection, booking step progression, flight status update, loyalty tier reveal
- **Anti-patterns**: Avoid trendy startup aesthetics; never use playful design for flight booking (high-stakes purchase); do not obscure flight details with decorative elements; avoid slow transitions in booking flow

### Tourism / Destination Guide
- **Pattern**: Immersive destination hero, attraction cards, local experience stories, interactive map, itinerary builder, seasonal guide
- **Domain categories**: hybrid (photography-portfolio, map-cartographic), emotional (romantic-soft)
- **Transplant categories**: cultural (any regional match), typography (serif-revival, condensed-editorial), material (paper-editorial)
- **Color mood**: Destination authentic — color palette derived from local landscape and culture, warm earth tones, photography-led, seasonal adaptation
- **Typography mood**: Travel editorial — expressive serif display for destination narrative, clean sans for practical info, map typography for wayfinding
- **Motion tier**: Expressive (2)
- **Key effects**: Destination photo parallax scroll, attraction card hover reveal, interactive map zoom and explore, itinerary drag-and-drop, seasonal content transition
- **Anti-patterns**: Avoid generic tourism board aesthetics; never use the same visual treatment for every destination; do not present cultural experiences with corporate design language

---

## 11. Media & Entertainment

### Streaming / Video Platform
- **Pattern**: Featured content hero with autoplay preview, content row carousels, category browse, continue-watching section, profile selection
- **Domain categories**: industry (streaming-media), contemporary (dark-mode-first)
- **Transplant categories**: futurist (neon-dystopia), emotional (dopamine-design), hybrid (music-album-art)
- **Color mood**: Cinema dark — near-black base, content thumbnails as primary color source, minimal UI chrome, red or brand accent for CTAs
- **Typography mood**: Content-forward — bold sans for titles, compact metadata type, minimal navigation chrome, large for featured content
- **Motion tier**: Expressive (2)
- **Key effects**: Content row hover expand with preview, autoplay trailer fade-in, category tab switch transition, continue-watching progress bar, profile switch animation
- **Anti-patterns**: Avoid light-mode design; never let UI compete with content thumbnails; do not use serif typography for streaming (reads as editorial, not entertainment); avoid dense text layouts

### News / Media Publisher
- **Pattern**: Breaking/featured story hero, article grid with category sections, live ticker, opinion section, newsletter subscribe
- **Domain categories**: hybrid (newspaper-broadsheet, print-to-web-editorial), contemporary (responsive-editorial)
- **Transplant categories**: typography (serif-revival, condensed-editorial), material (paper-editorial), historical (swiss-rationalism)
- **Color mood**: Editorial authority — white base, black text, section-coded accent colors, minimal decoration, photography-dominant
- **Typography mood**: News hierarchy — strong serif display for headlines, clean sans body, tight editorial spacing, clear section distinction
- **Motion tier**: Subtle (1)
- **Key effects**: Breaking news banner animation, article card entrance stagger, section tab switching, infinite scroll article loading, image lazy-load reveal
- **Anti-patterns**: Avoid blog-style single-column for news publishers; never use playful design for serious journalism; do not add decorative animations that slow news consumption; avoid subscription walls before content preview

### Podcast Platform
- **Pattern**: Featured podcast hero with play button, show cards with episode lists, category browse, playlist builder, listen history
- **Domain categories**: hybrid (music-album-art), industry (streaming-media)
- **Transplant categories**: typography (big-bold-type, serif-revival), internet (lofi-analog, synthwave), contemporary (dark-mode-first)
- **Color mood**: Audio personality — dark or warm base, show artwork as primary color source, genre-adaptive accent, warm and intimate
- **Typography mood**: Show identity — bold display for show titles, clean sans for episode metadata, comfortable reading for show notes
- **Motion tier**: Subtle (1)
- **Key effects**: Audio waveform player animation, episode list expand, show artwork hover zoom, playlist reorder interaction, playback speed toggle
- **Anti-patterns**: Avoid video-platform design patterns for audio; never obscure show artwork; do not use complex visual effects that contradict audio-first experience; avoid light sterile interfaces

### Social Media Platform
- **Pattern**: Feed hero, content creation CTA, profile/avatar system, discovery/explore grid, notification system, messaging preview
- **Domain categories**: industry (social-media-native), contemporary (gamification), emotional (dopamine-design)
- **Transplant categories**: internet (y2k-futurism, vaporwave), futurist (spatial-ar), typography (kinetic-type)
- **Color mood**: Social vibrant — brand color primary, content-generated palette, notification red, high energy accent colors, adaptive to user content
- **Typography mood**: Social native — system-aligned sans, compact for feed density, bold for usernames, clear for engagement metrics
- **Motion tier**: Expressive (2)
- **Key effects**: Feed infinite scroll with content entrance, like/reaction animation, content creation tool transitions, notification badge pulse, story/reel auto-advance
- **Anti-patterns**: Avoid editorial or corporate aesthetics; never use serif typography for social platforms; do not design static pages for inherently dynamic content; avoid desktop-first design for mobile-native social

### Gaming Platform / Launcher
- **Pattern**: Featured game hero with trailer, game library grid, store/deals section, community feed, download/play CTA
- **Domain categories**: industry (gaming), contemporary (dark-mode-first, gamification)
- **Transplant categories**: futurist (sci-fi-hud, neon-dystopia, cyberpunk-neon), internet (synthwave), emotional (dopamine-design)
- **Color mood**: Gaming immersive — deep dark base, game artwork as primary color source, neon accents for CTAs, high saturation for energy
- **Typography mood**: Gaming display — custom bold sans or condensed display, genre-adaptive weight, compact for library metadata, large for featured titles
- **Motion tier**: Kinetic (3)
- **Key effects**: Game trailer autoplay hero, library card hover with game preview, download progress animation, achievement notification popup, store deal countdown
- **Anti-patterns**: Avoid corporate SaaS aesthetics; never use light mode as default for gaming; do not use serif typography; avoid slow transitions that frustrate gamers

---

## 12. Non-profit & Government

### NGO / Non-profit
- **Pattern**: Mission-driven hero with impact imagery, cause narrative, donation CTA, impact metrics, volunteer/event section
- **Domain categories**: emotional (trust-safety, romantic-soft), hybrid (newspaper-broadsheet)
- **Transplant categories**: cultural (scandinavian-nordic), historical (swiss-rationalism), typography (serif-revival), material (paper-editorial)
- **Color mood**: Cause-authentic — palette derived from mission context (earth tones for environmental, warm for humanitarian), trustworthy and warm, not corporate
- **Typography mood**: Mission clarity — humanist serif display for headlines, clean sans body, generous size for accessibility, authoritative but warm
- **Motion tier**: Subtle (1)
- **Key effects**: Impact counter animation, donation amount selector interaction, cause story scroll narrative, volunteer event card entrance
- **Anti-patterns**: Avoid corporate charity aesthetics; never use urgency/guilt-driven design; do not use dark luxury design for charitable organizations; avoid complex interactions that create donation friction

### GovTech / Government Service
- **Pattern**: Service finder hero, task-based navigation cards, status/application tracker, resource directory, accessibility tools
- **Domain categories**: industry (govtech-civic), emotional (trust-safety)
- **Transplant categories**: historical (swiss-rationalism, dieter-rams), hybrid (newspaper-broadsheet), morphisms (flat, material-design)
- **Color mood**: Civic accessible — white base, government blue or green primary, high contrast text, zero decorative elements, WCAG AAA targeting
- **Typography mood**: Universal accessibility — clear sans at generous size, maximum readability across all literacy levels, structured hierarchy for task navigation
- **Motion tier**: Static (0)
- **Key effects**: Minimal — form step progression, status update notification, search autocomplete, accordion section expand for FAQs
- **Anti-patterns**: Avoid any decorative design; never use trendy aesthetics; do not sacrifice accessibility for visual appeal; avoid complex navigation patterns; never use motion that could trigger vestibular issues

### Political Campaign
- **Pattern**: Candidate hero with value proposition, policy position cards, donation CTA, event calendar, volunteer signup
- **Domain categories**: emotional (trust-safety, energetic-athletic), hybrid (newspaper-broadsheet)
- **Transplant categories**: historical (constructivism), typography (big-bold-type, condensed-editorial), material (paper-editorial)
- **Color mood**: Campaign patriotic — party/national colors, high contrast, rally energy, bold red/blue/white variations, photography-forward
- **Typography mood**: Rally bold — heavy condensed sans display, clear policy-readable body, campaign-poster energy, large CTA type
- **Motion tier**: Expressive (2)
- **Key effects**: Donation goal progress bar, event countdown, policy card entrance stagger, supporter counter animation, volunteer signup confirmation
- **Anti-patterns**: Avoid corporate or neutral aesthetics; never use muted palettes for campaign energy; do not make donation process feel transactional; avoid complex navigation

### Civic Engagement / Petition Platform
- **Pattern**: Cause hero with impact counter, active petition grid, trending issues, user action tracker, community stories
- **Domain categories**: emotional (trust-safety, energetic-athletic), industry (govtech-civic)
- **Transplant categories**: historical (constructivism, swiss-rationalism), hybrid (newspaper-broadsheet), typography (big-bold-type)
- **Color mood**: Action civic — white base, bold primary for action CTAs, progress green, urgency amber, accessible high contrast
- **Typography mood**: Advocacy clear — bold geometric sans display, accessible body, large signature/action targets, clear progress numbers
- **Motion tier**: Subtle (1)
- **Key effects**: Signature counter animation, petition progress bar fill, trending issue card entrance, action completion confirmation, share modal transition
- **Anti-patterns**: Avoid corporate petition design; never use anxiety-urgency patterns for civic engagement; do not hide the call-to-action; avoid dark luxury aesthetics

---

## 13. Agriculture & Industry

### AgriTech
- **Pattern**: Field data dashboard hero, crop monitoring visualization, weather integration, equipment tracking, yield analytics
- **Domain categories**: industry (agritech), contemporary (data-visualization, bento-grid)
- **Transplant categories**: cultural (scandinavian-nordic), material (wood-natural), extended (agricultural-seed-catalog), hybrid (map-cartographic)
- **Color mood**: Earth functional — soil brown, crop green, harvest gold, sky blue for weather, muted earth palette, satellite imagery integration
- **Typography mood**: Field-grade clarity — geometric sans that reads in bright sunlight (high contrast), large touch targets, tabular figures for yield data
- **Motion tier**: Subtle (1)
- **Key effects**: Crop data chart render, weather forecast animation, field map zone selection, yield comparison slider, equipment status indicator
- **Anti-patterns**: Avoid tech-startup aesthetics; never use abstract design for practical farming tools; do not sacrifice data readability for visual polish; avoid dark mode (outdoor use)

### Manufacturing / Industrial
- **Pattern**: Production dashboard hero, equipment status grid, supply chain overview, quality metrics, maintenance scheduling
- **Domain categories**: industry (saas-b2b-dashboard), contemporary (data-visualization, bento-grid)
- **Transplant categories**: futurist (data-center, sci-fi-hud), material (metal-chrome, concrete-brutalist-material), historical (constructivism)
- **Color mood**: Industrial function — medium grey base, safety-coded accents (red warning, amber caution, green operational), high contrast for shop floor
- **Typography mood**: Factory grade — condensed sans for data density, monospace for equipment codes, bold for status alerts, high-visibility sizing
- **Motion tier**: Subtle (1)
- **Key effects**: Equipment status real-time update, production line progress animation, quality metric chart render, maintenance countdown timer
- **Anti-patterns**: Avoid consumer-product aesthetics; never use decorative design in industrial monitoring; do not use low-contrast palettes; avoid animations that could distract from real-time safety data

### Logistics / Supply Chain
- **Pattern**: Shipment tracking hero, route map visualization, warehouse status grid, delivery timeline, fleet management overview
- **Domain categories**: contemporary (data-visualization, bento-grid), hybrid (map-cartographic)
- **Transplant categories**: futurist (data-center), historical (swiss-rationalism, constructivism), hybrid (newspaper-broadsheet)
- **Color mood**: Route functional — white or light grey base, status-coded system (blue in-transit, green delivered, red delayed), map-overlay optimized palette
- **Typography mood**: Tracking precision — condensed sans for data density, monospace for tracking numbers, tabular figures, compact for table views
- **Motion tier**: Subtle (1)
- **Key effects**: Route map animation with vehicle tracking, delivery status timeline progress, warehouse capacity chart render, shipment card status update
- **Anti-patterns**: Avoid consumer delivery-app aesthetics for B2B logistics; never use playful design for supply chain management; do not sacrifice data density for minimal design; avoid dark mode for warehouse/dock use

---

## 14. Sports & Fitness

### Fitness / Workout App
- **Pattern**: Today's workout hero, exercise library grid, progress charts, streak/achievement display, program selection
- **Domain categories**: emotional (energetic-athletic, dopamine-design), contemporary (gamification)
- **Transplant categories**: hybrid (sports-analytics), futurist (sci-fi-hud), internet (cyberpunk-neon), typography (big-bold-type)
- **Color mood**: High energy — dark base with electric accents (neon green, hot orange, electric blue), high contrast for gym readability, motivational intensity
- **Typography mood**: Athletic impact — bold condensed italic display, strong weight contrast, large exercise names, compact for set/rep data
- **Motion tier**: Expressive (2)
- **Key effects**: Rep counter animation, progress chart draw, exercise transition with timer, achievement unlock celebration, heart-rate zone indicator
- **Anti-patterns**: Avoid calm wellness aesthetics for workout apps; never use light delicate typography; do not use subtle pastel colors that lack motivation energy; avoid dense data-dashboard design

### Sports Analytics
- **Pattern**: Match/game data hero, player stats dashboard, performance comparison charts, historical data timeline, scouting reports
- **Domain categories**: hybrid (sports-analytics), contemporary (data-visualization, bento-grid)
- **Transplant categories**: industry (bloomberg-terminal), futurist (sci-fi-hud), historical (swiss-rationalism), emotional (energetic-athletic)
- **Color mood**: Broadcast data — dark base or team-color adaptive, stat-highlight accents, chart-optimized palette, high density data colors
- **Typography mood**: Broadcast precision — condensed sans for stats, tabular monospace for numbers, bold for player names, scoreboard-style display
- **Motion tier**: Expressive (2)
- **Key effects**: Stat comparison chart animation, player radar chart draw, live score update, play-by-play timeline scroll, heat map render
- **Anti-patterns**: Avoid generic SaaS dashboard design; never use pastel or muted colors for sports data; do not sacrifice data density for minimalism; avoid consumer fitness-app aesthetics

### Gym / Studio
- **Pattern**: Atmosphere hero with facility photography, class schedule, membership pricing, trainer profiles, location/tour CTA
- **Domain categories**: emotional (energetic-athletic), hybrid (photography-portfolio)
- **Transplant categories**: material (concrete-brutalist-material, metal-chrome), typography (big-bold-type, condensed-editorial), internet (cyberpunk-neon)
- **Color mood**: Motivational contrast — dark base, bold accent (electric green, orange, or red), facility photography as atmosphere, high energy palette
- **Typography mood**: Gym bold — heavy condensed display, impact-style headings, clean sans for schedule details, large pricing numbers
- **Motion tier**: Expressive (2)
- **Key effects**: Class schedule time-filter animation, trainer profile hover reveal, membership tier comparison, facility photo parallax, CTA pulse on scroll
- **Anti-patterns**: Avoid wellness-spa calm aesthetics for gym context; never use delicate serif typography; do not present schedules in hard-to-scan formats; avoid stock fitness photography

---

## 15. Emerging Tech

### Web3 / NFT Platform
- **Pattern**: Featured collection hero, NFT gallery grid, creator profiles, wallet connection, marketplace activity feed
- **Domain categories**: futurist (neural-network-ai, holographic), internet (cyberpunk-neon, y2k-futurism, vaporwave)
- **Transplant categories**: morphisms (holographic, aurora-mesh, glassmorphism), typography (kinetic-type, deconstructed-type), historical (constructivism)
- **Color mood**: Digital ownership — dark base, iridescent or holographic accents, electric purple/cyan palette, artwork-adaptive colors
- **Typography mood**: Crypto culture — geometric or futurist sans display, monospace for wallet addresses, bold for collection names, culture-native type choices
- **Motion tier**: Kinetic (3)
- **Key effects**: NFT card 3D tilt on hover, wallet connection animation, bid counter real-time update, collection scroll with parallax depth, holographic shimmer on featured items
- **Anti-patterns**: Avoid corporate fintech aesthetics; never use traditional banking visual language; do not use serif typography; avoid static gallery design for dynamic digital collectibles

### Spatial Computing (AR/VR)
- **Pattern**: Immersive experience hero with depth, feature showcase with spatial demos, device compatibility, developer SDK section
- **Domain categories**: futurist (spatial-ar, biomorphic-futurism), contemporary (spatial-ar, glassmorphism)
- **Transplant categories**: morphisms (glassmorphism, liquid-glass), futurist (white-futurism, sci-fi-hud), historical (bauhaus)
- **Color mood**: Spatial depth — translucent layers on dark or light, frosted glass panels, environmental-adaptive palette, depth-signaling gradients
- **Typography mood**: Spatial UI — clean geometric sans optimized for variable depths, large for readability at distance, minimal decoration
- **Motion tier**: Kinetic (3)
- **Key effects**: Parallax depth layers, 3D object rotation on scroll, glassmorphism panel entrance, spatial gesture hint animations, device tilt-responsive elements
- **Anti-patterns**: Avoid flat 2D design patterns; never use dense text layouts; do not ignore depth and layering; avoid traditional web grid constraints for spatial computing contexts

### Quantum Computing Interface
- **Pattern**: Qubit visualization hero, circuit composer, algorithm library, execution results dashboard, documentation reference
- **Domain categories**: futurist (quantum-particle, neural-network-ai, generative-algorithmic), contemporary (data-visualization, terminal-cli)
- **Transplant categories**: historical (swiss-rationalism, bauhaus), typography (mono-aesthetic), futurist (cosmic-astronomical)
- **Color mood**: Quantum state — deep dark base, probability-mapped color gradients (blue to red for qubit states), particle visualization accents, scientific precision palette
- **Typography mood**: Research grade — monospace for circuit notation, geometric sans for navigation, clean serif for documentation, scientific figure caption style
- **Motion tier**: Expressive (2)
- **Key effects**: Qubit state visualization animation, circuit gate placement interaction, execution result probability distribution render, particle simulation background
- **Anti-patterns**: Avoid consumer tech aesthetics; never oversimplify quantum concepts with playful design; do not use flashy marketing animations for research tools; avoid dark-mode-gradient cliches

### IoT / Smart Home Platform
- **Pattern**: Connected device dashboard hero, room/zone control grid, automation rules builder, energy monitoring, device status overview
- **Domain categories**: contemporary (bento-grid, data-visualization, glass-dashboard), futurist (spatial-ar)
- **Transplant categories**: morphisms (glassmorphism, neumorphism), cultural (scandinavian-nordic, japanese-minimalism), historical (dieter-rams)
- **Color mood**: Home ambient — warm white or soft dark base, room-adaptive accent colors, status-coded device indicators, cozy technology palette
- **Typography mood**: Control clarity — clean geometric sans, large for touch targets, compact for device metadata, clear temperature/value display
- **Motion tier**: Expressive (2)
- **Key effects**: Device toggle animation, room scene transition, energy usage chart render, automation trigger flow visualization, temperature slider interaction
- **Anti-patterns**: Avoid industrial IoT aesthetics for consumer smart home; never use complex technical interfaces; do not sacrifice touch-friendliness for data density; avoid cold clinical design

### Autonomous / Drone Fleet
- **Pattern**: Fleet map overview hero, vehicle status grid, mission planning interface, telemetry dashboard, safety monitoring
- **Domain categories**: futurist (sci-fi-hud, data-center), contemporary (data-visualization, bento-grid)
- **Transplant categories**: hybrid (map-cartographic), historical (swiss-rationalism, constructivism), material (metal-chrome)
- **Color mood**: Mission operational — dark map base, status-coded indicators (green active, amber returning, red alert), radar-green accent, high contrast data overlays
- **Typography mood**: Command center — condensed sans for data density, monospace for telemetry, bold for vehicle callsigns, military-grade readability
- **Motion tier**: Subtle (1)
- **Key effects**: Fleet map real-time position updates, vehicle status indicator pulse, mission path drawing animation, telemetry chart streaming data, geofence boundary visualization
- **Anti-patterns**: Avoid consumer drone-toy aesthetics; never use playful design for autonomous vehicle monitoring; do not sacrifice real-time data clarity for visual effects; avoid slow animations in safety-critical interfaces
