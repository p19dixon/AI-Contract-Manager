import { Layout } from '../components/layout/Layout'
import { DataTable, Column } from '../components/ui/data-table'
import { ResizableTable } from '../components/ui/resizable-table'

interface TestData {
  id: number
  name: string
  email: string
  status: string
  amount: number
}

const testData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', amount: 1000 },
  { id: 2, name: 'Jane Smith with a very long name that should be truncated', email: 'jane.smith@verylongdomainname.com', status: 'Pending', amount: 2500 },
  { id: 3, name: 'Bob Johnson', email: 'bob@test.com', status: 'Inactive', amount: 750 },
  { id: 4, name: 'Alice Williams', email: 'alice@company.com', status: 'Active', amount: 3200 },
  { id: 5, name: 'Charlie Brown', email: 'charlie.brown@peanuts.com', status: 'Active', amount: 1500 },
  { id: 6, name: 'Diana Prince', email: 'diana@wonderwoman.com', status: 'Active', amount: 5000 },
]

export function TestResizePage() {
  const columns: Column<TestData>[] = [
    { key: 'id', header: 'ID', width: '16' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status' },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (amount) => `$${amount.toLocaleString()}`
    }
  ]

  const resizableColumns = [
    { key: 'id' as keyof TestData, header: 'ID', width: 80, minWidth: 50, maxWidth: 150 },
    { key: 'name' as keyof TestData, header: 'Name', width: 200, minWidth: 100, maxWidth: 400 },
    { key: 'email' as keyof TestData, header: 'Email', width: 250, minWidth: 150, maxWidth: 500 },
    { key: 'status' as keyof TestData, header: 'Status', width: 120, minWidth: 80, maxWidth: 200 },
    { 
      key: 'amount' as keyof TestData, 
      header: 'Amount', 
      width: 150, 
      minWidth: 100, 
      maxWidth: 250,
      render: (amount: number) => `$${amount.toLocaleString()}`
    }
  ]

  return (
    <Layout title="Test Resize Functionality" description="Testing column resize implementation">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Standard DataTable with Resize</h2>
          <p className="text-sm text-gray-600 mb-4">
            Try dragging the column borders to resize columns. The resize handles are the thin gray lines between columns.
          </p>
          <DataTable
            data={testData}
            columns={columns}
            loading={false}
            searchable={true}
            searchPlaceholder="Search test data..."
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">ResizableTable Component</h2>
          <p className="text-sm text-gray-600 mb-4">
            This is a dedicated resizable table component with min/max width constraints.
          </p>
          <ResizableTable
            data={testData}
            columns={resizableColumns}
            className="border rounded-lg"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Look for thin gray vertical lines between column headers</li>
            <li>Hover over these lines - they should turn blue</li>
            <li>Click and drag to resize columns</li>
            <li>The cursor should change to a resize cursor (↔)</li>
            <li>Column content should truncate with ellipsis when too narrow</li>
          </ol>
        </div>
      </div>
    </Layout>
  )
}