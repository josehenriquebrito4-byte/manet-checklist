import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS motoboys (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      valor DECIMAL(10,2),
      data DATE,
      pago BOOLEAN DEFAULT FALSE,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await initTable()
    const result = await pool.query('SELECT * FROM motoboys ORDER BY criado_em DESC')
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function POST(req) {
  const { nome, valor, data } = await req.json()
  try {
    await initTable()
    await pool.query(
      'INSERT INTO motoboys (nome, valor, data) VALUES ($1,$2,$3)',
      [nome, parseFloat(valor), data + 'T12:00:00']
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function PATCH(req) {
  const { nome, pago } = await req.json()
  try {
    await pool.query('UPDATE motoboys SET pago=$1 WHERE nome=$2', [pago, nome])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function DELETE(req) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM motoboys WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}