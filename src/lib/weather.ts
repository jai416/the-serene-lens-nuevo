import { captureError } from "./sentry"

const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
const BASE_URL = "https://api.openweathermap.org/data/2.5"

export interface WeatherData {
  temp: number
  condition: string
  humidity: number
  description: string
  icon: string
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData | null> {
  if (!API_KEY) return null
  try {
    const res = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    }
  } catch (e) {
    captureError(e, { context: "weather.getWeather" })
    return null
  }
}

export function getSeason(lat: number): "seca" | "lluviosa" {
  const month = new Date().getMonth() + 1
  if (lat >= 0) {
    return month >= 5 && month <= 10 ? "lluviosa" : "seca"
  }
  return month >= 11 || month <= 4 ? "lluviosa" : "seca"
}

export function buildClimateContext(lat?: number | null, lon?: number | null, userClimate?: string | null): string {
  if (lat != null && lon != null) {
    return `Clima: Tropical (estación ${getSeason(lat)}).`
  }
  if (userClimate) {
    return `Clima: ${userClimate}.`
  }
  return "Clima: Tropical húmedo (predeterminado)."
}
