import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    await pool.query('DELETE FROM motoboys')
    await pool.query('DELETE FROM descontos')
    return NextResponse.json({ ok: true, message: 'Dados limpos!' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}