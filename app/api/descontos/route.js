import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS descontos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      valor DECIMAL(10,2),
      motivo VARCHAR(200) DEFAULT '',
      data DATE,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await initTable()
    const result = await pool.query('SELECT * FROM descontos ORDER BY criado_em DESC')
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function POST(req) {
  const { nome, valor, motivo, data } = await req.json()
  try {
    await initTable()
    await pool.query(
      'INSERT INTO descontos (nome, valor, motivo, data) VALUES ($1,$2,$3,$4)',
      [nome, parseFloat(valor), motivo || '', data]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function DELETE(req) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM descontos WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}