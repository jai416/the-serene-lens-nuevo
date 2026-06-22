type ResendClient = {
  emails: {
    send: (payload: {
      from: string
      to: string
      subject: string
      html: string
    }) => Promise<unknown>
  }
}

let resend: ResendClient | null = null

async function getResend(): Promise<ResendClient | null> {
  if (resend !== undefined) return resend
  if (!process.env.RESEND_API_KEY) {
    resend = null
    return null
  }
  try {
    const { Resend } = await import("resend")
    resend = new Resend(process.env.RESEND_API_KEY) as unknown as ResendClient
  } catch {
    resend = null
  }
  return resend
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const client = await getResend()
  if (!client) {
    console.log("--- PASSWORD RESET (no email service configured) ---")
    console.log(`To: ${email}`)
    console.log(`Reset link: ${resetUrl}`)
    console.log("---")
    return { ok: true, devUrl: resetUrl }
  }

  await client.emails.send({
    from: "The Serene Lens <noreply@theserenelens.com>",
    to: email,
    subject: "Recupera tu contraseña - The Serene Lens",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #2F3A2D; margin: 0;">Recupera tu contraseña</h2>
        </div>
        <p style="font-size: 14px; color: #64705E; line-height: 1.6; margin: 0 0 24px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva contraseña.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #C2E09D; color: #2F3A2D; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 32px; border-radius: 12px;">
          Restablecer contraseña
        </a>
        <p style="font-size: 12px; color: #8A9A82; line-height: 1.5; margin-top: 24px;">
          Si no solicitaste este cambio, ignora este mensaje. El enlace expira en 1 hora.
        </p>
      </div>
    `,
  })

  return { ok: true }
}
