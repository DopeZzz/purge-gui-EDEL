import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const notifications = [
{
    id: '1',
    title: 'NEW PURGE IS OUT!',
    message: 'Enjoy now the future of Purge No Recoil Scripting',
    type: 'success', 
    timestamp: '2025-07-23T15:20:00Z',
    priority: 'high'
  }
]

export async function GET() {
  try {
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return NextResponse.json(sortedNotifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}