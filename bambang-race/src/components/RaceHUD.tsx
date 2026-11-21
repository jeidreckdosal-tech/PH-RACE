import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Maximize2,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTimeMs } from '../engine/storage';
import { GameMode, RaceHudState, RacerInputState } from '../types/game';

interface RaceHUDProps {
  hud: RaceHudState;
  mode: GameMode;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTouchInput: (partial: Partial<RacerInputState>) => void;
}

function ordinalSuffix(pos: number): string {
  if (pos === 1) return '1st';
  if (pos === 2) return '2nd';
  if (pos === 3) return '3rd';
  return `${pos}th`;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  hud,
  mode,
  muted,
  onPause,
  onToggleMute,
  onToggleFullscreen,
  onTouchInput,
}) => {
  // Compute minimap bounding box dynamically from trackOutline
  const outline = hud.trackOutline;
  let minX = -200;
  let maxX = 200;
  let minZ = -180;
  let maxZ = 180;
  if (outline.length > 0) {
    minX = Math.min(...outline.map((p) => p.x)) - 25;
    maxX = Math.max(...outline.map((p) => p.x)) + 25;
    minZ = Math.min(...outline.map((p) => p.z)) - 25;
    maxZ = Math.max(...outline.map((p) => p.z)) + 25;
  }
  const viewBox = `${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Row: Race Standings + Minimap + Controls */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Telemetry */}
        <div className="bg-slate-950/85 border border-white/15 rounded-xl px-4 py-3 flex items-center gap-5 pointer-events-auto">
          {mode !== 'time_trial' && mode !== 'free_roam' && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Position
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-amber-400 leading-none">
                {ordinalSuffix(hud.position)}
                <span className="text-sm text-slate-400 font-normal">
                  /{hud.totalRacers}
                </span>
              </div>
            </div>
          )}

          {mode !== 'free_roam' && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Lap
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-white leading-none font-mono-tabular">
                {hud.lap}
                <span className="text-sm text-slate-400 font-normal">
                  /{hud.totalLaps}
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Time
            </div>
            <div className="font-mono-tabular font-bold text-lg sm:text-xl text-cyan-300 leading-none mt-1">
              {formatTimeMs(hud.elapsedMs)}
            </div>
          </div>

          <div className="hidden md:block border-l border-white/15 pl-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Location
            </div>
            <div className="text-sm font-semibold text-white truncate max-w-[180px]">
              {hud.currentZoneName}
            </div>
          </div>
        </div>

        {/* Top-Right Minimap & Action Buttons */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          <div className="hidden sm:block w-32 h-24 bg-slate-950/85 border border-white/15 rounded-xl p-1.5">
            <svg viewBox={viewBox} className="w-full h-full">
              {outline.length > 2 && (
                <polygon
                  points={outline.map((p) => `${p.x},${p.z}`).join(' ')}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="16"
                  strokeLinejoin="round"
                />
              )}
              {hud.racers.map((r) => (
                <circle
                  key={r.id}
                  cx={r.trackX}
                  cy={r.trackZ}
                  r={r.isPlayer ? 14 : 9}
                  fill={r.isPlayer ? '#fbbf24' : r.color}
                  stroke="#0f172a"
                  strokeWidth="3"
                />
              ))}
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onToggleMute}
              title={muted ? 'Unmute' : 'Mute'}
              className="p-2.5 rounded-xl bg-slate-950/85 border border-white/15 text-white hover:border-amber-400 cursor-pointer"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onToggleFullscreen}
              title="Fullscreen"
              className="p-2.5 rounded-xl bg-slate-950/85 border border-white/15 text-white hover:border-amber-400 cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onPause}
              title="Pause (ESC)"
              className="p-2.5 rounded-xl bg-slate-950/85 border border-white/15 text-white hover:border-amber-400 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Pause className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-semibold">ESC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center Countdown / Wrong Way Alert */}
      <div className="flex flex-col items-center justify-center my-auto">
        {hud.phase === 'countdown' && (
          <div className="px-10 py-6 rounded-2xl bg-slate-950/85 border border-amber-400/50 text-center">
            <div className="font-display font-bold text-6xl sm:text-8xl text-amber-400 tracking-tight">
              {hud.countdownValue > 0 ? hud.countdownValue : 'GO!'}
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-300 mt-1">
              Get Ready
            </div>
          </div>
        )}

        {hud.wrongWay && hud.phase === 'racing' && (
          <div className="px-6 py-3 rounded-xl bg-rose-600/90 border border-white/30 font-display font-bold text-2xl uppercase tracking-wider text-white">
            Wrong Way — Turn Around
          </div>
        )}
      </div>

      {/* Bottom Row: Mobile Touch Controls + Speedometer & Nitro */}
      <div className="flex items-end justify-between gap-4">
        {/* Left Touch Controls (Visible on mobile/tablet touch viewports) */}
        <div className="flex items-center gap-2.5 md:hidden pointer-events-auto">
          <button
            onPointerDown={() => onTouchInput({ steer: -1 })}
            onPointerUp={() => onTouchInput({ steer: 0 })}
            onPointerLeave={() => onTouchInput({ steer: 0 })}
            onPointerCancel={() => onTouchInput({ steer: 0 })}
            aria-label="Turn Left"
            className="touch-control-btn w-16 h-16 rounded-2xl bg-slate-950/85 border border-white/20 flex items-center justify-center active:bg-amber-500 active:text-slate-950"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onPointerDown={() => onTouchInput({ steer: 1 })}
            onPointerUp={() => onTouchInput({ steer: 0 })}
            onPointerLeave={() => onTouchInput({ steer: 0 })}
            onPointerCancel={() => onTouchInput({ steer: 0 })}
            aria-label="Turn Right"
            className="touch-control-btn w-16 h-16 rounded-2xl bg-slate-950/85 border border-white/20 flex items-center justify-center active:bg-amber-500 active:text-slate-950"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Desktop Controls Reminder (subtle bottom-left) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300">
          <span>WASD / Arrows: Drive</span>
          <span aria-hidden="true">·</span>
          <span>Space: Drift</span>
          <span aria-hidden="true">·</span>
          <span>Shift: Nitro</span>
          <span aria-hidden="true">·</span>
          <span>ESC: Pause</span>
        </div>

        {/* Right Speedometer + Mobile Pedals */}
        <div className="flex items-end gap-3">
          {/* Speedometer & Nitro Gauge */}
          <div className="bg-slate-950/85 border border-white/15 rounded-xl px-4 py-3 min-w-[155px] space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display font-bold text-3xl sm:text-4xl text-white font-mono-tabular leading-none">
                {hud.speedKmh}
              </span>
              <span className="text-xs font-semibold text-slate-400">KM/H</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1 text-cyan-300">
                  <Flame className="w-3 h-3" />
                  Nitro
                </span>
                <span className="font-mono-tabular text-slate-300">
                  {hud.nitro}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    hud.isNitroActive ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${hud.nitro}%` }}
                />
              </div>
            </div>

            {hud.isDrifting && (
              <div className="text-[11px] font-display font-bold uppercase tracking-wider text-amber-400">
                Drifting + Boost
              </div>
            )}
          </div>

          {/* Mobile Action Pedals */}
          <div className="flex items-end gap-2 md:hidden pointer-events-auto">
            <div className="flex flex-col gap-2">
              <button
                onPointerDown={() => onTouchInput({ nitro: true })}
                onPointerUp={() => onTouchInput({ nitro: false })}
                onPointerLeave={() => onTouchInput({ nitro: false })}
                onPointerCancel={() => onTouchInput({ nitro: false })}
                className="touch-control-btn px-3 py-2.5 rounded-xl bg-cyan-500/90 text-slate-950 font-display font-bold text-xs uppercase"
              >
                Nitro
              </button>
              <button
                onPointerDown={() => onTouchInput({ brake: 1 })}
                onPointerUp={() => onTouchInput({ brake: 0 })}
                onPointerLeave={() => onTouchInput({ brake: 0 })}
                onPointerCancel={() => onTouchInput({ brake: 0 })}
                className="touch-control-btn px-3 py-3 rounded-xl bg-rose-600/90 text-white font-display font-bold text-xs uppercase"
              >
                Brake
              </button>
            </div>
            <button
              onPointerDown={() => onTouchInput({ throttle: 1 })}
              onPointerUp={() => onTouchInput({ throttle: 0 })}
              onPointerLeave={() => onTouchInput({ throttle: 0 })}
              onPointerCancel={() => onTouchInput({ throttle: 0 })}
              className="touch-control-btn w-16 h-20 rounded-2xl bg-emerald-500/90 text-slate-950 font-display font-bold text-sm uppercase"
            >
              Gas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
