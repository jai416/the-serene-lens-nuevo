import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, unauthorized, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { getWeather } from "@/lib/weather"

export const dynamic = "force-dynamic"

const HUMIDITY_THRESHOLD = 20
const TEMP_THRESHOLD = 5

function buildAlert(humidityChange: number, tempChange: number): string | null {
  if (humidityChange > HUMIDITY_THRESHOLD) {
    return `🌤 La humedad ha subido un ${Math.round(humidityChange)}%. Recuerda usar un hidratante más ligero hoy y ajustar tu rutina.`
  }
  if (humidityChange < -HUMIDITY_THRESHOLD) {
    return `🌤 La humedad ha bajado un ${Math.round(Math.abs(humidityChange))}%. Tu piel puede sentirse más seca. Aumenta la hidratación con ácido hialurónico y crema nutritiva.`
  }
  if (tempChange > TEMP_THRESHOLD) {
    return `🌡 La temperatura subió ${Math.round(tempChange)}°C hoy. Usa protector solar SPF 50+ y mantén tu piel fresca con texturas ligeras.`
  }
  if (tempChange < -TEMP_THRESHOLD) {
    return `🌡 Hace ${Math.round(Math.abs(tempChange))}°C menos hoy. Tu piel puede resentirse con el frío. Añade una capa extra de hidratación y protector solar.`
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) return unauthorized()

    const users = await db.user.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        reminders: { some: { enabled: true } },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        name: true,
        telegramId: true,
      },
    })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    let notified = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    for (const user of users) {
      try {
        const currentWeather = await getWeather(user.latitude!, user.longitude!)
        if (!currentWeather) continue

        // Get yesterday's weather from DB log
        const prevLog = await db.weatherLog.findUnique({
          where: { userId_date: { userId: user.id, date: yesterday } },
        })

        // Log today's weather
        await db.weatherLog.upsert({
          where: { userId_date: { userId: user.id, date: today } },
          update: {
            humidity: currentWeather.humidity,
            temp: currentWeather.temp,
            condition: currentWeather.condition,
          },
          create: {
            userId: user.id,
            date: today,
            humidity: currentWeather.humidity,
            temp: currentWeather.temp,
            condition: currentWeather.condition,
          },
        })

        if (!prevLog) continue

        const humidityChange = prevLog.humidity != null
          ? currentWeather.humidity - prevLog.humidity
          : 0
        const tempChange = prevLog.temp != null
          ? currentWeather.temp - prevLog.temp
          : 0

        const message = buildAlert(humidityChange, tempChange)
        if (!message) continue

        // Save in-app notification
        await db.notification.create({
          data: {
            userId: user.id,
            title: "Cambio climático detected",
            message,
            link: "/dashboard/history",
          },
        })

        // Send Telegram if available
        if (user.telegramId && botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: user.telegramId,
              text: `${message}\n\n— The Serene Lens`,
              parse_mode: "HTML",
            }),
            signal: AbortSignal.timeout(5000),
          }).catch((e) => logger.error("Telegram msg failed", { error: e }))
        }

        notified++
      } catch (e) {
        logger.error("Weather alert failed for user", {
          userId: user.id,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    logger.info("Weather alerts processed", { total: users.length, notified })
    return ok({ total: users.length, notified })
  } catch (e) {
    logger.error("Weather alert cron error:", {
      error: e instanceof Error ? e.message : String(e),
    })
    return error("Error interno", 500)
  }
}