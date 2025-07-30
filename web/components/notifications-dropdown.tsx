"use client"

import { useState, useEffect } from "react"
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  serial: string | null
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: string
  priority: 'high' | 'medium' | 'low'
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'NEW PURGE 2.0 IS OUT!',
    message: 'Enjoy now the future of Purge No Recoil Scripting',
    type: 'success',
    timestamp: '2025-07-23T15:20:00Z',
    priority: 'high',
  },
]

export function NotificationsDropdown({ serial }: Props) {
  const [notifications] = useState<Notification[]>(defaultNotifications)
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!serial) return
    const load = async () => {
      try {
        const res = await fetch(`/api/read-notifications/${serial}`)
        if (!res.ok) return
        const ids: string[] = await res.json()
        setReadNotifications(new Set(ids))
      } catch (_) {
        /* ignore */
      }
    }
    load()
  }, [serial])


  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length

  const markAsRead = async (id: string) => {
    const newRead = new Set(readNotifications)
    newRead.add(id)
    setReadNotifications(newRead)
    if (serial) {
      try {
        await fetch(`/api/read-notifications/${serial}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(newRead) }),
        })
      } catch (_) {
        /* ignore */
      }
    }
  }

  const markAllAsRead = async () => {
    const allIds = new Set(notifications.map(n => n.id))
    setReadNotifications(allIds)
    if (serial) {
      try {
        await fetch(`/api/read-notifications/${serial}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(allIds) }),
        })
      } catch (_) {
        /* ignore */
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-blue-500'
      default: return 'border-l-gray-500'
    }
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-300 hover:text-white hover:bg-gray-800/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          
          <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-gray-400 hover:text-white h-6 px-2"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => {
                  const isRead = readNotifications.has(notification.id)
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b border-gray-700/50 last:border-b-0 cursor-pointer transition-colors border-l-4",
                        getPriorityColor(notification.priority),
                        isRead 
                          ? "bg-gray-900/50 opacity-75" 
                          : "bg-gray-800/30 hover:bg-gray-800/50"
                      )}
                      onClick={() => !isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "text-sm font-medium",
                              isRead ? "text-gray-400" : "text-white"
                            )}>
                              {notification.title}
                            </h4>
                            {!isRead && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className={cn(
                            "text-xs leading-relaxed",
                            isRead ? "text-gray-500" : "text-gray-300"
                          )}>
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500 mt-1 block">
                            {getRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}