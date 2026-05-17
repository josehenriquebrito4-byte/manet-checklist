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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS checklists (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100),
        tipo VARCHAR(50),
        turno VARCHAR(50),
        tarefas_ok BOOLEAN,
        fotos_ok BOOLEAN,
        extras JSONB,
        resultados JSONB,
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS freelancers (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100),
        funcao VARCHAR(50),
        valor DECIMAL(10,2),
        data DATE,
        pago BOOLEAN DEFAULT FALSE,
        desconto DECIMAL(10,2) DEFAULT 0,
        motivo_desconto VARCHAR(200) DEFAULT '',
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0`)
    await pool.query(`ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS motivo_desconto VARCHAR(200) DEFAULT ''`)
    return NextResponse.json({ ok: true, message: 'Tabelas criadas!' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}