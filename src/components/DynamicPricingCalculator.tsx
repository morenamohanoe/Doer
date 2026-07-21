import React, { useState } from 'react';
import { Calculator, Info, Route, Sparkles, Wrench } from 'lucide-react';

interface DynamicPricingCalculatorProps {
  hourlyRate: number;
}

export default function DynamicPricingCalculator({ hourlyRate }: DynamicPricingCalculatorProps) {
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [materialsCost, setMaterialsCost] = useState<number>(350);
  const [includeTravel, setIncludeTravel] = useState<boolean>(true);
  const [travelDistance, setTravelDistance] = useState<number>(20);

  // Fallback to average rate if none entered or is invalid
  const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 180;

  // Calculation parameters based on South African service averages
  const complexityMultiplier = {
    simple: 1.0,   // standard labor
    medium: 1.25,  // standard labor + minor contingency & setup
    complex: 1.5   // specialized tools, higher liability, strict margins
  };

  const travelRatePerKm = 5.50; // ZAR standard AA rate
  const basicCalloutFee = 250;  // Standard SA artisan call-out fee

  // Real-time calculations
  const baseLabour = durationHours * rate;
  const complexityMarkup = baseLabour * (complexityMultiplier[complexity] - 1);
  const totalLabour = baseLabour + complexityMarkup;
  
  const travelCost = includeTravel ? (basicCalloutFee + (travelDistance * travelRatePerKm)) : 0;
  
  const baseTotal = totalLabour + Number(materialsCost) + travelCost;
  
  // Service fee calculations (5% DOER platform matching charge)
  const platformFee = baseTotal * 0.05;

  // Estimate a realistic quote range
  const minEstimate = Math.round(baseTotal * 0.95);
  const maxEstimate = Math.round(baseTotal * 1.15);

  return (
    <div className="bg-slate-50/80 p-4 border border-slate-200/60 rounded-xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-brand-light text-brand rounded-lg">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-black text-slate-800 text-xs">Dynamic Quote Range Calculator</h5>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Optimize your rates for local projects
            </p>
          </div>
        </div>
        <span className="bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          Rate: R{rate}/hr
        </span>
      </div>

      <div className="space-y-3.5">
        {/* Job Complexity Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3 text-slate-400" /> Job Complexity & Markup
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'simple', label: 'Simple', desc: 'No markup (1.0x)', color: 'border-slate-200 hover:border-slate-300' },
              { id: 'medium', label: 'Medium', desc: 'Contingency (1.25x)', color: 'border-slate-200 hover:border-slate-300' },
              { id: 'complex', label: 'Complex', desc: 'Premium risk (1.5x)', color: 'border-slate-200 hover:border-slate-300' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setComplexity(opt.id as any)}
                className={`p-2 border rounded-xl text-center cursor-pointer transition-all ${
                  complexity === opt.id
                    ? 'border-brand bg-brand-light/35 ring-1 ring-brand'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className={`text-[10px] font-black block ${complexity === opt.id ? 'text-brand-dark' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
                <span className="text-[8px] text-slate-400 font-semibold block mt-0.5 leading-none">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Estimated duration slider */}
          <div className="space-y-1 bg-white p-2.5 border border-slate-100 rounded-xl">
            <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 uppercase">
              <span>Estimated Hours</span>
              <span className="text-slate-800 font-black">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand"
            />
          </div>

          {/* Materials Cost input */}
          <div className="space-y-1 bg-white p-2.5 border border-slate-100 rounded-xl">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase block">
              Estimated Materials Cost (ZAR)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-400 text-xs font-black">R</span>
              <input
                type="number"
                min="0"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(Math.max(0, Number(e.target.value)))}
                className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Travel and Callout options */}
        <div className="bg-white p-3 border border-slate-100 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Route className="w-3.5 h-3.5 text-slate-400" /> Include Travel & Callout Fee
            </span>
            <input
              type="checkbox"
              checked={includeTravel}
              onChange={(e) => setIncludeTravel(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
            />
          </div>

          {includeTravel && (
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                  <span>Travel Distance</span>
                  <span className="text-slate-700 font-bold">{travelDistance} km (Return)</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={travelDistance}
                  onChange={(e) => setTravelDistance(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-600"
                />
              </div>
              <div className="bg-slate-50 px-2 py-1 rounded text-right flex-shrink-0">
                <span className="text-[8px] text-slate-400 font-black uppercase block">Estimated Travel</span>
                <span className="text-[10px] text-slate-800 font-bold">R{Math.round(travelCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quote Estimates & Cost Breakdown */}
        <div className="p-3 bg-zinc-950 text-white rounded-xl space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand" /> Estimated Quote Range
            </span>
            <span className="text-[8px] font-extrabold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Highly Competitive
            </span>
          </div>

          {/* Estimated Range Value */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-lg sm:text-xl font-black text-white">
                R{minEstimate} - R{maxEstimate}
              </span>
              <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">
                (Inclusive of materials, contingency buffer, and travel)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-zinc-300 block">
                Avg: R{Math.round((minEstimate + maxEstimate) / 2)}
              </span>
              <span className="text-[8px] text-zinc-500 font-medium block">
                Total Project Estimate
              </span>
            </div>
          </div>

          {/* Micro Cost Breakdown */}
          <div className="pt-2.5 border-t border-zinc-800 grid grid-cols-4 gap-2 text-[8px] font-black uppercase text-zinc-400">
            <div>
              <span>Labour:</span>
              <span className="text-zinc-200 font-extrabold block mt-0.5">R{Math.round(totalLabour)}</span>
            </div>
            <div>
              <span>Materials:</span>
              <span className="text-zinc-200 font-extrabold block mt-0.5">R{materialsCost}</span>
            </div>
            <div>
              <span>Travel:</span>
              <span className="text-zinc-200 font-extrabold block mt-0.5">R{Math.round(travelCost)}</span>
            </div>
            <div className="text-right">
              <span>DOER match fee (5%):</span>
              <span className="text-brand font-extrabold block mt-0.5">R{Math.round(platformFee)}</span>
            </div>
          </div>
        </div>

        {/* SA Artisan Market Tips Banner */}
        <div className="p-2.5 bg-brand-light/30 border border-brand/10 rounded-xl flex items-start gap-2 text-[9px] leading-tight font-semibold text-slate-700">
          <Info className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-extrabold text-brand-dark">Artisan rate tip: </span> 
            Average handyman/carpentry rates in South Africa range from R150 to R350/hr, whereas certified plumbers, tilers, and electrical contractors can charge R350 to R750/hr depending on city density.
          </p>
        </div>
      </div>
    </div>
  );
}
