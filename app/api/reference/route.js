import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(req) {
  const { key, imageBase64, mimeType } = await req.json()

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referencias (
        key VARCHAR(50) PRIMARY KEY,
        image_base64 TEXT NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await pool.query(`
      INSERT INTO referencias (key, image_base64, mime_type, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE
      SET image_base64 = $2, mime_type = $3, updated_at = NOW()
    `, [key, imageBase64, mimeType])

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!key) {
    try {
      const result = await pool.query('SELECT key FROM referencias')
      return NextResponse.json({ ok: true, keys: result.rows.map(r => r.key) })
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message })
    }
  }

  try {
    const result = await pool.query(
      'SELECT image_base64, mime_type FROM referencias WHERE key = $1',
      [key]
    )

    if (result.rows.length === 0) return NextResponse.json({ ok: false })

    return NextResponse.json({
      ok: true,
      imageBase64: result.rows[0].image_base64,
      mimeType: result.rows[0].mime_type
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}