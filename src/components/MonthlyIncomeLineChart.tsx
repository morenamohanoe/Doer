import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { GeometricDivider } from './GeometricDivider';

interface MonthlyIncomeLineChartProps {
  serviceRequests: any[];
  p2pTransfers: any[];
  currentUserId: string;
}

const safeParseDate = (val: any): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (val && typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch (e) {}
  }
  if (val && typeof val.seconds === 'number') {
    try {
      const d = new Date(val.seconds * 1000);
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch (e) {}
  }
  try {
    const d = new Date(val);
    if (d instanceof Date && !isNaN(d.getTime())) return d;
  } catch (e) {}
  return new Date();
};

export default function MonthlyIncomeLineChart({
  serviceRequests = [],
  p2pTransfers = [],
  currentUserId,
}: MonthlyIncomeLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ monthName: string; income: number; x: number; y: number } | null>(null);

  const getMonthlyIncomeData = () => {
    const dataMap: { [key: string]: { monthName: string; income: number; rawDate: Date } } = {};
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString([], { month: 'short' });
      dataMap[monthKey] = {
        monthName,
        income: 0,
        rawDate: d,
      };
    }

    // Sum service request incomes (released = earned by doer)
    serviceRequests.forEach((req) => {
      if (req.doerId === currentUserId && req.status === 'released') {
        const date = safeParseDate(req.updatedAt || req.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[monthKey]) {
          dataMap[monthKey].income += req.price || 0;
        }
      }
    });

    // Sum P2P transfers received
    p2pTransfers.forEach((tx) => {
      if (tx.recipientId === currentUserId) {
        const date = safeParseDate(tx.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dataMap[monthKey]) {
          dataMap[monthKey].income += tx.amount || 0;
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  };

  const chartData = getMonthlyIncomeData();
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const maxIncome = d3.max(chartData, (d) => d.income) || 0;

  useEffect(() => {
    if (!svgRef.current) return;

    // Set width and height dynamically based on container, default to nice dimensions
    const width = 500;
    const height = 220;
    const padding = { top: 25, right: 35, bottom: 35, left: 55 };

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', '100%');

    // Scales
    const xScale = d3.scalePoint()
      .domain(chartData.map(d => d.monthName))
      .range([padding.left, width - padding.right]);

    // Give some breathing room on top of max income
    const yScale = d3.scaleLinear()
      .domain([0, maxIncome === 0 ? 1000 : maxIncome * 1.15])
      .range([height - padding.bottom, padding.top]);

    // Gridlines (Y axis)
    const yGrid = d3.axisLeft(yScale)
      .ticks(4)
      .tickSize(-width + padding.left + padding.right)
      .tickFormat(() => '');

    svg.append('g')
      .attr('class', 'y-grid')
      .attr('transform', `translate(${padding.left}, 0)`)
      .call(yGrid)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 1.5)
      );

    // Gradient definitions
    const defs = svg.append('defs');

    // Line gradient
    const lineGrad = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    lineGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981'); // emerald-500
    lineGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6'); // blue-500

    // Area gradient
    const areaGrad = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.22);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    svg.append('g')
      .attr('transform', `translate(0, ${height - padding.bottom})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#cbd5e1').attr('stroke-width', 1))
      .call(g => g.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('dy', '0.8em')
      );

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(4)
      .tickFormat(d => `R ${(d as number) >= 1000 ? ((d as number) / 1000).toFixed(0) + 'k' : d}`);

    svg.append('g')
      .attr('transform', `translate(${padding.left}, 0)`)
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('dx', '-0.5em')
      );

    // Area Generator
    const area = d3.area<{ monthName: string; income: number }>()
      .x(d => xScale(d.monthName) || 0)
      .y0(height - padding.bottom)
      .y1(d => yScale(d.income))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(chartData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Line Generator
    const line = d3.line<{ monthName: string; income: number }>()
      .x(d => xScale(d.monthName) || 0)
      .y(d => yScale(d.income))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Dots and Interactive Overlay triggers
    const dotsGroup = svg.append('g').attr('class', 'dots');
    
    chartData.forEach((d) => {
      const cx = xScale(d.monthName) || 0;
      const cy = yScale(d.income);

      // Pulse ring for points with income
      if (d.income > 0) {
        dotsGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 2.5)
          .attr('class', 'pulse-ring')
          .style('animation', 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite');
      }

      // Solid inner point
      const point = dotsGroup.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4.5)
        .attr('fill', '#ffffff')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3.5)
        .style('cursor', 'pointer')
        .style('transition', 'r 0.15s ease-in-out');

      // Hover trigger zone
      dotsGroup.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 16)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          point.transition().duration(100).attr('r', 6.5).attr('fill', '#10b981').attr('stroke', '#ffffff');
          setHoveredPoint({
            monthName: d.monthName,
            income: d.income,
            x: cx,
            y: cy - 12
          });
        })
        .on('mouseleave', () => {
          point.transition().duration(100).attr('r', 4.5).attr('fill', '#ffffff').attr('stroke', '#10b981');
          setHoveredPoint(null);
        });
    });

  }, [chartData, maxIncome]);

  const hasEarnings = totalIncome > 0;

  return (
    <div ref={containerRef} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-4 text-left relative" id="income-trend-line-chart-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <GeometricDivider variant="accent" />
            6-Month Income Trends
          </h3>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
            D3 visual representation of your monthly completed jobs and earnings growth.
          </p>
        </div>
        {hasEarnings && (
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Growth Graph
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-[20px] border border-slate-100">
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Period</span>
            <span className="text-xs font-black text-slate-800 block">Last 6 Months</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Invoiced</span>
            <span className="text-xs font-black text-emerald-600 block">R {totalIncome.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[220px] bg-slate-50/20 rounded-2xl border border-slate-100/60 p-2 overflow-hidden select-none">
        {hasEarnings ? (
          <>
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
            
            {/* Custom Tooltip overlay */}
            {hoveredPoint && (
              <div 
                className="absolute z-30 pointer-events-none bg-slate-900 text-white px-2.5 py-1.5 rounded-xl shadow-xl text-[10px] font-bold flex flex-col space-y-0.5 border border-slate-800 transition-all duration-100 -translate-x-1/2 -translate-y-full"
                style={{ 
                  left: `${(hoveredPoint.x / 500) * 100}%`, 
                  top: `${(hoveredPoint.y / 220) * 100 - 4}%` 
                }}
              >
                <span className="text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">{hoveredPoint.monthName} Income</span>
                <span className="text-emerald-400 font-black text-xs">R {hoveredPoint.income.toLocaleString()}</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-700">No Earnings Trend Data</span>
            <p className="text-[10px] text-slate-400 font-bold max-w-[240px] leading-relaxed mt-1">
              Monthly trends will compile automatically as secure escrow payouts or transfer deposits are received.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
