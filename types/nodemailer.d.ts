declare module 'nodemailer' {
  import { Readable } from 'stream'

  interface Address {
    name: string
    address: string
  }

  interface Attachment {
    filename?: string
    content?: string | Buffer | Readable
    path?: string
    contentType?: string
    cid?: string
    encoding?: string
    headers?: Record<string, string>
  }

  interface SendMailOptions {
    from?: string | Address
    to?: string | Address | Array<string | Address>
    cc?: string | Address | Array<string | Address>
    bcc?: string | Address | Array<string | Address>
    replyTo?: string | Address
    subject?: string
    text?: string | Buffer | Readable
    html?: string | Buffer | Readable
    attachments?: Attachment[]
    headers?: Record<string, string>
  }

  interface SentMessageInfo {
    messageId: string
    accepted: string[]
    rejected: string[]
    pending: string[]
    response: string
    envelope: { from: string; to: string[] }
  }

  interface TransportOptions {
    host?: string
    port?: number
    secure?: boolean
    auth?: { user: string; pass: string }
    authMethod?: string
    ignoreTLS?: boolean
    requireTLS?: boolean
    connectionTimeout?: number
    greetingTimeout?: number
    socketTimeout?: number
    logger?: boolean
    debug?: boolean
  }

  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>
    close(): void
    verify(): Promise<boolean>
  }

  function createTransport(transport: TransportOptions | string, defaults?: Partial<SendMailOptions>): Transporter
  function createTransport(transport: any, defaults?: Partial<SendMailOptions>): Transporter

  export = { createTransport }
}
