# Suyu — Tu compañero de viaje inteligente para Arequipa
### Plan de proyecto | TURISTON: Hackathon de Innovación Turística (3-4 agosto 2026)

> *Suyu* significa "región, territorio" en quechua — es la raíz de *Tawantinsuyu*, las cuatro regiones del imperio inca. Nombra el territorio que la app te ayuda a recorrer y conecta con el eje de cultura y saberes ancestrales.
> **Nombre definitivo.**

---

## 1. Resumen ejecutivo

Suyu es una app que actúa como compañero de viaje inteligente para turistas en Arequipa. Su función central es generar **rutas accesibles en tiempo real** (rampas, baños, pendientes, descansos) hacia los principales atractivos turísticos, y se complementa con un **copiloto conversacional (IA real vía API de Claude)** que arma itinerarios personalizados, y un **recomendador anti-aforo** que sugiere alternativas cuando un sitio está saturado.

El objetivo es demostrar cómo una sola plataforma puede cubrir simultáneamente accesibilidad, personalización, gestión basada en datos y tecnología — los ejes donde el modelo DTI-SEGITTUR pide mayor énfasis.

---

## 2. Problema y contexto

- Arequipa recibe turistas con necesidades muy diversas (movilidad reducida, familias con niños, adultos mayores, viajeros con tiempo limitado), pero la información sobre accesibilidad real de los atractivos (Santa Catalina, Yanahuara, Plaza de Armas, Valle del Colca) es escasa, dispersa o inexistente en fuentes digitales.
- No hay manera de saber en tiempo real si un sitio está congestionado antes de llegar, lo que genera mala experiencia y sobrecarga en los puntos más populares.
- Los operadores turísticos pequeños no tienen visibilidad de estos datos para adaptar su oferta.

*(Este bloque responde directamente al criterio "Problemática y contexto" — 30% del puntaje de inscripción. Conviene reforzarlo con 1-2 datos o testimonios reales antes de inscribirse.)*

---

## 3. Público objetivo

| Segmento | Necesidad que resolvemos |
|---|---|
| Turistas con discapacidad física o movilidad reducida | Saber de antemano qué rutas son accesibles |
| Familias, adultos mayores, turistas con poco tiempo | Itinerarios personalizados y realistas |
| Turistas en general | Evitar aglomeraciones, optimizar el día |
| Operadores turísticos y Municipalidad (usuarios secundarios) | Datos agregados de afluencia y accesibilidad |

---

## 4. Propuesta de valor

**"Un compañero de viaje que conoce Arequipa mejor que una guía impresa: te lleva por el camino accesible, ajusta tu plan según el clima y la afluencia, y te habla en lenguaje natural."**

*(Responde al criterio "Propuesta inicial de valor" — 25%. No hace falta tenerla resuelta al 100%, pero sí mostrar el ángulo de abordaje.)*

---

## 5. Alineación con el modelo DTI y problemáticas TURISTON

| Funcionalidad | Problemática TURISTON | Eje DTI |
|---|---|---|
| Rutas accesibles en tiempo real (**CORE**) | (1) Turismo accesible | Accesibilidad |
| Copiloto conversacional con IA | (2) Personalización de la experiencia | Innovación, Tecnología |
| Recomendador anti-aforo | (4) Gestión basada en datos | Tecnología |
| Módulo de servicios turísticos (si el tiempo alcanza) | (3) Digitalización de servicios turísticos | Gobernanza, Tecnología |

Cubrir 3-4 problemáticas con una sola plataforma coherente es un argumento fuerte para el pitch, pero **no fuerces la cuarta si resta tiempo al core**.

---

## 6. Funcionalidades del MVP

### 6.1 Core (debe funcionar sí o sí el Día 2)
- **Buscador de ruta accesible**: el usuario elige origen/destino entre un set curado de atractivos (ver 8.2) y la app devuelve una ruta con anotaciones de accesibilidad (rampas, escalones, baños accesibles, zonas de descanso).
- **Mapa con capas de accesibilidad** sobre esos puntos.

