import { Bell, CheckCheck, Satellite, AlertCircle, Info } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { api } from '../../../convex/_generated/api'
import { useFarmContext } from '@/lib/farm'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Id, Doc } from '../../../convex/_generated/dataModel'

type Notification = Doc<'notifications'>

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'satellite_ready':
      return <Satellite className="h-4 w-4 text-olive" />
    case 'satellite_failed':
      return <AlertCircle className="h-4 w-4 text-terracotta" />
    default:
      return <Info className="h-4 w-4 text-cobalt" />
  }
}

export function NotificationBell() {
  const { activeFarmId } = useFarmContext()
  const navigate = useNavigate()

  const notifications = useQuery(
    api.notifications.getForFarm,
    activeFarmId ? { farmExternalId: activeFarmId, limit: 10 } : 'skip'
  )
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    activeFarmId ? { farmExternalId: activeFarmId } : 'skip'
  )

  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const handleNotificationClick = async (notificationId: Id<'notifications'>, isRead: boolean) => {
    if (!isRead) {
      await markAsRead({ notificationId })
    }
  }

  const handleMarkAllRead = async () => {
    if (activeFarmId) {
      await markAllAsRead({ farmExternalId: activeFarmId })
    }
  }

  const handleActionClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent dropdown from closing
    if (notification.metadata?.actionUrl) {
      // Parse the URL and navigate
      const url = new URL(notification.metadata.actionUrl, window.location.origin)
      navigate({
        to: url.pathname,
        search: Object.fromEntries(url.searchParams),
      })
      // Mark as read when clicking action
      if (!notification.isRead) {
        markAsRead({ notificationId: notification._id })
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-5 w-5 items-center justify-center rounded hover:bg-accent">
          <Bell className="h-3 w-3" />
          {unreadCount != null && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-terracotta text-[8px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount != null && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!notifications || notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                !notification.isRead ? 'bg-olive-light' : ''
              }`}
              onClick={() => handleNotificationClick(notification._id, notification.isRead)}
            >
              <div className="flex items-start gap-2 w-full">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.metadata?.actionUrl && notification.metadata?.actionLabel && (
                    <button
                      onClick={(e) => handleActionClick(notification, e)}
                      className="mt-2 text-xs text-olive hover:text-olive-bright font-medium"
                    >
                      {notification.metadata.actionLabel} &rarr;
                    </button>
                  )}
                </div>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-olive shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
