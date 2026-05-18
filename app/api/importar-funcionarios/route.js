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
  try {
    const data = await req.json()
    
    // Verifica se os dados recebidos são um array, caso contrário transforma em array para iterar
    const funcionarios = Array.isArray(data) ? data : [data]

    if (funcionarios.length === 0) {
      return NextResponse.json({ ok: false, error: 'Nenhum dado fornecido' })
    }

    await initDB()

    for (const func of funcionarios) {
      // Mapeamento dos campos enviados no JSON para as colunas do banco
      const { nome, cpf, telefone, cargo, chave_pix, endereco, foto_url } = func
      
      await pool.query(
        'INSERT INTO funcionarios (nome, funcao, cpf, endereco, chave_pix, telefone, foto_base64) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [nome || null, cargo || null, cpf || null, endereco || null, chave_pix || null, telefone || null, foto_url || null]
      )
    }

    return NextResponse.json({ ok: true, message: `${funcionarios.length} funcionário(s) importado(s) com sucesso.` })
  } catch (e) {
    console.error('DB error:', e)
    return NextResponse.json({ ok: false, error: e.message })
  }
}
