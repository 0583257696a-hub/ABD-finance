// Ambient type for the Cloudflare Workers "Send Email" runtime built-in module.
// Only resolvable inside the actual Workers runtime (workerd) — never bundled by
// webpack/Turbopack, see the `cloudflare:email` externals entry in next.config.ts.
declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(from: string, to: string, raw: string)
  }
}
