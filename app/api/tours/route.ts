import { NextResponse } from "next/server";
import { USD_REFERENCE_NOTE, getTourGroups } from "@/lib/tours";

/**
 * GET /api/tours?destination=<destino>
 *
 * Planes agrupados por destino. `disclaimer` y `exchange_note` viajan en la
 * respuesta porque la UI no puede mostrar precios sin decir de cuando son ni a
 * que tipo de cambio se convirtieron.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination") ?? undefined;

  return NextResponse.json({
    groups: getTourGroups({ destination }),
    exchange_note: USD_REFERENCE_NOTE,
    disclaimer:
      "Precios 'desde' publicados por los operadores en la fecha indicada, no cotizaciones que hayamos pedido. Cambian por temporada, tamaño de grupo y tipo de cambio. Confirma con la agencia antes de reservar.",
  });
}
