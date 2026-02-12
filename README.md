# 🛠️ Fullt Lager
**Fullstack vedlikehaldssystem med multi-tenant arkitektur og avansert tilgangskontroll**

[![Astro](https://img.shields.io/badge/Astro-5.16-FF5D01?logo=astro)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Om Prosjektet

Fullt Lager er eit produktklart SaaS-system for vedlikehald og lagerstyring, utvikla med moderne web-teknologi og fokus på sikkerheit, skalerbarheit og brukaropplevelse. Systemet støttar fleire organisasjonar med uavhengige datarammer gjennom Row Level Security (RLS) i PostgreSQL.

**Utvikling:** Solo-prosjekt utvikla frå grunnen av, inkludert database-arkitektur, autentisering, og fullstack-implementasjon.

### 🎯 Bruksområde
Skular, næringsbygg og bustadforvaltarar kan bruke systemet til å:
- Administrere utstyr og forbruksmateriell (lyspærer, batteri) over fleire bygningar
- Spore vedlikehaldshistorikk og analysere utskiftingsmønster
- Styre lagernivå med automatisk forbruksregistrering
- Samarbeide i team med granulert tilgangskontroll (admin/medlem)

---

## 🏗️ Teknisk Arkitektur

### Tech Stack
| Komponent | Teknologi | Rasjonale |
|-----------|-----------|-----------|
| **Framework** | [Astro 5.16](https://astro.build/) | Server-side rendering for optimal ytelse, zero JavaScript-by-default, delvis hydrering for interaktive komponentar |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL 15) | Managed database med innebygd Row Level Security, real-time subscriptions, og autentisering |
| **Autentisering** | Supabase Auth | OAuth 2.0 / JWT-basert, med e-postbekreftelse og passordgjenoppretting |
| **Språk** | [TypeScript 5.x](https://www.typescriptlang.org/) | Type-sikkerheit frå frontend til database-queries |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) | Utility-first CSS med Vite-plugin for optimal build-speed |
| **Deployment** | [Netlify](https://www.netlify.com/) | Edge-deployment med serverless functions |

### Sikkerheit & Skalerbarheit
- **Row Level Security (RLS):** 20+ policies som sikrar at brukarar kun kan aksessere data frå eigne husstandar/organisasjonar ([RLS_GUIDE.md](RLS_GUIDE.md))
- **Multi-tenant arkitektur:** Household-basert dataisolering med junction-tabell for medlemskap
- **SQL Injection-sikring:** Parametriserte queries og Supabase RPC
- **XSS-beskyttelse:** Content Security Policy (CSP) headers
- **Database-indeksering:** Optimalisert for søk og filtrering på store datasett (>1000 enheter)

---

## ✨ Hovudfunksjonar

### 1️⃣ Skalerbar Bulk-registrering
**Problem:** Registrering av 40 identiske lamper krevde 40 separate skjema-nyoppføringer.  
**Løysing:** Implementerte `quantity`-felt med automatisk lagerstyrking ved bulk-bytte.

```typescript
// Eksempel: Bytt 5 av 40 registrerte lamper
quantity: 40           // Total mengde
to_replace: 5          // Antal å bytte
stock_deduction: 5     // Automatisk trekk frå lager
```

**Teknisk implementasjon:**
- Database: `quantity INTEGER DEFAULT 1` med migrasjon
- Visning: `×N` badge på InventoryCard
- Lagerlogikk: Multiplisering i stock-queries

### 2️⃣ Hierarkisk Lokasjonsstyring
**Problem:** Fritekst-lokasjon ("Rom 101") gjorde det vanskeleg å filtrere etter bygning/avdeling.  
**Løysing:** Strukturert tredelt lokasjon med dynamiske filter.

```
Hierarki: [Bygning] / [Avdeling] / [Detalj]
Eksempel: "Hovedbygg / Fløy B / 2. etasje"
```

**Teknisk implementasjon:**
- Database: 3 separate kolonner (`building`, `department`, `detail`)
- Bakoverkompatibilitet: Fallback til gammal `location`-kolonne
- Migrasjon: Auto-migrering av eksisterande data

### 3️⃣ Avansert Søk & Filtrering
**Problem:** Finne spesifikke enheter blant 200+ registreringer.  
**Løysing:** Real-time søk med kombinerte filtre, URL-basert state.

**Filter:**
- Fritekstøk (SQL `ILIKE` på namn/lokasjon)
- Kategori (Lamper/Batterier)
- Type (Dynamisk dropdown: E27, GU10, AA, AAA osv.)
- Bygning (Dynamisk dropdown basert på unike verdiar)

**Teknisk implementasjon:**
```typescript
// URL-basert state (bevares ved refresh)
?search=klasserom&category=lamps&type=E27&building=Hovedbygg

// SQL-query med parameteriserte filter
WHERE (items.name ILIKE '%' || $1 || '%' OR ...)
  AND ($2 = 'all' OR items.category = $2)
  AND ($3 IS NULL OR items.type = $3)
```

### 4️⃣ Multi-tenant Organisasjonsstyring
- Byte mellom organisasjonar (households) utan utlogging
- Inviter medlemmar via e-post med automatisk profilering
- Admin/medlem-roller med ulike tilgangar
- RLS sikrar dataisolering mellom organisasjonar

### 5️⃣ Automatisk Lagerstyring
- Real-time oppdatering av lagernivå ved utskifting
- Terskelverdiar med visuell indikator (grønn/gul/raud)
- Bulk-forbruk: Multiplisering ved `quantity × required_count`
- Historikk: Spor kva tid lampe vart sist bytta

---

## 📊 Database-skjema

```
┌─────────────┐       ┌──────────────────┐       ┌──────────┐
│  profiles   │       │ household_members│       │  items   │
│─────────────│       │──────────────────│       │──────────│
│ id (UUID)   │──┐    │ id (UUID)        │   ┌──│ id       │
│ email       │  │    │ household_id ────┼───┤  │ name     │
│ full_name   │  └───→│ profile_id       │   │  │ category │
└─────────────┘       │ role (enum)      │   │  │ type     │
                      └──────────────────┘   │  │ quantity │
                                             │  │ building │
┌─────────────┐                              │  │ department│
│ households  │                              │  │ detail   │
│─────────────│                              │  └──────────┘
│ id (UUID)   │──────────────────────────────┘  
│ name        │                              ┌──────────┐
│ created_at  │                              │  stock   │
└─────────────┘                              │──────────│
                                             │ id       │
                                             │ item_id  │
                                             │ count    │
                                             └──────────┘
```

**Relasjonar:**
- 1-N: `households` → `household_members`
- N-M: `profiles` ↔ `households` (via `household_members`)
- 1-N: `households` → `items`
- 1-1: `items` → `stock`

---

## 🚀 Installasjon & Oppsett

### Føresetnader
- Node.js 18+ og npm
- Supabase-konto (gratis tier)

### Steg-for-steg

```bash
# 1. Klone repo
git clone https://github.com/barlunden/Bulbs-and-Batteries.git
cd Bulbs-and-Batteries

# 2. Installer avhengigheiter
npm install

# 3. Set opp miljøvariablar
cp .env.example .env
# Rediger .env med dine Supabase-nøklar:
# PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# 4. Start dev-server
npm run dev
```

### Database-oppsett
1. Gå til [Supabase Dashboard](https://app.supabase.com)
2. Opprett nytt prosjekt
3. Køyr SQL-migrasjonar i SQL Editor (i rekkefølgje):
   - `supabase_migration_profiles.sql` - Profiler
   - `supabase_migration_household_type.sql` - Enum-typar
   - `supabase_migration_quantity_location.sql` - Mengde og lokasjon
   - `supabase_rls_policies.sql` - Sikkerheitspolicies

**Detaljert migrasjonsinstruks:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

---

## 📁 Prosjektstruktur

```
src/
├── components/          # Astro/React-komponentar
│   ├── InventoryCard.astro      # Enhetskort med bytte-funksjon
│   ├── StockCounter.astro       # Lagervareteller
│   ├── Nav.astro                # Navigasjon med household-velger
│   └── ToastProvider.tsx        # React-notifikasjonar
├── layouts/
│   └── Layout.astro             # Hoved-layout med CSP
├── pages/
│   ├── index.astro              # Landingsside
│   ├── enheter.astro            # Enhetsoversikt (søk/filter)
│   ├── beholdning.astro         # Lageroversikt
│   ├── husstand.astro           # Organisasjonsstyring
│   └── api/                     # Server-endepunkt
│       └── auth/                # Autentiseringsflyt
├── lib/
│   ├── supabase.ts              # Supabase-klient
│   └── toast.ts                 # Notifikasjonshjelpar
├── types/
│   └── inventory.ts             # TypeScript-interfaces
└── styles/
    └── global.css               # Tailwind-konfiguration
```

---

## 🔐 Sikkerheit

### Row Level Security (RLS) Policies
Alle tabellar har aktivert RLS med 20+ policies som sikrar:
- ✅ Brukarar kan kun sjå data frå eigne organisasjonar
- ✅ Kun admins kan slette organisasjonar
- ✅ Profiler kan kun oppdaterast av eigar
- ✅ Lager kan kun endrast ved validerte bytte-operasjonar

**Full dokumentasjon:** [RLS_GUIDE.md](RLS_GUIDE.md)

### Autentisering
- JWT-basert session med HTTP-only cookies
- E-postbekreftelse ved registrering
- Passordgjenoppretting med token-validering
- PKCE-flow for OAuth (klargjort for Google/GitHub)

---

## 🧪 Testing & Kvalitetssikring

- **Type-sjekking:** `npm run astro check`
- **Manuell testing:** Testplan dokumentert i [TESTPLAN.md](TESTPLAN.md)
- **Migrasjonstesting:** Validering av SQL-queries før deployment

---

## 📚 Dokumentasjon

| Fil | Innhald |
|-----|---------|
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Detaljert oversikt over implementerte funksjonar |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Steg-for-steg database-oppsett |
| [RLS_GUIDE.md](RLS_GUIDE.md) | Komplett sikkerheits-dokumentasjon |
| [TESTPLAN.md](TESTPLAN.md) | Test-scenarioar for alle funksjonar |

---

## 🎓 Læringsutbytte & Tekniske Høydepunkter

Dette prosjektet demonstrerer erfaring med:

### Fullstack-utvikling
- ✅ Server-side rendering med Astro (SSR)
- ✅ API-design med RESTful-prinsipp
- ✅ State-management (URL-params, form-actions)
- ✅ Database-arkitektur (normalisering, indeksering)

### Sikkerheit & Autentisering
- ✅ Implementation av Row Level Security (RLS)
- ✅ JWT-token-handling og session-management
- ✅ OAuth 2.0 autentiseringsflyt
- ✅ SQL injection og XSS-sikring

### Skalerbarheit & Ytelse
- ✅ Database-indeksering for store datasett
- ✅ Optimalisert SQL-queries (EXPLAIN ANALYZE)
- ✅ Lazy-loading og incremental static regeneration
- ✅ Edge-deployment med Netlify

### DevOps & Verktøy
- ✅ Git-basert versjonstyring
- ✅ Database-migrasjonar og rollback-strategiar
- ✅ Environment-basert konfigurasjon
- ✅ CI/CD med Netlify

---

## 📧 Kontakt

**Agedor Barlund**  
GitHub: [@barlunden](https://github.com/barlunden)  
Repo: [Bulbs-and-Batteries](https://github.com/barlunden/Bulbs-and-Batteries)

---

## 📄 Lisens

Dette prosjektet er utvikla som ein del av min portefølje og er open-source under MIT-lisens.