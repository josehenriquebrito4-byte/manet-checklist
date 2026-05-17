import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req) {
  const { key, imageBase64, mimeType } = await req.json()

  const ext = mimeType.split('/')[1] || 'jpg'
  const dir = join(process.cwd(), 'public', 'referencias')
  
  await mkdir(dir, { recursive: true })
  
  const buffer = Buffer.from(imageBase64, 'base64')
  const filename = `${key}.${ext}`
  await writeFile(join(dir, filename), buffer)

  return NextResponse.json({ ok: true, filename })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  
  if (!key) return NextResponse.json({ ok: false })

  const fs = await import('fs')
  const dir = join(process.cwd(), 'public', 'referencias')
  
  const extensions = ['jpg', 'jpeg', 'png', 'webp']
  for (const ext of extensions) {
    const path = join(dir, `${key}.${ext}`)
    if (fs.existsSync(path)) {
      const buffer = fs.readFileSync(path)
      const b64 = buffer.toString('base64')
      return NextResponse.json({ ok: true, imageBase64: b64, mimeType: `image/${ext}` })
    }
  }

  return NextResponse.json({ ok: false })
}