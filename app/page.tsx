import Logo from "@/components/Logo";
import Mascot from "@/components/Mascot";

/*
 * Portada minima para dejar el sistema de diseño verificable a ojo en B1.
 * El Inicio real (hero con buscador, carrusel, accesos rapidos) llega en B4.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
      <Logo size="lg" withTagline />

      <div className="andean-band w-full rounded-full" />

      <section className="w-full rounded-3xl border border-sand-200 bg-sand-50 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Mascot size={72} />
          <div>
            <p className="font-bold text-ink">¡Hola, viajero!</p>
            <p className="text-sm text-ink-soft">
              Pronto vas a poder buscar rutas accesibles por Arequipa.
            </p>
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          className="rounded-full bg-clay-600 px-6 py-3 font-bold text-cream"
        >
          Buscar ruta accesible
        </button>
        <button
          type="button"
          className="rounded-full bg-forest-700 px-6 py-3 font-bold text-cream"
        >
          Iniciar ruta
        </button>
      </div>
    </main>
  );
}
