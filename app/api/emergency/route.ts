import { NextResponse } from "next/server";
import { getContingencies, getEmergencyLines } from "@/lib/emergency";

/**
 * GET /api/emergency
 *
 * Datos locales, sin red. La pantalla que los consume tambien los renderiza
 * desde el servidor, asi que este endpoint existe sobre todo para el copiloto
 * y para el service worker.
 */
export async function GET() {
  return NextResponse.json({
    lines: getEmergencyLines(),
    contingencies: getContingencies(),
    notice:
      "No mostramos el estado de las vías en tiempo real porque no tenemos una fuente confiable para eso. Antes de salir a carretera, confirma con iPerú o con tu hotel.",
  });
}
