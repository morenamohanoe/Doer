import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface EarningsPieChartProps {
  data: { category: string; amount: number }[];
}

export default function EarningsPieChart({ data }: EarningsPieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 160;
    const height = 160;
    const margin = 4;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Color palette matching our brand styling
    const colors = [
      '#10b981', // emerald-500
      '#0ea5e9', // sky-500
      '#8b5cf6', // violet-500
      '#f43f5e', // rose-500
      '#eab308', // yellow-500
      '#f97316', // orange-500
      '#6366f1', // indigo-500
    ];

    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.category))
      .range(colors);

    // Compute positions of each slice
    const pie = d3.pie<{ category: string; amount: number }>()
      .value(d => d.amount)
      .sort(null);

    const data_ready = pie(data);

    // Arc generators
    const arcGenerator = d3.arc<d3.PieArcDatum<{ category: string; amount: number }>>()
      .innerRadius(radius * 0.55) // Clean donut design
      .outerRadius(radius);

    const arcHoverGenerator = d3.arc<d3.PieArcDatum<{ category: string; amount: number }>>()
      .innerRadius(radius * 0.55)
      .outerRadius(radius * 1.06);

    // Draw slices
    const path = svg
      .selectAll('path')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', d => colorScale(d.data.category))
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // Add interactivity
    path.on('mouseover', function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcHoverGenerator);
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arcGenerator);
    });

    // Add center summary text
    const total = data.reduce((sum, d) => sum + d.amount, 0);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .style('font-size', '9px')
      .style('font-weight', '800')
      .style('fill', '#94a3b8')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.04em')
      .text('Total Earned');

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.8em')
      .style('font-size', '13px')
      .style('font-weight', '900')
      .style('fill', '#0f172a')
      .text(`R ${total.toLocaleString()}`);

  }, [data]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 shadow-2xs">
      <div className="relative flex items-center justify-center bg-white p-2 rounded-full shadow-inner border border-slate-100 shrink-0">
        <svg ref={svgRef}></svg>
      </div>

      <div className="space-y-2.5 w-full">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Earning Breakdown</h4>
        <div className="grid grid-cols-1 gap-2">
          {data.map((item, idx) => {
            const colors = [
              '#10b981', // emerald-500
              '#0ea5e9', // sky-500
              '#8b5cf6', // violet-500
              '#f43f5e', // rose-500
              '#eab308', // yellow-500
              '#f97316', // orange-500
              '#6366f1', // indigo-500
            ];
            const color = colors[idx % colors.length];
            const total = data.reduce((sum, d) => sum + d.amount, 0);
            const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;

            return (
              <div key={item.category} className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                  <span className="truncate max-w-[130px]">{item.category}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-950 font-black">R {item.amount}</span>
                  <span className="text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-black">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
