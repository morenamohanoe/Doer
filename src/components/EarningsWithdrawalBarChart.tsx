import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Award } from 'lucide-react';
import { GeometricDivider } from './GeometricDivider';

interface EarningsWithdrawalBarChartProps {
  serviceRequests: any[];
  p2pTransfers: any[];
  withdrawals: any[];
  currentUserId: string;
}

const isValidDate = (d: any): d is Date => {
  return d instanceof Date && !isNaN(d.getTime());
};

const safeParseDate = (val: any): Date => {
  if (!val) return new Date();
  
  if (val instanceof Date) {
    return isValidDate(val) ? val : new Date();
  }

  if (val && typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (isValidDate(d)) return d;
    } catch (e) {}
  }
  
  if (val && typeof val.seconds === 'number') {
    try {
      const d = new Date(val.seconds * 1000);
      if (isValidDate(d)) return d;
    } catch (e) {}
  }
  
  try {
    const d = new Date(val);
    if (isValidDate(d)) return d;
  } catch (e) {}
  
  return new Date();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 text-xs shadow-2xl space-y-1.5 text-left min-w-[140px]">
        <p className="font-black text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 justify-between">
            <span className="font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-mono font-black text-slate-100">R {item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EarningsWithdrawalBarChart({
  serviceRequests = [],
  p2pTransfers = [],
  withdrawals = [],
  currentUserId
}: EarningsWithdrawalBarChartProps) {

  const getMonthlyHistoryData = () => {
    const dataMap: { [key: string]: { monthName: string; income: number; withdrawals: number; rawDate: Date } } = {};
    
    // Setup last 6 months dynamically starting from the current month
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString([], { month: 'short' });
      dataMap[monthKey] = {
        monthName,
        income: 0,
        withdrawals: 0,
        rawDate: d
      };
    }

    // 1. Service Requests (completed & released = earned income for doer)
    serviceRequests.forEach((req) => {
      if (req.doerId === currentUserId && req.status === 'released') {
        const date = safeParseDate(req.updatedAt || req.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[monthKey]) {
          dataMap[monthKey].income += req.price || 0;
        }
      }
    });

    // 2. P2P transfers received
    p2pTransfers.forEach((tx) => {
      if (tx.recipientId === currentUserId) {
        const date = safeParseDate(tx.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[monthKey]) {
          dataMap[monthKey].income += tx.amount || 0;
        }
      }
    });

    // 3. Withdrawals completed (or pending)
    withdrawals.forEach((w) => {
      if (w.status !== 'failed' && w.userId === currentUserId) {
        const date = safeParseDate(w.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[monthKey]) {
          dataMap[monthKey].withdrawals += w.amount || 0;
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  };

  const chartData = getMonthlyHistoryData();
  const totalPeriodIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalPeriodWithdrawals = chartData.reduce((sum, d) => sum + d.withdrawals, 0);
  const hasData = totalPeriodIncome > 0 || totalPeriodWithdrawals > 0;

  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-4 text-left" id="earnings-bar-chart-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
          <GeometricDivider variant="accent" />
          Earnings & Withdrawals Progress
        </h3>
        {hasData && (
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Active Growth
          </div>
        )}
      </div>

      {/* Aggregate Indicators */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-[20px] border border-slate-100">
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Income</span>
            <span className="text-xs font-black text-slate-800">R {totalPeriodIncome.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Withdrawn</span>
            <span className="text-xs font-black text-slate-800">R {totalPeriodWithdrawals.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="h-[210px] w-full relative pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="monthName" 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => `R${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', paddingTop: '10px' }}
            />
            <Bar 
              name="Income" 
              dataKey="income" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={16}
            />
            <Bar 
              name="Withdrawals" 
              dataKey="withdrawals" 
              fill="#f43f5e" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-500 text-[10px] font-bold">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Your monthly earnings progress will display here as you complete jobs, accept service requests, and execute wallet withdrawals.</span>
        </div>
      )}
    </div>
  );
}