### 6.2 Complementarias (agregan valor, con IA real)
- **Copiloto conversacional (API de Claude)**: chat donde el usuario escribe en lenguaje natural ("necesito una ruta sin escalones y con baño cerca" o "arma mi tarde de hoy, tengo 3 horas y me interesa la cultura") y la IA arma el plan usando los datos de accesibilidad + intereses.
- **Recomendador anti-aforo**: si un punto está marcado como "saturado" (dato simulado o manual para el demo), la IA sugiere una alternativa cercana con lógica similar (ej. mirador alterno si Yanahuara está lleno).

### 6.3 Nice-to-have (solo si sobra tiempo)
- Ficha de servicios turísticos cercanos a la ruta (restaurantes, guías formalizados) — conecta con la problemática de digitalización y seguridad/formalización.

**Regla de oro para 2 días: el jurado prefiere un core sólido y bien demostrado sobre 4 features a medias.**

---

## 7. Arquitectura técnica y stack (propuesta — ajustar según lo que domine el equipo)

- **Frontend**: Web app (React o Next.js) — más rápido de deployar y demostrar en vivo que una app móvil nativa en 2 días. Responsive para que se vea bien en celular durante el pitch.
- **Mapas/rutas**: Google Maps API o Mapbox (rutas + capas custom de accesibilidad).
- **IA conversacional**: Anthropic API (Claude) para el copiloto e interpretación de intenciones/lenguaje natural.
- **Backend**: Node/Express simple o funciones serverless — solo lo necesario para servir los datos curados y hacer de puente con la API de Claude.
- **Datos**: JSON/base de datos ligera (ej. Supabase o Firebase) con la información de accesibilidad y aforo simulado.

> Si alguien del equipo ya domina otro stack (Flutter, Vue, etc.), prioricen velocidad de desarrollo sobre "lo ideal".

---

## 8. Datos: estrategia para el demo

Un dataset real y crowdsourced de accesibilidad no existe hoy, así que para el hackathon:

### 8.1 Estrategia
- Curar manualmente datos de accesibilidad para **4-6 sitios piloto** (no intentar cubrir toda la ciudad).
- Presentar esto como el punto de partida de un sistema que a futuro se alimenta de forma **colaborativa** (usuarios y municipalidad validan/actualizan la información) — esto conecta con la problemática de "Gestión basada en datos" y le da al jurado una visión de escalabilidad.
- El aforo puede simularse con datos de ejemplo (ej. "alta/media/baja afluencia" por franja horaria) — ser transparentes en el pitch de que es data simulada para el demo, con plan real de integración (sensores, check-ins, alianzas con los sitios) post-hackathon.

### 8.2 Sitios piloto sugeridos (ajustar según lo que decidan)
- Monasterio de Santa Catalina
- Mirador de Yanahuara
- Plaza de Armas de Arequipa
- Valle del Colca (al menos un punto, ej. Cruz del Cóndor)
- 1-2 sitios adicionales si da tiempo

---

## 9. Plan de trabajo por día

### Día 1 (3 de agosto, 8:00am – 7:00pm) — Diagnóstico y construcción del core

| Hora aprox. | Actividad |
|---|---|
| 8:00 – 10:00 | Diagnóstico final: validar problemática con mentores, definir alcance exacto del MVP |
| 10:00 – 12:00 | Curar datos de accesibilidad de los sitios piloto + definir arquitectura técnica |
| 12:00 – 13:00 | Almuerzo / setup de repositorio y entorno |
| 13:00 – 17:00 | Desarrollo del core: buscador de ruta accesible + mapa |
| 17:00 – 19:00 | Primeras pruebas internas + ajustes con feedback de mentores |

### Día 2 (4 de agosto, 8:00am – 1:00pm) — Complementos, mentoría y pitch

| Hora aprox. | Actividad |
|---|---|
| 8:00 – 9:30 | Integrar copiloto con API de Claude + recomendador anti-aforo |
| 9:30 – 10:30 | Mentoría técnica: pulir demo, resolver bugs críticos |
| 10:30 – 11:15 | Ensayar el pitch (ver estructura en sección 11) |
| 11:15 – 12:00 | Últimos ajustes visuales/UX del demo |
| 12:00 – 1:00 | Presentación final (pitch) y premiación |

---

## 10. Roles sugeridos del equipo (3-5 personas)

- **Dev frontend/UX**: pantallas, mapa, experiencia de usuario.
- **Dev backend/IA**: integración con API de Claude, lógica de rutas y recomendaciones.
- **Data/investigación**: curaduría de datos de accesibilidad, validación de la problemática con mentores.
- **Producto/pitch**: arma la narrativa, coordina tiempos, prepara la presentación final.

