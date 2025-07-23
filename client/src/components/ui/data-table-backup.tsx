import React, { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
  width?: string
  minWidth?: number
  maxWidth?: number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onAdd?: () => void
  addButtonText?: string
  loading?: boolean
  emptyMessage?: string
  actions?: (item: T) => ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  onAdd,
  addButtonText = 'Add New',
  loading = false,
  emptyMessage = 'No data available',
  actions
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const filteredData = React.useMemo(() => {
    if (!searchQuery || onSearch) return data

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [data, searchQuery, onSearch])

  // Initialize column widths
  useEffect(() => {
    const initialWidths: { [key: string]: number } = {}
    columns.forEach((column) => {
      const key = String(column.key)
      if (column.width) {
        // Convert width string to number (e.g., "16" -> 64px, "32" -> 128px)
        const numericWidth = parseInt(column.width) * 4
        initialWidths[key] = numericWidth
      } else if (column.minWidth) {
        initialWidths[key] = column.minWidth
      } else {
        initialWidths[key] = 150 // Default width
      }
    })
    // Add actions column width if actions are present
    if (actions) {
      initialWidths['actions'] = 120
    }
    setColumnWidths(initialWidths)
  }, [columns, actions])

  // Handle resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return
    
    e.preventDefault()
    const deltaX = e.clientX - startXRef.current
    
    // Find column constraints - allow shrinking to 1px
    const column = columns.find(col => String(col.key) === resizingColumn)
    const minWidth = 1 // Allow all columns to shrink to 1px
    const maxWidth = column?.maxWidth || 2000
    
    const newWidth = Math.min(Math.max(minWidth, startWidthRef.current + deltaX), maxWidth)
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }, [isResizing, resizingColumn, columns])

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizingColumn(null)
    
    // Reset visual feedback
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', handleResizeEnd)
  }, [handleResize])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizingColumn(columnKey)
    startXRef.current = e.clientX
    startWidthRef.current = columnWidths[columnKey] || 150
    
    // Add visual feedback
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', handleResizeEnd)
  }, [columnWidths, handleResize, handleResizeEnd])

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResize, handleResizeEnd])

  return (
    <Card>
      {(title || description || searchable || onAdd) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {searchable && (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-64"
                />
              )}
              {onAdd && (
                <Button onClick={onAdd}>
                  {addButtonText}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table ref={tableRef} className="border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column) => {
                    const columnKey = String(column.key)
                    const width = columnWidths[columnKey] || 150
                    return (
                      <th
                        key={columnKey}
                        className="relative text-left font-medium text-sm text-gray-700"
                        style={{ 
                          width: `${width}px`,
                          maxWidth: `${width}px`
                        }}
                      >
                        <div className="px-1 py-3 truncate overflow-hidden" style={{ minWidth: 0 }} title={column.header}>
                          {column.header}
                        </div>
                        {/* Resize handle positioned at the right edge */}
                        <div
                          className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                          style={{
                            width: '3px',
                            backgroundColor: resizingColumn === columnKey ? '#3b82f6' : '#e5e7eb'
                          }}
                          onMouseDown={(e) => handleResizeStart(e, columnKey)}
                          title="Drag to resize column"
                        />
                      </th>
                    )
                  })}
                  {actions && (
                    <th className="relative text-left font-medium text-sm text-gray-700" style={{ 
                      width: `${columnWidths['actions'] || 120}px`, 
                      maxWidth: `${columnWidths['actions'] || 120}px` 
                    }}>
                      <div className="px-4 py-3">Actions</div>
                      <div
                        className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                        style={{
                          width: '3px',
                          backgroundColor: resizingColumn === 'actions' ? '#3b82f6' : '#e5e7eb'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'actions')}
                        title="Drag to resize column"
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => {
                      const columnKey = String(column.key)
                      const width = columnWidths[columnKey] || 150
                      return (
                        <td
                          key={columnKey}
                          className="text-sm"
                          style={{ 
                            width: `${width}px`,
                            maxWidth: `${width}px`
                          }}
                        >
                          <div className="px-1 py-3 truncate overflow-hidden" style={{ minWidth: 0 }} title={String(item[column.key] || '')}>
                            {column.render
                              ? column.render(item[column.key], item)
                              : String(item[column.key] || '')}
                          </div>
                        </td>
                      )
                    })}
                    {actions && (
                      <td className="text-sm" style={{ 
                        width: `${columnWidths['actions'] || 120}px`, 
                        maxWidth: `${columnWidths['actions'] || 120}px` 
                      }}>
                        <div className="px-4 py-3">
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Utility component for action buttons
export function TableActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center space-x-1">
      {children}
    </div>
  )
}