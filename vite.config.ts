import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Run the `api/` serverless functions inside the Vite dev server.
 *
 * Vite normally serves only the frontend, so `/api/*` would fall through to the
 * SPA and every server-side feature (OpenAI triage, transcription) would appear
 * broken locally even with a valid key in `.env`. `vercel dev` solves this too,
 * but needs an interactive login; this keeps `npm run dev` self-sufficient.
 *
 * The shim adapts Node's req/res to the small slice of the Vercel handler API
 * our functions actually use: req.query, req.body, res.status/json/send/setHeader.
 */
function localApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-api-functions',
    apply: 'serve',
    configureServer(server) {
      // Non-VITE_ vars (e.g. OPENAI_API_KEY) are deliberately not exposed to the
      // client bundle, so surface them to server code via process.env here.
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith('VITE_') && process.env[key] === undefined) {
          process.env[key] = value
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/')) return next()

        const url = new URL(rawUrl, 'http://localhost')
        const routePath = url.pathname.replace(/^\/api\//, '').replace(/\/+$/, '')

        // Map the request path to a handler file, including [id] dynamic segments.
        const segments = routePath.split('/')
        const candidates: string[] = [
          `/api/${routePath}.ts`,
          `/api/${routePath}.tsx`,
          `/api/${routePath}/index.ts`,
        ]
        if (segments.length > 1) {
          const parent = segments.slice(0, -1).join('/')
          candidates.push(`/api/${parent}/[id].ts`, `/api/${parent}/[id].tsx`)
        }

        let mod: any = null
        let matched = ''
        for (const candidate of candidates) {
          try {
            mod = await server.ssrLoadModule(candidate)
            matched = candidate
            break
          } catch {
            /* try the next candidate */
          }
        }

        if (!mod?.default) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `No API handler for ${url.pathname}` }))
          return
        }

        // Collect the body for POSTs.
        let body: any = undefined
        if (req.method && !['GET', 'HEAD'].includes(req.method)) {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          if (raw) {
            try {
              body = JSON.parse(raw)
            } catch {
              body = raw
            }
          }
        }

        // Dynamic segment value, so `[id].ts` handlers see req.query.id.
        const query: Record<string, string> = Object.fromEntries(url.searchParams)
        if (matched.includes('[id]')) query.id = segments[segments.length - 1]

        const shimReq = Object.assign(req, { query, body })
        const shimRes = Object.assign(res, {
          status(code: number) {
            res.statusCode = code
            return shimRes
          },
          json(payload: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
            return shimRes
          },
          send(payload: unknown) {
            if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
              res.end(payload)
            } else {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
            }
            return shimRes
          },
        })

        try {
          await mod.default(shimReq, shimRes)
        } catch (err) {
          server.config.logger.error(`[local-api] ${url.pathname} failed: ${String(err)}`)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Local API handler threw', detail: String(err) }))
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Prefix '' loads every var, including the server-only ones.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localApiPlugin(env)],
  }
})
