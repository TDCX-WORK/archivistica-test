import fs from 'fs'

// Leer .env.local
const raw = fs.readFileSync('.env.local', 'utf-8')
const line = raw.split('\n').find(l => l.startsWith('ANTHROPIC_API_KEY='))
let key = line ? line.replace('ANTHROPIC_API_KEY=', '').replace(/\r/g, '').trim() : ''
key = key.replace(/^['"]|['"]$/g, '')

console.log('Longitud:', key.length)
console.log('Inicio:  ', key.slice(0, 14) + '...')
console.log('¿sk-ant?:', key.startsWith('sk-ant'))

const r = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
  body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'hola' }] })
})
console.log('Status API:', r.status, r.ok ? '✅ KEY VÁLIDA' : '❌ KEY INVÁLIDA')
if (!r.ok) console.log(await r.text())
