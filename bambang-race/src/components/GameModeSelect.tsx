import React from 'react';
import { ArrowLeft, Check, Compass, Crown, Flag, Play, Timer } from 'lucide-react';
import { GameMode, PlayerProgress } from '../types/game';

interface GameModeSelectProps {
  progress: PlayerProgress;
  onSelectMode: (mode: GameMode) => void;
  onLaunchMode: (mode: GameMode) => void;
  onBack: () => void;
}

const MODES: {
  id: GameMode;
  title: string;
  subtitle: string;
  description: string;
  details: string;
  icon: React.FC<{ className?: string }>;
  accent: string;
}[] = [
  {
    id: 'quick',
    title: 'Quick Race',
    subtitle: 'Instant 6-Racer Arcade Action',
    description:
      'Jump straight onto your chosen Philippine circuit against 5 competitive AI rivals across 3 high-speed laps.',
    details: '3 Laps · 6 Racers · Coin Rewards',
    icon: Flag,
    accent: 'text-amber-400',
  },
  {
    id: 'championship',
    title: 'Championship',
    subtitle: '3-Race Philippine Grand Prix',
    description:
      'Compete across Tondo, Manila City, and BGC Taguig in a multi-round points tournament to crown the overall champion.',
    details: '3 Circuits · Cumulative Points · Bonus Trophy Coins',
    icon: Crown,
    accent: 'text-yellow-400',
  },
  {
    id: 'time_trial',
    title: 'Time Trial',
    subtitle: 'Beat Your Personal Best',
    description:
      'Solo 3-lap qualifying sprint with an open track. Master apex drifts and nitro zones to set new circuit records.',
    details: '3 Laps · Solo · Leaderboard Records',
    icon: Timer,
    accent: 'text-cyan-400',
  },
  {
    id: 'free_roam',
    title: 'Free Roam',
    subtitle: 'Explore Philippine Streets',
    description:
      'No lap limits or opponents. Cruise through Moriones Street, Plaza Moriones, Santo Niño de Tondo, and Manila Bay at your own pace.',
    details: 'Unlimited · Sightseeing · Practice Drifting',
    icon: Compass,
    accent: 'text-emerald-400',
  },
];

export const GameModeSelect: React.FC<GameModeSelectProps> = ({
  progress,
  onSelectMode,
  onLaunchMode,
  onBack,
}) => {
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
          Game Modes
        </h1>
        <div className="w-24" />
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col justify-between gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = progress.selectedMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectMode(m.id)}
                className={`p-6 rounded-2xl border flex flex-col justify-between gap-5 transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/15 border-amber-400'
                    : 'bg-slate-900 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${m.accent}`} />
                      <div>
                        <h2 className="font-display font-bold text-2xl text-white">
                          {m.title}
                        </h2>
                        <div className="text-xs font-medium text-slate-400">
                          {m.subtitle}
                        </div>
                      </div>
                    </div>
                    {active && <Check className="w-5 h-5 text-amber-400" />}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                  <span className="text-xs text-slate-400 font-medium">
                    {m.details}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLaunchMode(m.id);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            Engine Architecture: Deterministic input/snapshot contracts (`RacerInputState` &amp; `NetworkTransportAdapter`) are ready for future real-time online multiplayer integration.
          </span>
        </div>
      </div>
    </div>
  );
};
