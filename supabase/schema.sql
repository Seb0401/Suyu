-- Esquema de Suyu (CLAUDE.md §6.2)
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo
-- sin romper nada.
--
-- Que NO vive aqui y es a proposito: site_details, stories, agencies y
-- site-accessibility. Son contenido editorial que el equipo escribe una vez, no
-- datos operativos que cambien en produccion. Viven como JSON curado en data/.
--
-- La seccion del final ("estado de accesibilidad") es la unica excepcion
-- prevista: si algun dia el equipo quiere editar las calificaciones 1-3 desde
-- el dashboard en vez de un JSON, esa tabla ya esta escrita.

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
-- passport_stamps — Pasaporte Arequipeño (CLAUDE.md §6.x).
--
-- Una estampa por sitio y usuario, ganada solo tras pasar una geocerca GPS
-- server-side (lib/passport.ts). Es permanente por diseño (como un sello real
-- de pasaporte): no hay UPDATE ni DELETE en el codigo de la app.
--
-- El insert/select real de la app pasa por el cliente de service role
-- (getSupabaseAdmin(), ver lib/passport.ts) despues de verificar el JWT en
-- codigo, asi que estas policies NO son la barrera que protege el endpoint:
-- son defensa en profundidad para un eventual acceso directo a la base.
-- ---------------------------------------------------------------------------

create table if not exists public.passport_stamps (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  site_id               text not null references public.sites(id) on delete cascade,
  accessibility_rating  smallint not null check (accessibility_rating between 1 and 5),
  review                text not null default '',
  photo_path            text,
  -- Ubicacion del check-in y distancia calculada al sitio: prueba de que la
  -- geocerca se evaluo, y permite recalibrar el radio despues sin migrar.
  lat                   double precision not null,
  lng                   double precision not null,
  distance_m            double precision not null,
  created_at            timestamptz not null default now(),
  constraint passport_stamps_one_per_site unique (user_id, site_id)
);

create index if not exists passport_stamps_user_idx
  on public.passport_stamps (user_id, created_at desc);

alter table public.passport_stamps enable row level security;

drop policy if exists "estampas propias lectura" on public.passport_stamps;
create policy "estampas propias lectura"
  on public.passport_stamps for select using (auth.uid() = user_id);

drop policy if exists "estampas propias escritura" on public.passport_stamps;
create policy "estampas propias escritura"
  on public.passport_stamps for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- passport-photos — bucket de fotos del check-in.
--
-- Lectura publica (son fotos de lugares turisticos publicos, no hay dato
-- sensible), pero SIN policy de insert para anon/authenticated: la unica
-- escritura es server-side con la service role key (bypassea RLS), asi que
-- el default-deny de storage ya es correcto tal cual.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('passport-photos', 'passport-photos', true)
on conflict (id) do nothing;

drop policy if exists "passport-photos lectura publica" on storage.objects;
create policy "passport-photos lectura publica"
  on storage.objects for select
  using (bucket_id = 'passport-photos');

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

-- Beneficios reales del pasaporte (hoy son simulados, ver lib/passportUi.ts).
-- El beneficio se gana por NIVEL (1/3/6 estampas), no por estampa individual,
-- asi que no es una columna en passport_stamps: cuando se implemente de
-- verdad, es una tabla nueva:
--
-- create table public.passport_tier_rewards (
--   user_id       uuid not null references auth.users(id) on delete cascade,
--   tier          text not null,
--   discount_code text not null,
--   issued_at     timestamptz not null default now(),
--   primary key (user_id, tier)
-- );

-- Agrega el detalle por categoria (estrellas, dificultad, horarios):
--
-- alter table public.services add column if not exists details jsonb;

-- ---------------------------------------------------------------------------
-- site_accessibility — estado de los servicios de accesibilidad (escala 1-3)
-- ---------------------------------------------------------------------------
--
-- Complementa los booleanos has_* de sites, no los reemplaza: el booleano dice
-- si el rasgo EXISTE y esta tabla dice COMO esta. La diferencia no es teorica —
-- el Museo Santuarios Andinos declara bano adaptado, pero la puerta mide menos
-- de 78 cm y no tiene barras de apoyo. Existe y no sirve.
--
-- Hoy la fuente es data/site-accessibility.json; esta tabla existe para cuando
-- el equipo quiera editarlo desde el dashboard.

create table if not exists public.site_accessibility (
  site_id text primary key references public.sites (id) on delete cascade,

  -- 1 = deficiente, 2 = utilizable con apoyo, 3 = en buen estado.
  -- NULL = sin dato. Nunca se asume un 2 por defecto.
  ramps_rating                   smallint check (ramps_rating between 1 and 3),
  ramps_note                     text not null default '',
  accessible_bathroom_rating     smallint check (accessible_bathroom_rating between 1 and 3),
  accessible_bathroom_note       text not null default '',
  rest_areas_rating              smallint check (rest_areas_rating between 1 and 3),
  rest_areas_note                text not null default '',
  wheelchair_circulation_rating  smallint check (wheelchair_circulation_rating between 1 and 3),
  wheelchair_circulation_note    text not null default '',

  -- Bano familiar / cambiador. Servicio DISTINTO del bano adaptado para
  -- personas con discapacidad: mezclarlos haria que un padre y un usuario de
  -- silla de ruedas lean la misma etiqueta esperando cosas distintas.
  -- NULL = sin dato.
  has_family_bathroom            boolean,
  family_bathroom_note           text not null default '',

  -- Politica de mascotas del sitio. NO alcanza al perro guia: la Ley 29830
  -- garantiza su acceso aunque el lugar no admita mascotas, asi que ese caso
  -- no se modela como un campo por sitio.
  pet_policy                     text not null default 'sin-dato'
    check (pet_policy in ('permitidas', 'no-permitidas', 'sin-dato')),
  pet_note                       text not null default '',

  source_label                   text not null default 'Sin fuente',
  source_url                     text,
  updated_at                     timestamptz not null default now()
);

alter table public.site_accessibility enable row level security;

drop policy if exists "site_accessibility lectura publica" on public.site_accessibility;
create policy "site_accessibility lectura publica"
  on public.site_accessibility for select using (true);
