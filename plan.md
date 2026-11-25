# Operlynt implementation plan

## Product direction

Operlynt is a career growth platform for students, graduates, and early-career professionals. The current codebase already includes resume authoring and analysis, authenticated learning tools, role-based interview practice, aptitude/coding practice, roadmaps, recommendations, course discovery, and test-mode billing. This iteration connects those capabilities into a clearer product journey without replacing the existing Supabase data and auth flows.

Required experience from the brief:

- Users can create and improve a resume and check a resume score.
- Users can prepare for technical roles with questions, answers, right/wrong feedback, explanations, and recommendations.
- Users can discover related courses through Operlynt, including monetizable provider links where approved.
- Recommendations should be contextual: ML practice should surface ML courses, and ML course discovery should surface ML interview practice; the same pattern should work for other tech roles.
- The interface must feel polished, responsive, touch-friendly, and app-like on phones.
- The web experience should be ready to extend into a proper mobile app; this phase also adds an installable PWA shell so the product can be used like an app on supported devices.

## Implementation approach

1. Restore the user's existing source into the managed Webdev workspace.
2. Keep the existing Next.js App Router, Supabase authentication, database access, course catalog, recommendation engine, resume tools, interview actions, and practice actions.
3. Refresh the shared visual system and public homepage around three clear entry points: Build your resume, Practice interviews, and Find your next course.
4. Refresh the authenticated dashboard into a progress-led command center with a primary next action, progress metrics, role context, and recommendation cards.
5. Make the role/course connection legible in the UI by surfacing role chips, recommended course links, and interview practice links in the public and signed-in flows.
6. Add a PWA manifest, theme metadata, and touch-friendly patterns. Keep a clean seam for a future Expo app that reuses the same product concepts and APIs.
7. Add a static route manifest for Webdev Preview and configure the managed development command.
8. Run type checking, linting, existing focused tests, and a production build. Use Preview screenshots only for concrete layout inspection if needed.

## Project structure

- `app/`: Next.js routes, including public landing/SEO pages, the protected dashboard, resume tools, interview lab, practice arena, courses, and roadmaps.
- `components/`: shared navigation, buttons, recommendation shelves, auth forms, and UI primitives.
- `lib/`: course catalog, recommendation engine/signals, interview roles, question bank, pricing, Supabase helpers, and billing.
- `public/`: static icons, PWA manifest, and browser assets.
- `scripts/`: existing phase checks and readiness tests.

## Design direction

### Options considered

- **Editorial career journal** (0.06): warm paper surfaces, large serif emphasis, reflective storytelling.
- **Quiet command center** (0.52): calm ink navy, electric lilac, mint signals, compact information architecture.
- **Neon study lab** (0.04): dark canvas, bright cyan/lime progress markers, high-energy practice loops.

### Chosen movement

Quiet command center: a soft, editorial productivity interface that makes career growth feel calm, credible, and actionable rather than noisy or gamified.

### Core principles

- Put one clear next step above the fold.
- Use progress signals to create momentum without pressure.
- Make every recommendation explain why it is relevant.
- Design for thumbs first: generous hit areas, stacked mobile cards, and no hover-only interactions.

### Color philosophy

Deep ink navy grounds the product in trust and seriousness. Lilac is the signature Operlynt accent for actions and focus states. Mint and warm apricot indicate progress and learning energy without turning the interface into a game dashboard. Warm paper backgrounds keep long study sessions comfortable.

### Layout paradigm

Asymmetric editorial dashboard: large left-side story/action zones paired with compact orbiting progress cards and right-rail recommendations. Public pages use generous horizontal rhythm; dashboard pages shift into denser, task-oriented modules.

### Signature elements

- The Operlynt orbit mark: a rounded square with a cut-through path that suggests a career trajectory.
- Lilac focus rings and mint completion signals across cards, pills, and progress bars.
- A recurring “next step” card that makes the product feel personalized even before a user has completed much data.

### Interaction philosophy

Every click should return a visible state: saved, completed, correct/incorrect, in progress, or recommended for a reason. Forms should preserve the user's work, and destructive or external actions should be explicit. Buttons and filter controls stay touch-friendly at mobile sizes.

### Animation

Use short 160–220ms transitions for card lift, focus, and progress changes. Avoid decorative motion that competes with study. Use a subtle orbit drift only in the public hero and respect reduced-motion preferences.

### Typography system

Use Inter for interface text and a restrained Georgia italic for moments of aspiration in hero headlines. Strong hierarchy comes from size and whitespace, not heavy weight. Body copy stays compact and readable at 14–16px.

### Brand essence

Operlynt is the calm career workspace for people building their next chapter with practical tools, relevant practice, and learning that connects. Personality: thoughtful, encouraging, precise.

### Brand voice

Headlines are direct and optimistic: “Your next step, made clearer.” CTAs are specific and low-pressure: “Build my resume”, “Practice one question”, and “See my recommended path”.

### Wordmark and logo

The wordmark pairs the Operlynt name with a rounded lilac “o” mark containing a small diagonal path cut, representing direction and iteration rather than a generic letter icon.

### Signature brand color

Operlynt Lilac `#7055D9`.
