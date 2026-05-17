import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cadastro_motoboys (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) UNIQUE,
      telefone VARCHAR(20) DEFAULT '',
      chave_pix VARCHAR(200) DEFAULT '',
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function GET() {
  try {
    await initTable()
    const result = await pool.query('SELECT * FROM cadastro_motoboys ORDER BY nome ASC')
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function POST(req) {
  const { nome, telefone, chave_pix } = await req.json()
  try {
    await initTable()
    await pool.query(
      `INSERT INTO cadastro_motoboys (nome, telefone, chave_pix) 
       VALUES ($1,$2,$3)
       ON CONFLICT (nome) DO UPDATE SET telefone=$2, chave_pix=$3`,
      [nome, telefone || '', chave_pix || '']
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function DELETE(req) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM cadastro_motoboys WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}