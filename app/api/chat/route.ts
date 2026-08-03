import { NextResponse } from "next/server";

/**
 * Stub del Commit 0: 503 explicito y honesto.
 *
 * NO devuelve texto simulado que parezca salida de un modelo (CLAUDE.md §2.1).
 * A9 conecta Claude via lib/anthropic.ts; A10 agrega el motor de reglas offline
 * como fallback. Hasta entonces la UI muestra el aviso de modo sin conexion.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "copiloto_no_disponible",
      message:
        "El copiloto todavia no esta conectado. Se implementa en A9 (Claude) y A10 (motor de reglas sin conexion).",
      offline: true,
    },
    { status: 503 },
  );
}
