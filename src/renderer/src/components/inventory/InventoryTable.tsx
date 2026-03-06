import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { InventoryItem, getStockStatus } from '../../types/inventory'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface InventoryTableProps {
  items: InventoryItem[]
  loading: boolean
}

const columnHelper = createColumnHelper<InventoryItem>()

function StatusBadge({ item }: { item: InventoryItem }) {
  const status = getStockStatus(item)
  if (status === 'out-of-stock') return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out</Badge>
  if (status === 'low-stock') return <Badge variant="warning" className="text-[10px] px-1.5 py-0">Low</Badge>
  return <Badge variant="success" className="text-[10px] px-1.5 py-0">OK</Badge>
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3 ml-1 text-brand" />
  return <ArrowDown className="h-3 w-3 ml-1 text-brand" />
}

export function InventoryTable({ items, loading }: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [collapsedVendors, setCollapsedVendors] = useState<Set<string>>(new Set())

  function toggleVendor(vendor: string) {
    setCollapsedVendors(prev => {
      const next = new Set(prev)
      if (next.has(vendor)) next.delete(vendor)
      else next.add(vendor)
      return next
    })
  }

  const columns = useMemo(() => [
    columnHelper.accessor('itemCode', {
      header: 'Item Code',
      cell: info => (
        <span className="font-mono text-[11px] text-charcoal-700">{info.getValue()}</span>
      ),
      size: 130,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => (
        <span className="text-xs font-medium text-charcoal-800 leading-tight">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => info.getValue()
        ? <span className="text-[11px] text-muted-foreground">{info.getValue()}</span>
        : <span className="text-[11px] text-silver-400">—</span>,
      size: 140,
    }),
    columnHelper.accessor('prefVendor', {
      header: 'Pref. Vendor',
      cell: info => info.getValue()
        ? <span className="text-[11px] text-muted-foreground">{info.getValue()}</span>
        : <span className="text-[11px] text-silver-400">—</span>,
      size: 150,
    }),
    columnHelper.accessor('onHand', {
      header: 'On Hand',
      cell: info => {
        const v = info.getValue()
        return (
          <span className={cn(
            'font-mono text-xs font-semibold',
            v < 0 ? 'text-destructive' : v === 0 ? 'text-muted-foreground' : 'text-charcoal-800'
          )}>
            {v.toLocaleString()}
          </span>
        )
      },
      size: 90,
    }),
    columnHelper.accessor('onPO', {
      header: 'On PO',
      cell: info => <span className="font-mono text-xs text-muted-foreground">{info.getValue().toLocaleString()}</span>,
      size: 70,
    }),
    columnHelper.accessor('salesPerWeek', {
      header: 'Sales/Wk',
      cell: info => (
        <span className="font-mono text-xs text-charcoal-700">{info.getValue().toLocaleString()}</span>
      ),
      size: 80,
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: info => <StatusBadge item={info.row.original} />,
      size: 60,
    }),
  ], [])

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Group rows by vendor for visual grouping
  const sortedRows = table.getRowModel().rows
  const groupedByVendor = useMemo(() => {
    const groups: { vendor: string; rows: typeof sortedRows }[] = []
    const map = new Map<string, typeof sortedRows>()
    sortedRows.forEach(row => {
      const v = row.original.vendor
      if (!map.has(v)) map.set(v, [])
      map.get(v)!.push(row)
    })
    map.forEach((rows, vendor) => groups.push({ vendor, rows }))
    return groups
  }, [sortedRows])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 border-b-2 border-silver-300">
            {table.getHeaderGroups()[0].headers.map(header => (
              <th
                key={header.id}
                style={{ width: header.getSize() }}
                className={cn(
                  'px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground select-none whitespace-nowrap',
                  header.column.getCanSort() && 'cursor-pointer hover:text-foreground'
                )}
                onClick={header.column.getToggleSortingHandler()}
              >
                <span className="flex items-center">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanSort() && (
                    <SortIcon sorted={header.column.getIsSorted()} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedByVendor.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                No items match your filters.
              </td>
            </tr>
          ) : (
            groupedByVendor.map(({ vendor, rows }) => {
              const isCollapsed = collapsedVendors.has(vendor)
              const vendorOnHand = rows.reduce((sum, r) => sum + r.original.onHand, 0)
              const vendorSales = rows.reduce((sum, r) => sum + r.original.salesPerWeek, 0)
              return (
                <>
                  {/* Vendor header row */}
                  <tr
                    key={`vendor-${vendor}`}
                    className="cursor-pointer select-none"
                    onClick={() => toggleVendor(vendor)}
                    style={{ background: '#0D2B52' }}
                  >
                    <td colSpan={8} className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCollapsed
                            ? <ChevronRight className="h-3.5 w-3.5 text-white/60" />
                            : <ChevronDownIcon className="h-3.5 w-3.5 text-white/60" />
                          }
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">{vendor}</span>
                          <span className="text-[10px] text-blue-300/70 ml-1">({rows.length} items)</span>
                        </div>
                        <div className="flex items-center gap-5 text-[10px] text-blue-200/70">
                          <span>On Hand: <span className="font-mono font-semibold text-white/90">{vendorOnHand.toLocaleString()}</span></span>
                          <span>Sales/Wk: <span className="font-mono font-semibold text-white/90">{vendorSales.toLocaleString()}</span></span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Item rows */}
                  {!isCollapsed && rows.map((row, rowIdx) => {
                    const isEven = rowIdx % 2 === 0
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-b border-silver-200 hover:bg-brand-50 transition-colors',
                          isEven ? 'bg-white' : 'bg-gray-50/50'
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-3 py-2 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
