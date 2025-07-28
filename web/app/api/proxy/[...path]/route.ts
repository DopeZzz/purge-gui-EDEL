import { NextRequest, NextResponse } from 'next/server'
import { getApiOrigin } from '@/lib/apiClient'

export const runtime = 'nodejs'

async function forward(req: NextRequest, path: string): Promise<Response> {
  const url = new URL(req.url)
  const target = `${getApiOrigin()}/${path}${url.search}`
  const init: RequestInit = {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    redirect: 'manual',
  }
  const res = await fetch(target, init)
  const body = await res.arrayBuffer()
  const headers = new Headers(res.headers)
  return new Response(body, { status: res.status, headers })
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path.join('/'))
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path.join('/'))
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path.join('/'))
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path.join('/'))
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path.join('/'))
}
