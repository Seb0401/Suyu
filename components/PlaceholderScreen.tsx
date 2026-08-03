import Mascot from "@/components/Mascot";

/**
 * Marcador temporal para las rutas que ya viven en la navegacion pero cuya
 * pantalla llega en un commit posterior. Existe para que B2 no deje enlaces
 * rotos; cada pantalla lo reemplaza por su contenido real.
 */
export default function PlaceholderScreen({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <Mascot size={88} />
      <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
      <p className="text-sm text-ink-soft">{note}</p>
    </div>
  );
}
