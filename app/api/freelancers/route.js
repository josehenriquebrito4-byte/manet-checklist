import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM freelancers ORDER BY criado_em DESC')
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function POST(req) {
  const { nome, funcao, valor, data, desconto, motivo_desconto } = await req.json()
  try {
    await pool.query(
      'INSERT INTO freelancers (nome, funcao, valor, data, desconto, motivo_desconto) VALUES ($1,$2,$3,$4,$5,$6)',
      [nome, funcao, parseFloat(valor), data, parseFloat(desconto || 0), motivo_desconto || '']
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function PATCH(req) {
  const { id, pago, desconto, motivo_desconto } = await req.json()
  try {
    if (desconto !== undefined) {
      await pool.query('UPDATE freelancers SET desconto=$1, motivo_desconto=$2 WHERE id=$3', [parseFloat(desconto), motivo_desconto || '', id])
    } else {
      await pool.query('UPDATE freelancers SET pago=$1 WHERE id=$2', [pago, id])
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}

export async function DELETE(req) {
  const { id } = await req.json()
  try {
    await pool.query('DELETE FROM freelancers WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}