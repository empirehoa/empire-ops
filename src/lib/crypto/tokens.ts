import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM. TOKEN_ENCRYPTION_KEY is 32 random bytes, base64-encoded
// (generate with `openssl rand -base64 32`). Output: iv.tag.ciphertext, base64url.

function key(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is not set')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  return buf
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, enc].map((b) => b.toString('base64url')).join('.')
}

export function decryptToken(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64url'))
  if (!iv || !tag || !enc) throw new Error('Malformed encrypted token')
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
