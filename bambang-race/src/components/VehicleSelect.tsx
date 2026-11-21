import React, { useState } from 'react';
import { ArrowLeft, Check, Coins, Lock, RotateCw } from 'lucide-react';
import { PAINT_COLORS, VEHICLE_MAP, VEHICLES } from '../data/vehicles';
import {
  PlayerProgress,
  VehicleCategory,
  VehicleLivery,
} from '../types/game';
import { Preview3DCanvas } from './Preview3DCanvas';

interface VehicleSelectProps {
  progress: PlayerProgress;
  onSelectVehicle: (id: string) => void;
  onUnlockVehicle: (id: string, price: number) => void;
  onSelectColor: (hex: string) => void;
  onUnlockColor: (hex: string, price: number) => void;
  onSelectLivery: (livery: VehicleLivery) => void;
  onBack: () => void;
}

const CATEGORIES: { id: 'all' | VehicleCategory; label: string }[] = [
  { id: 'all', label: 'All Classes' },
  { id: 'sports_car', label: 'Sports Cars' },
  { id: 'motorcycle', label: 'Motorcycles' },
  { id: 'go_kart', label: 'Go-Karts' },
  { id: 'monster_truck', label: 'Monster Trucks' },
  { id: 'futuristic', label: 'Futuristic' },
];

const LIVERIES: { id: VehicleLivery; label: string }[] = [
  { id: 'solid', label: 'Clean Gloss' },
  { id: 'stripes', label: 'Racing Stripes' },
  { id: 'jeepney', label: 'Jeepney Fiesta' },
  { id: 'checkered', label: 'Checkered GP' },
];

export const VehicleSelect: React.FC<VehicleSelectProps> = ({
  progress,
  onSelectVehicle,
  onUnlockVehicle,
  onSelectColor,
  onUnlockColor,
  onSelectLivery,
  onBack,
}) => {
  const [filter, setFilter] = useState<'all' | VehicleCategory>('all');
  const [focusedId, setFocusedId] = useState<string>(progress.selectedVehicle);

  const focusedVeh = VEHICLE_MAP[focusedId] || VEHICLES[0];
  const isUnlocked = progress.unlockedVehicles.includes(focusedVeh.id);
  const isEquipped = progress.selectedVehicle === focusedVeh.id;
  const canAfford = progress.coins >= focusedVeh.price;

  const filteredVehicles =
    filter === 'all'
      ? VEHICLES
      : VEHICLES.filter((v) => v.category === filter);

  const statRows = [
    { label: 'Maximum Speed', val: focusedVeh.stats.topSpeed, color: 'bg-amber-400' },
    { label: 'Acceleration', val: focusedVeh.stats.acceleration, color: 'bg-cyan-400' },
    { label: 'Handling', val: focusedVeh.stats.handling, color: 'bg-emerald-400' },
    { label: 'Braking Performance', val: focusedVeh.stats.braking, color: 'bg-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/70">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase tracking-wide">
          Vehicle Garage
        </h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 font-mono-tabular text-amber-400 text-sm">
          <Coins className="w-4 h-4" />
          <span>{progress.coins}</span>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Live 3D Vehicle + Character Preview */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="relative flex-1 min-h-[340px]">
            <Preview3DCanvas
              mode="vehicle"
              characterId={progress.selectedCharacter}
              vehicleId={focusedVeh.id}
              colorHex={progress.selectedColor}
              livery={progress.selectedLivery}
              accessory={progress.selectedAccessory}
              interactive={true}
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/85 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              Drag to inspect 360°
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-5 pt-10 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {focusedVeh.categoryLabel}
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                  {focusedVeh.name}
                </h2>
              </div>

              {isUnlocked ? (
                <button
                  onClick={() => onSelectVehicle(focusedVeh.id)}
                  className={`px-5 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2 ${
                    isEquipped
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {isEquipped && <Check className="w-4 h-4" />}
                  {isEquipped ? 'Selected' : 'Select Vehicle'}
                </button>
              ) : (
                <button
                  onClick={() => canAfford && onUnlockVehicle(focusedVeh.id, focusedVeh.price)}
                  disabled={!canAfford}
                  className={`px-5 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Unlock · {focusedVeh.price} Coins
                </button>
              )}
            </div>
          </div>

          {/* Performance Specs */}
          <div className="p-5 border-t border-white/10 space-y-3 bg-slate-900">
            <p className="text-xs text-slate-300">{focusedVeh.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {statRows.map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="font-mono-tabular font-bold text-white">
                      {row.val}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-300`}
                      style={{ width: `${row.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Vehicle Class Tabs, List, Paint & Livery */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Category Filter */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === cat.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {filteredVehicles.map((v) => {
                const unlocked = progress.unlockedVehicles.includes(v.id);
                const active = v.id === focusedId;
                const equipped = v.id === progress.selectedVehicle;

                return (
                  <button
                    key={v.id}
                    onClick={() => setFocusedId(v.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400'
                        : 'bg-slate-950/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-cyan-400">
                        {v.categoryLabel}
                      </span>
                      {equipped ? (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          Active
                        </span>
                      ) : !unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-amber-400">
                          <Lock className="w-3 h-3" />
                          {v.price}
                        </span>
                      ) : null}
                    </div>
                    <div className="font-display font-bold text-base text-white mt-0.5 truncate">
                      {v.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paint Color Customization */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Paint Finish
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {PAINT_COLORS.map((c) => {
                const unlocked = progress.unlockedColors.includes(c.hex);
                const selected = progress.selectedColor === c.hex;
                const affordable = progress.coins >= c.price;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (unlocked) onSelectColor(c.hex);
                      else if (affordable) onUnlockColor(c.hex, c.price);
                    }}
                    disabled={!unlocked && !affordable}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors ${
                      selected
                        ? 'bg-slate-800 border-amber-400 cursor-pointer'
                        : unlocked || affordable
                          ? 'bg-slate-950/60 border-white/10 hover:border-white/30 cursor-pointer'
                          : 'bg-slate-950/30 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-md border border-white/25 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {c.name}
                      </div>
                      {!unlocked && (
                        <div className="text-[11px] font-mono-tabular text-amber-400">
                          {c.price} coins
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Livery Designs */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Racing Design &amp; Livery
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LIVERIES.map((liv) => (
                <button
                  key={liv.id}
                  onClick={() => onSelectLivery(liv.id)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    progress.selectedLivery === liv.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {liv.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
