import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GrazingEvent } from '@/lib/types'

interface GrazingHistoryTableProps {
  events: GrazingEvent[]
  title?: string
}

export function GrazingHistoryTable({ 
  events,
  title = 'Grazing History'
}: GrazingHistoryTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Entry NDVI</TableHead>
              <TableHead className="text-right">Exit NDVI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No grazing events recorded
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{formatDate(event.date)}</TableCell>
                  <TableCell className="text-right">{event.duration} days</TableCell>
                  <TableCell className="text-right text-olive">{event.entryNdvi.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-terracotta">{event.exitNdvi.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
