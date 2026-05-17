import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS funcionarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      funcao VARCHAR(50),
      cpf VARCHAR(20),
      endereco TEXT,
      chave_pix VARCHAR(100),
      telefone VARCHAR(20),
      foto_base64 TEXT,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function POST(req) {
  const { nome, funcao, cpf, endereco, chave_pix, telefone, foto_base64 } = await req.json()

  try {
    await initDB()
    await pool.query(
      'INSERT INTO funcionarios (nome, funcao, cpf, endereco, chave_pix, telefone, foto_base64) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [nome || null, funcao || null, cpf || null, endereco || null, chave_pix || null, telefone || null, foto_base64 || null]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DB error:', e)
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function GET() {
  try {
    await initDB()
    const result = await pool.query('SELECT * FROM funcionarios ORDER BY criado_em DESC')
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
