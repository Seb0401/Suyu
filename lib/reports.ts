import { getSite } from "@/lib/sites";
import type { AccessibilityReport } from "@/lib/types";

/**
 * Reportes de accesibilidad enviados por viajeros (CLAUDE.md §6.6, §2.1).
 *
 * Mientras Supabase no este conectado (A8) viven en memoria del proceso: se
 * pierden al reiniciar y no se comparten entre instancias. Es una limitacion
 * real, no un detalle — por eso la respuesta siempre declara su `source` y la
 * UI puede avisar que el reporte no se guardo de forma permanente.
 */

export type ReportsSource = "supabase" | "memoria";

/** Motivos cerrados: texto libre sin acotar no se puede agregar ni graficar. */
export const REPORT_ISSUES = [
  "Rampa bloqueada o inexistente",
  "Bano accesible fuera de servicio",
  "Escalones sin alternativa",
  "Piso irregular o resbaladizo",
  "Falta senalizacion",
  "Otro",
] as const;

export type ReportIssue = (typeof REPORT_ISSUES)[number];

const memoryStore: AccessibilityReport[] = [];

export interface NewReport {
  site_id: unknown;
  issue: unknown;
  detail?: unknown;
}

export type ReportValidation =
  | { ok: true; site_id: string; issue: string; detail: string }
  | { ok: false; error: string };

export function validateReport(input: NewReport): ReportValidation {
  const { site_id, issue, detail } = input;

  if (typeof site_id !== "string" || !site_id.trim()) {
    return { ok: false, error: "Falta el sitio del reporte." };
  }
  if (typeof issue !== "string" || !issue.trim()) {
    return { ok: false, error: "Falta el motivo del reporte." };
  }
  if (!REPORT_ISSUES.includes(issue.trim() as ReportIssue)) {
    return { ok: false, error: "Motivo de reporte no reconocido." };
  }

  return {
    ok: true,
    site_id: site_id.trim(),
    issue: issue.trim(),
    // 500 caracteres: suficiente para describir el problema, poco para abusar
    // de un endpoint publico sin autenticacion.
    detail: typeof detail === "string" ? detail.trim().slice(0, 500) : "",
  };
}

/** Costura para A8. */
async function insertReportInDb(
  _report: AccessibilityReport,
): Promise<boolean> {
  return false;
}

async function listReportsFromDb(): Promise<AccessibilityReport[] | null> {
  return null;
}

export async function listReports(
  siteId?: string,
): Promise<{ reports: AccessibilityReport[]; source: ReportsSource }> {
  const rows = await listReportsFromDb();
  const source: ReportsSource = rows ? "supabase" : "memoria";
  const reports = rows ?? memoryStore;

  return {
    reports: siteId ? reports.filter((r) => r.site_id === siteId) : reports,
    source,
  };
}

export async function createReport(
  input: NewReport,
): Promise<
  | { ok: true; report: AccessibilityReport; source: ReportsSource }
  | { ok: false; status: number; error: string }
> {
  const validated = validateReport(input);
  if (!validated.ok) {
    return { ok: false, status: 400, error: validated.error };
  }

  const site = await getSite(validated.site_id);
  if (!site) {
    return { ok: false, status: 404, error: "Sitio desconocido." };
  }

  const report: AccessibilityReport = {
    id: crypto.randomUUID(),
    site_id: site.id,
    site_name: site.name,
    issue: validated.issue,
    detail: validated.detail,
    created_at: new Date().toISOString(),
  };

  const stored = await insertReportInDb(report);
  if (!stored) memoryStore.unshift(report);

  return { ok: true, report, source: stored ? "supabase" : "memoria" };
}