*(En equipos de 3, se combinan roles; en equipos de 5, se puede sumar un segundo dev o un diseñador dedicado.)*

---

## 11. Estructura sugerida del pitch final

Alineada a los criterios de evaluación del punto 6.2 del documento de TURISTON:

1. **Problema y usuario** (comprensión de la problemática) — 1 min: la falta de información de accesibilidad real en Arequipa, con un caso concreto.
2. **Demo en vivo** (creatividad y desarrollo de la solución) — 2-3 min: mostrar la ruta accesible, el copiloto respondiendo en lenguaje natural, y la sugerencia anti-aforo.
3. **Encaje con el modelo DTI** (impacto y aplicabilidad) — 1 min: mostrar la tabla de la sección 5, explicando cómo una sola solución cubre varios ejes.
4. **Viabilidad** — 1 min: qué tan fácil es escalar los datos (crowdsourcing, alianzas con Municipalidad/MINCETUR/operadores), y qué se necesitaría para producción real.
5. **Cierre claro** — 30 seg: quiénes son, qué construyeron en 2 días, y el llamado a acción (banco de soluciones, siguiente paso).

**Tip**: practicar el timing — la claridad de la presentación es un criterio explícito de evaluación.

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Poco tiempo para cubrir muchos sitios con datos reales | Limitarse a 4-6 sitios piloto curados a mano |
| Fallos de la API de Claude en vivo durante el pitch | Tener un video/grabación de respaldo del demo funcionando |
| Scope creep (querer meter las 4 funcionalidades) | Congelar el core al final del Día 1; lo demás es opcional |
| Datos de aforo simulados generan preguntas del jurado | Ser transparentes: explicarlo como paso 1 de un roadmap de datos reales |

---

## 13. Visión de escalamiento post-hackathon

- Integrar el banco de soluciones de TURISTON como validación institucional (Municipalidad, MINCETUR).
- Pasar de datos curados a un modelo de **crowdsourcing verificado** (usuarios y operadores actualizan accesibilidad y aforo).
- Explorar alianzas con sitios turísticos para sensores/check-ins reales de aforo.
- Vincular con incubadoras (beneficio para equipos finalistas) para llevar el prototipo a un producto real.

---

## 14. Estado final: qué se construyó realmente

Este documento describe el plan **antes** de empezar a construir. El core (§6.1)
y las complementarias (§6.2) se cerraron con margen de tiempo, así que el
alcance final terminó siendo más amplio que "nice-to-have solo si sobra
tiempo" (§6.3 original). Lo que se agregó, más allá del plan de este documento:

- **Fichas técnicas por sitio** ("Conoce más"): historia, dato curioso, mejor
  momento para visitar — pensado para generar curiosidad antes de llegar, no
  solo resolver el trayecto.
- **Historias de viajeros**: un blog curado por el equipo (no un sistema de
  comentarios de usuarios sin moderar) con experiencias reales por sitio.
- **Directorio de agencias de turismo aliadas**: para que el turista compare el
  itinerario armado por Suyu contra tours ya existentes de operadores reales
  de Arequipa (Arequipa Tours Perú, Pablo Tour, Giardino Tours, Chacu Travel),
  con honestidad explícita sobre qué se pudo verificar de cada una y qué no.
- **Modo oscuro** con toggle manual persistente, aplicado a todos los tokens de
  color de la app (incluida la paleta de aforo, recalibrada por separado para
  el tema oscuro).
- **Mascota con 12 estados ilustrados** (antes era un solo dibujo vectorial):
  cambia de expresión según el contexto, sobre todo en el copiloto, donde
  reacciona a si la pregunta es un saludo, sobre una ruta, sobre aforo, etc.

El detalle técnico completo de todo esto vive en `CLAUDE.md` (§1.1 en adelante)
y el plan de commits para reconstruirlo está en `docs/PLAN-EQUIPO.md` §6.1. Si
alguien quiere reconstruir la app **completa** desde cero — no solo el MVP de
este plan — la guía es `docs/REPLICA-DESDE-CERO.md`.

---

*Documento vivo — ajustar según lo que se valide con mentores durante el Día 1.*
