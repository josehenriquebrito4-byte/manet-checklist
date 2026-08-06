// A Saipos usa um backend PostgREST que ocasionalmente estoura o pool de
// conexões dele (PGRST002/PGRST003) ou some no meio da conexão (ECONNRESET),
// sempre de forma transitória — a mesma chamada costuma funcionar segundos
// depois. Por isso cada fetch tenta de novo (backoff curto) antes de desistir.
const RETRYABLE_STATUS = new Set([502, 503, 504])
const RETRYABLE_BODY_RE = /PGRST002|PGRST003/

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchSaiposComRetry(url, token, { retries = 2, baseDelayMs = 400 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    } catch (e) {
      if (attempt === retries) throw e
      await sleep(baseDelayMs * (attempt + 1))
      continue
    }

    if (res.ok) {
      return { ok: true, data: await res.json() }
    }

    const details = await res.text()
    const retryable = RETRYABLE_STATUS.has(res.status) || RETRYABLE_BODY_RE.test(details)
    if (!retryable || attempt === retries) {
      return { ok: false, status: res.status, details }
    }
    await sleep(baseDelayMs * (attempt + 1))
  }
}

// Turno operacional vira às 06:00 (madrugada ainda conta como o dia anterior).
function shiftDateHoje() {
  const now = new Date()
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  if (brTime.getHours() < 6) brTime.setDate(brTime.getDate() - 1)
  const yyyy = brTime.getFullYear()
  const mm = String(brTime.getMonth() + 1).padStart(2, '0')
  const dd = String(brTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export { fetchSaiposComRetry, shiftDateHoje }
