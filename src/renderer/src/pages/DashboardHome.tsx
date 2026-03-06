import { Package, Users, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

interface StatCardProps {
  title: string
  value: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  trend?: string
}

function StatCard({ title, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps): JSX.Element {
  return (
    <Card className="border-silver-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-charcoal-800 leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          {trend && (
            <div className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const stats: StatCardProps[] = [
  {
    title: 'Total SKUs',
    value: '247',
    sub: 'Across all vendors',
    icon: Package,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-50',
    trend: '2.4%',
  },
  {
    title: 'Active Vendors',
    value: '9',
    sub: 'Primary suppliers',
    icon: Users,
    iconColor: 'text-navy-900',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'Total On Hand',
    value: '1.46M',
    sub: 'Units in stock',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    trend: '12.1%',
  },
  {
    title: 'Low Stock Items',
    value: '14',
    sub: 'Below reorder point',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
]

const topVendors = [
  { name: 'A.N.B. Laboratories', skus: 42, onHand: '1,057,855', salesPerWeek: '64,027' },
  { name: 'PERFECT MEDICAL', skus: 12, onHand: '117,136', salesPerWeek: '6,323' },
  { name: 'OPTIMUM', skus: 28, onHand: '171,575', salesPerWeek: '6,307' },
  { name: 'ANDE HEALTH CARE', skus: 7, onHand: '7,522', salesPerWeek: '102' },
  { name: 'EUROMED', skus: 9, onHand: '26,988', salesPerWeek: '1,768' },
]

export default function DashboardHome(): JSX.Element {
  return (
    <div className="p-4 xl:p-6 space-y-5">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-bold text-charcoal-800">Inventory Overview</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Vendor overview table */}
      <Card className="border-silver-200">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-charcoal-800">Vendor Summary</CardTitle>
            <Badge variant="info" className="text-[10px]">2025 Report</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Vendor</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">SKUs</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">On Hand</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Sales/Wk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topVendors.map((v, i) => (
                  <tr key={v.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: i % 2 === 0 ? '#0D2B52' : '#1060C0' }}
                        >
                          {v.name[0]}
                        </div>
                        <span className="font-medium text-charcoal-700">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-charcoal-700">{v.skus}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-charcoal-700">{v.onHand}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-charcoal-700">{v.salesPerWeek}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
