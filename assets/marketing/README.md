# Public homepage provenance

The homepage was ported from the user-owned Condo Ninja Site, version 9:
`appgprj_6a9d3b16ae608191a052a2728a2be362`.

`components/launch` retains the reference sections and visual primitives, adapted
to local Next.js. Lead capture, analytics, hosted auth, mobilization and storage
services were intentionally not imported. CTAs use `/cadastro`, `/login` and `/app`.
Product copy distinguishes available document intake from future analysis tools.

The captured compiled reference stylesheet is retained here, including its
Tailwind MIT attribution. `node scripts/scope-marketing-css.mjs` namespaces it
into `app/marketing.generated.css`; this avoids introducing a second styling
build stack or affecting authentication and restricted-area styles. Make local
visual adjustments in `app/marketing.css`. The original Site is unchanged.
