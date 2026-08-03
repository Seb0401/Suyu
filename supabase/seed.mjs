/**
 * Carga data/seed-sites.json y data/seed-services.json a Supabase.
 *
 *   npm run seed:supabase
 *
 * Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
 * Usa upsert: se puede correr las veces que haga falta sin duplicar filas.
 *
 * El orden importa: services tiene FK a sites.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

async function loadEnvLocal() {
  try {
    const raw = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, value] = match;
      if (!process.env[key]) process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  } catch {
    // Sin .env.local seguimos: las variables pueden venir del entorno.
  }
}

async function readJson(name) {
  const raw = await readFile(new URL(`../data/${name}`, import.meta.url), "utf8");
  return JSON.parse(raw);
}

async function main() {
  await loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Copia .env.local.example a .env.local y llenalos.",
    );
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  const sites = await readJson("seed-sites.json");
  const { error: sitesError } = await db
    .from("sites")
    .upsert(sites, { onConflict: "id" });

  if (sitesError) {
    console.error("Error cargando sites:", sitesError.message);
    process.exit(1);
  }
  console.log(`sites: ${sites.length} filas`);

  const services = await readJson("seed-services.json");
  const { error: servicesError } = await db
    .from("services")
    .upsert(services, { onConflict: "id" });

  if (servicesError) {
    console.error("Error cargando services:", servicesError.message);
    console.error(
      "Si menciona el check constraint de category, ejecuta el bloque de " +
        "MIGRACION al final de supabase/schema.sql.",
    );
    process.exit(1);
  }
  console.log(`services: ${services.length} filas`);
}

main();
