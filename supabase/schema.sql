-- Esquema de Suyu (CLAUDE.md §6.2)
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo
-- sin romper nada.
--
-- Que NO vive aqui y es a proposito: site_details, stories y agencies. Son
-- contenido editorial que el equipo escribe una vez, no datos operativos que
-- cambien en produccion. Viven como JSON curado en data/.

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------

create table if not exists public.sites (
  id                       text primary key,
  name                     text not null,
  lat                      double precision not null,
  lng                      double precision not null,
  category                 text not null,
  wheelchair_accessible    boolean not null default false,
  has_ramps                boolean not null default false,
  has_accessible_bathroom  boolean not null default false,
  has_rest_areas           boolean not null default false,
  notes                    text not null default '',
  -- null = sin verificar. La UI esta obligada a decirlo (§2.1).
  verified_by              text check (verified_by in ('equipo', 'usuario')),
  verified_at              date,
  -- 24 valores 0-100, indice 0 = 00:00. Un 0 significa CERRADO, no "vacio".
  crowd_profile            smallint[] not null,
  constraint crowd_profile_has_24_hours
    check (array_length(crowd_profile, 1) = 24)
);

-- ---------------------------------------------------------------------------
-- crowd_status — reportes manuales de aforo. MANDAN sobre el perfil horario.
-- ---------------------------------------------------------------------------

create table if not exists public.crowd_status (
  id          uuid primary key default gen_random_uuid(),
  site_id     text not null references public.sites(id) on delete cascade,
  level       text not null check (level in ('bajo', 'medio', 'alto')),
  reported_at timestamptz not null default now()
);

create index if not exists crowd_status_site_reported_idx
  on public.crowd_status (site_id, reported_at desc);

-- ---------------------------------------------------------------------------
-- accessibility_reports
-- ---------------------------------------------------------------------------

create table if not exists public.accessibility_reports (
  id         uuid primary key default gen_random_uuid(),
  site_id    text not null references public.sites(id) on delete cascade,
  site_name  text not null,
  issue      text not null,
  detail     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists accessibility_reports_site_idx
  on public.accessibility_reports (site_id, created_at desc);

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table if not exists public.services (
  id                    text primary key,
  name                  text not null,
  provider              text not null,
  -- Las 9 categorias desde el inicio. En el proyecto original este constraint
  -- se quedo en 6 y bloqueo la carga de movilidad/salud/actividad. Ver §6.2.
  category              text not null check (category in (
                          'restaurante', 'guia', 'agencia', 'transporte',
                          'hospedaje', 'artesania', 'movilidad', 'salud',
                          'actividad'
                        )),
  near_site_id          text not null references public.sites(id) on delete cascade,
  lat                   double precision not null,
  lng                   double precision not null,
  wheelchair_accessible boolean not null default false,
  -- Si no hay registro confirmado: false + null. Nunca se inventa un RUC.
  formalized            boolean not null default false,
  registry_id           text,
  url                   text,
  price_range           text check (price_range in ('$', '$$', '$$$')),
  notes                 text not null default '',
  -- Campos que solo aplican a algunas categorias (estrellas de un hotel,
  -- dificultad de una actividad, horario de un bus). jsonb y no columnas
  -- sueltas: serian una decena de columnas nulas en casi toda la tabla.
  details               jsonb
);

create index if not exists services_near_site_idx
  on public.services (near_site_id);

-- ---------------------------------------------------------------------------
-- RLS
--
-- Lectura publica: son datos turisticos, no hay nada privado.
-- Escritura publica SOLO en accessibility_reports: es el unico punto donde el
-- usuario aporta, y lo hace sin cuenta. El resto se edita desde el dashboard
-- con la service role key.
-- ---------------------------------------------------------------------------

alter table public.sites                 enable row level security;
alter table public.crowd_status          enable row level security;
alter table public.accessibility_reports enable row level security;
alter table public.services              enable row level security;

drop policy if exists "sites lectura publica" on public.sites;
create policy "sites lectura publica"
  on public.sites for select using (true);

drop policy if exists "crowd_status lectura publica" on public.crowd_status;
create policy "crowd_status lectura publica"
  on public.crowd_status for select using (true);

drop policy if exists "services lectura publica" on public.services;
create policy "services lectura publica"
  on public.services for select using (true);

drop policy if exists "reportes lectura publica" on public.accessibility_reports;
create policy "reportes lectura publica"
  on public.accessibility_reports for select using (true);

drop policy if exists "reportes escritura anonima" on public.accessibility_reports;
create policy "reportes escritura anonima"
  on public.accessibility_reports for insert with check (true);

-- ---------------------------------------------------------------------------
-- Carga de datos
--
-- Los JSON de data/ son la fuente. Para cargarlos:
--   npm run seed:supabase
-- (requiere SUPABASE_SERVICE_ROLE_KEY en .env.local)
--
-- Si prefieres hacerlo a mano, el dashboard de Supabase importa CSV desde
-- Table Editor → Insert → Import data from CSV.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- MIGRACION — solo si ya tenias las tablas de una version anterior
-- ---------------------------------------------------------------------------

-- Amplia services.category de 6 a 9 categorias:
--
-- alter table public.services drop constraint if exists services_category_check;
-- alter table public.services add constraint services_category_check
--   check (category in ('restaurante', 'guia', 'agencia', 'transporte',
--                       'hospedaje', 'artesania', 'movilidad', 'salud',
--                       'actividad'));

-- Agrega el detalle por categoria (estrellas, dificultad, horarios):
--
-- alter table public.services add column if not exists details jsonb;
