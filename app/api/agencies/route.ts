import { NextResponse } from "next/server";
import { getPartnerAgencies } from "@/lib/agencies";

/**
 * GET /api/agencies
 *
 * `disclaimer` viaja en la respuesta a proposito: la UI no puede mostrar este
 * directorio sin decir de donde salen los datos (§6.10).
 */
export async function GET() {
  return NextResponse.json({
    agencies: getPartnerAgencies(),
    disclaimer:
      "Directorio informativo. No tenemos convenio ni comision con estas agencias, y no verificamos sus calificaciones de forma independiente. Confirma precios y condiciones antes de reservar.",
  });
}
