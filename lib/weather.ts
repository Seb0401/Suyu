/**
 * Clima (Fase 2).
 *
 * Open-Meteo: gratis, sin API key, sin registro. Se eligio sobre OpenWeather
 * justamente por no tener key — una key mas es una cosa mas que puede fallar
 * el dia del pitch (cuota, variable mal puesta en Vercel, cuenta sin
 * verificar), y el clima no justifica ese riesgo.
 *
 * Sin red cae a las normales climaticas de Arequipa curadas a mano, marcadas
 * como aproximadas. La app sigue diciendo algo util y declara que no es el
 * pronostico de hoy (§2.1).
 */

const API = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 4000;
const FORECAST_DAYS = 5;

export type WeatherSource = "open-meteo" | "normales";

export interface DayForecast {
  date: string;
  /** Codigo WMO. Se traduce a texto; nunca se muestra crudo. */
  code: number;
  label: string;
  temp_max: number;
  temp_min: number;
  /** Probabilidad de lluvia 0-100. null cuando venimos de normales. */
  rain_chance: number | null;
}

export interface WeatherResult {
  current: { temp: number; label: string } | null;
  days: DayForecast[];
  source: WeatherSource;
  /** Texto que la UI esta obligada a mostrar cuando source es "normales". */
  notice: string | null;
  /** Consejo derivado del pronostico, para la pantalla del sitio. */
  advice: string | null;
}

/** Codigos WMO agrupados. Arequipa casi no ve nieve, pero el rango existe. */
function labelFor(code: number): string {
  if (code === 0) return "Despejado";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Neblina";
  if (code <= 57) return "Llovizna";
  if (code <= 67) return "Lluvia";
  if (code <= 77) return "Nieve";
  if (code <= 82) return "Chubascos";
  return "Tormenta";
}

/**
 * Normales de Arequipa curadas a mano. La ciudad es de las mas secas del
 * mundo habitado: la temporada de lluvias es corta (enero a marzo) y el resto
 * del ano es sol casi garantizado.
 */
const NORMALS: Record<number, { max: number; min: number; label: string }> = {
  0: { max: 21, min: 9, label: "Lluvia ocasional" },
  1: { max: 21, min: 9, label: "Lluvia ocasional" },
  2: { max: 21, min: 8, label: "Lluvia ocasional" },
  3: { max: 22, min: 7, label: "Despejado" },
  4: { max: 22, min: 6, label: "Despejado" },
  5: { max: 22, min: 5, label: "Despejado" },
  6: { max: 21, min: 4, label: "Despejado" },
  7: { max: 21, min: 4, label: "Despejado" },
  8: { max: 22, min: 5, label: "Despejado" },
  9: { max: 22, min: 6, label: "Despejado" },
  10: { max: 22, min: 7, label: "Despejado" },
  11: { max: 22, min: 8, label: "Despejado" },
};

function fromNormals(): WeatherResult {
  const today = new Date();
  const days: DayForecast[] = [];

  for (let i = 0; i < FORECAST_DAYS; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const n = NORMALS[d.getMonth()];
    days.push({
      date: d.toISOString().slice(0, 10),
      code: n.label === "Despejado" ? 0 : 61,
      label: n.label,
      temp_max: n.max,
      temp_min: n.min,
      rain_chance: null,
    });
  }

  return {
    current: null,
    days,
    source: "normales",
    notice:
      "Sin conexión: mostramos el clima típico de Arequipa para esta época, no el pronóstico de hoy.",
    advice: null,
  };
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

/**
 * Consejo derivado del pronostico. Solo se emite cuando hay algo que decir:
 * un "hará buen tiempo" en una ciudad con 300 dias de sol es ruido.
 */
function adviceFor(days: DayForecast[]): string | null {
  const today = days[0];
  if (!today) return null;

  if ((today.rain_chance ?? 0) >= 60) {
    return "Alta probabilidad de lluvia hoy. Las calles de sillar se ponen resbalosas y los recorridos al aire libre se complican, sobre todo en silla de ruedas.";
  }
  if (today.temp_min <= 6) {
    return "Amanece frío. Si vas al Colca o a un mirador temprano, abrígate: a esa altura la sensación es bastante menor.";
  }
  if (today.temp_max >= 24) {
    // Sin nombrar una altitud concreta: el mismo consejo se emite para el
    // centro (2300 m) y para la Cruz del Condor (3270 m), y afirmar la de
    // Arequipa en la ficha del Colca seria decir algo falso.
    return "Día caluroso y con sol fuerte. Estás en altura y la radiación pega más de lo que parece: bloqueador, sombrero y agua.";
  }
  return null;
}

export async function getWeather(
  lat: number,
  lng: number,
): Promise<WeatherResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "America/Lima",
    forecast_days: String(FORECAST_DAYS),
  });

  try {
    const response = await fetch(`${API}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // El pronostico no cambia cada minuto; una hora de cache evita castigar
      // a Open-Meteo y acelera la pantalla.
      next: { revalidate: 3600 },
    });
    if (!response.ok) return fromNormals();

    const data = (await response.json()) as OpenMeteoResponse;
    const d = data.daily;
    if (!d?.time?.length || !d.temperature_2m_max || !d.temperature_2m_min) {
      return fromNormals();
    }

    const days: DayForecast[] = d.time.map((date, i) => {
      const code = d.weather_code?.[i] ?? 0;
      return {
        date,
        code,
        label: labelFor(code),
        temp_max: Math.round(d.temperature_2m_max![i]),
        temp_min: Math.round(d.temperature_2m_min![i]),
        rain_chance: d.precipitation_probability_max?.[i] ?? null,
      };
    });

    return {
      current:
        typeof data.current?.temperature_2m === "number"
          ? {
              temp: Math.round(data.current.temperature_2m),
              label: labelFor(data.current.weather_code ?? 0),
            }
          : null,
      days,
      source: "open-meteo",
      notice: null,
      advice: adviceFor(days),
    };
  } catch {
    // Timeout, DNS, servicio caido: todo termina en las normales.
    return fromNormals();
  }
}
