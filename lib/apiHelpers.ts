export async function parseError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.message || json.detail || JSON.stringify(json)
  } catch (_) {
    return text
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} - ${await parseError(res)}`)
  }
  return res.json() as Promise<T>
}

export async function postJson<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  })
}

export async function fetchVoid(input: RequestInfo | URL, init?: RequestInit): Promise<void> {
  const res = await fetch(input, init)
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} - ${await parseError(res)}`)
  }
  await res.arrayBuffer()
}
