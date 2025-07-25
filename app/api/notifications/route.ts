import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Simulación de notificaciones - en producción esto vendría de una base de datos
const notifications = [
  {
    id: '1',
    title: 'System Update',
    message: 'Purge 2.0 has been updated with improved detection algorithms and better performance.',
    type: 'info',
    timestamp: '2024-12-17T10:00:00Z',
    priority: 'high'
  },
  {
    id: '2', 
    title: 'Maintenance Notice',
    message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM UTC. Service may be briefly interrupted.',
    type: 'warning',
    timestamp: '2024-12-17T08:30:00Z',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'New Feature Available',
    message: 'Voice notifications are now available! Choose your favorite voice in the Miscellaneous section.',
    type: 'success', 
    timestamp: '2024-12-16T15:20:00Z',
    priority: 'low'
  }
]

export async function GET() {
  try {
    // Ordenar por timestamp descendente (más recientes primero)
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return NextResponse.json(sortedNotifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}