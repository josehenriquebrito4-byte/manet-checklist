import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referencias (
        key VARCHAR(50) PRIMARY KEY,
        image_base64 TEXT NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true, message: 'Tabela criada!' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}