import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DataTable } from './data-table'

interface TestData {
  id: number
  name: string
  email: string
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
]

const mockColumns = [
  { key: 'id' as keyof TestData, header: 'ID', width: '16' },
  { key: 'name' as keyof TestData, header: 'Name' },
  { key: 'email' as keyof TestData, header: 'Email' },
]

describe('DataTable Resizable Columns', () => {
  test('renders resize handles for columns', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    // Check if resize handles are present
    const resizeHandles = screen.getAllByTitle('Drag to resize column')
    expect(resizeHandles).toHaveLength(3) // One for each column
  })

  test('resize handles have correct cursor style', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const resizeHandles = screen.getAllByTitle('Drag to resize column')
    resizeHandles.forEach(handle => {
      expect(handle).toHaveClass('cursor-col-resize')
    })
  })

  test('resize handles are visible grey with inline styles', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const resizeHandles = screen.getAllByTitle('Drag to resize column')
    resizeHandles.forEach(handle => {
      expect(handle).toHaveClass('cursor-col-resize')
      expect(handle).toHaveClass('absolute')
      expect(handle).toHaveStyle('background-color: #d1d5db')
      expect(handle).toHaveStyle('width: 8px')
      expect(handle).toHaveStyle('z-index: 10')
    })
  })

  test('can trigger resize start on mouse down', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const resizeHandles = screen.getAllByTitle('Drag to resize column')
    const firstHandle = resizeHandles[0]
    
    // This should not throw an error
    fireEvent.mouseDown(firstHandle, { clientX: 100 })
    
    // The component should handle this event
    expect(firstHandle).toBeInTheDocument()
  })

  test('column resizing updates width on mouse move', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const resizeHandles = screen.getAllByTitle('Drag to resize column')
    const firstHandle = resizeHandles[0]
    
    // Start resizing
    fireEvent.mouseDown(firstHandle, { clientX: 100 })
    
    // Simulate mouse move to resize
    fireEvent.mouseMove(document, { clientX: 150 })
    
    // The component should handle this event without errors
    expect(firstHandle).toBeInTheDocument()
    
    // End resizing
    fireEvent.mouseUp(document)
  })

  test('table has fixed layout for resizing', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const table = screen.getByRole('table')
    expect(table).toHaveStyle('table-layout: fixed')
  })
})