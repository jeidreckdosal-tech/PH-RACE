import React from 'react';
import { ArrowLeft, Check, Clock, MapPin, Play } from 'lucide-react';
import { MAPS } from '../data/tracks';
import { formatTimeMs } from '../engine/storage';
import { MapId, PlayerProgress } from '../types/game';

interface MapSelectProps {
  progress: PlayerProgress;
  onSelectMap: (id: MapId) => void;
  onStartRace: (id: MapId) => void;
  onBack: () => void;
}

export const MapSelect: React.FC<MapSelectProps> = ({
  progress,
  onSelectMap,
  onStartRace,
  onBack,
}) => {
  const selectedMap = MAPS.find((m) => m.id === progress.selectedMap) ?? MAPS[0];

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
          Philippine Circuits
        </h1>
        <div className="text-xs text-slate-400 hidden sm:block">
          Fictional circuits inspired by real PH landmarks
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7 Maps List */}
        <div className="lg:col-span-5 space-y-2.5">
          {MAPS.map((map) => {
            const active = map.id === progress.selectedMap;
            const bestMs = progress.bestTimesMs[map.id];
            return (
              <button
                key={map.id}
                onClick={() => onSelectMap(map.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/20 border-amber-400'
                    : 'bg-slate-900 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-cyan-400">
                    {map.region}
                  </span>
                  {bestMs !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono-tabular text-amber-300">
                      <Clock className="w-3 h-3" />
                      {formatTimeMs(bestMs)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-display font-bold text-lg text-white">
                    {map.name}
                  </span>
                  {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {map.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Map Spotlight & Landmarks */}
        <div className="lg:col-span-7 bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {selectedMap.region}
                </div>
                <h2 className="font-display font-bold text-3xl text-white mt-0.5">
                  {selectedMap.name}
                </h2>
              </div>
              <div className="text-right font-mono-tabular">
                <div className="text-xs text-slate-400">Circuit Distance</div>
                <div className="text-lg font-bold text-white">
                  {selectedMap.laps} Laps
                </div>
              </div>
            </div>

            {/* Clean SVG Track Minimap Preview */}
            <div className="bg-slate-950 border border-white/10 rounded-xl p-5 flex items-center justify-center h-52">
              <svg viewBox="-230 -190 460 380" className="w-full h-full max-h-44">
                <polygon
                  points={selectedMap.waypoints
                    .map(([x, , z]) => `${x},${z}`)
                    .join(' ')}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="22"
                  strokeLinejoin="round"
                />
                <polygon
                  points={selectedMap.waypoints
                    .map(([x, , z]) => `${x},${z}`)
                    .join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <circle
                  cx={selectedMap.waypoints[0][0]}
                  cy={selectedMap.waypoints[0][2]}
                  r="10"
                  fill="#22d3ee"
                />
              </svg>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedMap.description}
            </p>

            {/* Featured Locations / Streets */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Featured Locations &amp; Landmarks
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {selectedMap.featuredStreets.map((street) => (
                  <div
                    key={street}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-xs font-medium text-slate-200"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{street}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400 max-w-sm">
              Note: Fictional closed-circuit arcade routes inspired by real Philippine neighborhoods.
            </p>
            <button
              onClick={() => onStartRace(selectedMap.id)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              Race {selectedMap.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
