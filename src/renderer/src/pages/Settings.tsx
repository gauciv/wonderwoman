import { useState, useRef, useCallback } from 'react'
import {
  Upload, Download, Trash2, AlertTriangle, ChevronDown, ChevronRight,
  FileSpreadsheet, CheckCircle2, Loader2, FileText, Settings as SettingsIcon,
  X
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useInventory } from '../hooks/useInventory'
import { InventoryItem } from '../types/inventory'
import { Button } from '../components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { cn } from '../lib/utils'

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

interface ParsedRow extends Omit<InventoryItem, 'id'> {
  rowType: 'item'
}

const EXPECTED_HEADERS = ['item code', 'description', 'pref vendor', 'reorder pt', 'on hand', 'order', 'on po', 'next deliv', 'sales/week']

function parseNumber(val: string): number | null {
  const n = parseFloat(val.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

function parseCSV(text: string): { rows: ParsedRow[]; error: string | null } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { rows: [], error: 'File is empty.' }

  const headerIdx = lines.findIndex(l =>
    EXPECTED_HEADERS.some(h => l.toLowerCase().includes(h))
  )
  if (headerIdx === -1) return { rows: [], error: 'Could not find a header row with expected columns.' }

  const rawHeaders = lines[headerIdx].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const lower = rawHeaders.map(h => h.toLowerCase())

  function col(name: string): number {
    return lower.findIndex(h => h.includes(name))
  }

  const idxCode = col('item code')
  const idxDesc = col('description')
  const idxPrefV = col('pref vendor')
  const idxROP = col('reorder pt')
  const idxOnHand = col('on hand')
  const idxOrder = col('order')
  const idxOnPO = col('on po')
  const idxNextDeliv = col('next deliv')
  const idxSales = col('sales')
  const idxVendor = col('vendor')

  if (idxCode === -1 || idxDesc === -1 || idxOnHand === -1) {
    return { rows: [], error: 'Missing required columns: Item Code, Description, On Hand.' }
  }

  const rows: ParsedRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const code = cells[idxCode]
    const desc = cells[idxDesc]
    if (!code || !desc) continue
    rows.push({
      rowType: 'item',
      itemCode: code,
      description: desc,
      vendor: idxVendor >= 0 ? cells[idxVendor] ?? '' : '',
      prefVendor: idxPrefV >= 0 ? cells[idxPrefV] ?? '' : '',
      category: '',
      reorderPt: idxROP >= 0 ? parseNumber(cells[idxROP] ?? '') : null,
      onHand: parseNumber(idxOnHand >= 0 ? cells[idxOnHand] ?? '0' : '0') ?? 0,
      order: idxOrder >= 0 ? parseNumber(cells[idxOrder] ?? '') : null,
      onPO: parseNumber(idxOnPO >= 0 ? cells[idxOnPO] ?? '0' : '0') ?? 0,
      nextDeliv: idxNextDeliv >= 0 ? cells[idxNextDeliv] ?? '' : '',
      salesPerWeek: parseNumber(idxSales >= 0 ? cells[idxSales] ?? '0' : '0') ?? 0,
    })
  }

  return { rows, error: null }
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportToCSV(items: InventoryItem[]): void {
  const headers = ['Item Code', 'Description', 'Vendor', 'Category', 'Pref Vendor',
    'On Hand', 'Reorder Pt', 'Order Qty', 'On PO', 'Next Delivery', 'Sales/Week']
  const escape = (v: string | number | null | undefined) => {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = items.map(i => [
    escape(i.itemCode), escape(i.description), escape(i.vendor),
    escape(i.category), escape(i.prefVendor), i.onHand,
    i.reorderPt ?? '', i.order ?? '', i.onPO, escape(i.nextDeliv), i.salesPerWeek,
  ].join(','))
  const content = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pharma-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportToPDF(items: InventoryItem[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(13, 43, 82)
  doc.text('PharmaTracker — Inventory Report', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleString()} · ${items.length} items`, 14, 21)

  autoTable(doc, {
    startY: 26,
    head: [['Item Code', 'Description', 'Vendor', 'Category', 'On Hand', 'Reorder Pt', 'On PO', 'Sales/Wk']],
    body: items.map(i => [
      i.itemCode,
      i.description,
      i.vendor,
      i.category ?? '—',
      i.onHand.toLocaleString(),
      i.reorderPt != null ? i.reorderPt.toLocaleString() : '—',
      i.onPO.toLocaleString(),
      i.salesPerWeek.toLocaleString(),
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [16, 96, 192], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [235, 243, 255] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`pharma-inventory-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-silver-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <div className="px-5 py-4 border-b border-silver-200 dark:border-gray-800 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 dark:bg-blue-900/30">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal-800 dark:text-gray-100">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type ImportStage = 'idle' | 'preview' | 'confirming' | 'importing' | 'done'

export default function Settings(): JSX.Element {
  const emptyFilters = { search: '', vendor: 'all', category: 'all', stockStatus: 'all' as const }
  const { allItems, replaceAll, deleteItems } = useInventory(emptyFilters)
  const existingItems = allItems.filter(i => i.rowType === 'item')
  const existingCount = existingItems.length

  // ── Import state ──
  const [importStage, setImportStage] = useState<ImportStage>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Export state ──
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // ── Danger zone ──
  const [dangerOpen, setDangerOpen] = useState(false)
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false)
  const [wiping, setWiping] = useState(false)

  // ── Import handlers ──

  function processFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a .csv file.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { rows, error } = parseCSV(text)
      setParseError(error)
      setParsedRows(rows)
      if (!error && rows.length > 0) setImportStage('preview')
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleImportClick(): void {
    if (existingCount > 0) {
      setImportStage('confirming')
    } else {
      void runImport()
    }
  }

  async function runImport(): Promise<void> {
    setImportStage('importing')
    try {
      await replaceAll(parsedRows)
      setImportStage('done')
    } catch (err) {
      setParseError((err as Error).message)
      setImportStage('preview')
    }
  }

  function resetImport(): void {
    setImportStage('idle')
    setParsedRows([])
    setFileName('')
    setParseError(null)
  }

  // ── Export handlers ──

  async function handleExportCSV(): Promise<void> {
    setExportingCSV(true)
    try {
      exportToCSV(existingItems)
    } finally {
      setExportingCSV(false)
    }
  }

  async function handleExportPDF(): Promise<void> {
    setExportingPDF(true)
    try {
      exportToPDF(existingItems)
    } finally {
      setExportingPDF(false)
    }
  }

  // ── Wipe handler ──

  async function handleWipeAll(): Promise<void> {
    setWiping(true)
    try {
      await deleteItems(existingItems.map(i => i.id))
      setWipeConfirmOpen(false)
    } finally {
      setWiping(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Page title */}
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="h-5 w-5 text-brand" />
          <div>
            <h2 className="text-base font-bold text-charcoal-800 dark:text-gray-100">Settings</h2>
            <p className="text-xs text-muted-foreground">Manage data import, export, and system configuration</p>
          </div>
        </div>

        {/* ── Data Import ── */}
        <Section
          icon={Upload}
          title="Data Import"
          description="Import inventory data from a CSV file. Existing data will be replaced."
        >
          {importStage === 'idle' && (
            <div className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'rounded-lg border-2 border-dashed cursor-pointer transition-all',
                  'flex flex-col items-center justify-center gap-2 py-10 px-6',
                  isDragging
                    ? 'border-brand bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
                    : 'border-silver-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:border-brand/50 hover:bg-brand-50/40 dark:hover:bg-brand-900/10'
                )}
              >
                <FileSpreadsheet className="h-8 w-8 text-silver-400 dark:text-gray-500" />
                <div className="text-center">
                  <p className="text-sm font-medium text-charcoal-800 dark:text-gray-200">
                    Drop your CSV file here or <span className="text-brand underline">browse</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports the standard Inventory Report CSV format
                  </p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />

              {parseError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {importStage === 'preview' && (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center justify-between rounded-md border border-silver-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-brand shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-charcoal-800 dark:text-gray-200">{fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{parsedRows.length} items parsed</p>
                  </div>
                </div>
                <button
                  onClick={resetImport}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preview table */}
              <div className="rounded-md border border-silver-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-[11px]">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr className="border-b border-silver-200 dark:border-gray-700">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Item Code</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Description</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Vendor</th>
                        <th className="text-right px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">On Hand</th>
                        <th className="text-right px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Sales/Wk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver-200 dark:divide-gray-700">
                      {parsedRows.slice(0, 50).map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}>
                          <td className="px-3 py-1.5 font-mono text-charcoal-700 dark:text-gray-300">{row.itemCode}</td>
                          <td className="px-3 py-1.5 text-charcoal-800 dark:text-gray-200 max-w-[200px] truncate">{row.description}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{row.vendor}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{row.onHand.toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{row.salesPerWeek.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 50 && (
                  <p className="text-[10px] text-muted-foreground text-center py-2 border-t dark:border-gray-700">
                    Showing first 50 of {parsedRows.length} rows
                  </p>
                )}
              </div>

              {existingCount > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    You have <strong>{existingCount} existing items</strong>. Importing will replace all current data with {parsedRows.length} new items.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetImport}>Cancel</Button>
                <Button size="sm" className="gap-1.5" onClick={handleImportClick}>
                  <Upload className="h-3.5 w-3.5" />
                  {existingCount > 0 ? `Replace ${existingCount} items` : `Import ${parsedRows.length} items`}
                </Button>
              </div>
            </div>
          )}

          {importStage === 'importing' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-sm font-medium text-charcoal-800 dark:text-gray-200">Importing {parsedRows.length} items…</p>
              <p className="text-xs text-muted-foreground">This may take a moment for large datasets.</p>
            </div>
          )}

          {importStage === 'done' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm font-medium text-charcoal-800 dark:text-gray-200">{parsedRows.length} items imported successfully</p>
              <Button variant="outline" size="sm" onClick={resetImport}>Import another file</Button>
            </div>
          )}
        </Section>

        {/* ── Data Export ── */}
        <Section
          icon={Download}
          title="Data Export"
          description={`Export current inventory data (${existingCount} items) to CSV or PDF.`}
        >
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportCSV}
              disabled={exportingCSV || existingCount === 0}
            >
              {exportingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
              Export as CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportPDF}
              disabled={exportingPDF || existingCount === 0}
            >
              {exportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-red-500" />}
              Export as PDF
            </Button>
          </div>
          {existingCount === 0 && (
            <p className="text-xs text-muted-foreground mt-3">No inventory data to export. Import a CSV file first.</p>
          )}
        </Section>

        {/* ── Danger Zone ── */}
        <div className={cn(
          'rounded-lg border-2 overflow-hidden transition-all duration-200',
          dangerOpen
            ? 'border-destructive/50 dark:border-destructive/40'
            : 'border-destructive/30 dark:border-destructive/30'
        )}>
          {/* Collapsible header */}
          <button
            className="w-full flex items-center justify-between px-5 py-4 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            onClick={() => setDangerOpen(prev => !prev)}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Danger Zone</span>
            </div>
            {dangerOpen
              ? <ChevronDown className="h-4 w-4 text-destructive/60" />
              : <ChevronRight className="h-4 w-4 text-destructive/60" />
            }
          </button>

          {/* Expanded content */}
          {dangerOpen && (
            <div className="px-5 py-4 bg-white dark:bg-gray-900 border-t border-destructive/20 dark:border-destructive/20 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-charcoal-800 dark:text-gray-100">Wipe All Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete all {existingCount} inventory items. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={existingCount === 0}
                  onClick={() => setWipeConfirmOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Wipe All Data
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Confirm import (replaces existing) ── */}
      <AlertDialog open={importStage === 'confirming'} onOpenChange={open => !open && setImportStage('preview')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently wipe your current <strong>{existingCount} items</strong> and replace them with <strong>{parsedRows.length} items</strong> from <em>{fileName}</em>.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportStage('preview')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runImport}>
              Replace all data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm wipe all ── */}
      <AlertDialog open={wipeConfirmOpen} onOpenChange={open => !open && setWipeConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Wipe all inventory data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all <strong>{existingCount} inventory items</strong>.
              There is no way to recover this data after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWipeAll} disabled={wiping}>
              {wiping ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </span>
              ) : (
                `Delete all ${existingCount} items`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
