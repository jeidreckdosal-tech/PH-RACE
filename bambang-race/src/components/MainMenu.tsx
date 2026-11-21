import React from 'react';
import {
  Award,
  Car,
  Coins,
  Flag,
  Gamepad2,
  HelpCircle,
  MapPin,
  Maximize2,
  Play,
  Settings,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { MAP_RECORD } from '../data/tracks';
import { VEHICLE_MAP } from '../data/vehicles';
import { PlayerProgress, ScreenState } from '../types/game';
import { BambangLogo } from './BambangLogo';
import { Preview3DCanvas } from './Preview3DCanvas';

interface MainMenuProps {
  progress: PlayerProgress;
  onNavigate: (screen: ScreenState) => void;
  onPlayNow: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
}

const MODE_LABELS: Record<PlayerProgress['selectedMode'], string> = {
  quick: 'Quick Race',
  championship: 'Championship',
  time_trial: 'Time Trial',
  free_roam: 'Free Roam',
};

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onNavigate,
  onPlayNow,
  onToggleMute,
  onToggleFullscreen,
}) => {
  const activeChar = CHARACTER_MAP[progress.selectedCharacter];
  const activeVeh = VEHICLE_MAP[progress.selectedVehicle];
  const activeMap = MAP_RECORD[progress.selectedMap];

  return (
    <div className="relative w-full h-full min-h-screen overflow-y-auto bg-slate-950 text-white flex flex-col">
      {/* Live Animated 3D Showcase Background with all 7 characters */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <Preview3DCanvas mode="lineup" interactive={false} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(9,13,22,0.82) 0%, rgba(9,13,22,0.32) 45%, rgba(9,13,22,0.94) 100%)',
          }}
        />
      </div>

      {/* Top Header Bar (Strict 3-Zone Contract) */}
      <header className="relative z-10 flex items-center justify-between gap-6 px-6 md:px-10 py-5 border-b border-white/10 bg-slate-950/75">
        <BambangLogo size="sm" />

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('characters')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Characters
          </button>
          <button
            onClick={() => onNavigate('vehicles')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Vehicles
          </button>
          <button
            onClick={() => onNavigate('maps')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Maps
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Leaderboard
          </button>
          <button
            onClick={() => onNavigate('how_to_play')}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How to Play
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-sm font-mono-tabular text-amber-400">
            <Coins className="w-4 h-4 shrink-0" />
            <span>{progress.coins}</span>
          </div>
          <button
            onClick={onToggleMute}
            title={progress.audio.muted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={progress.audio.muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 rounded-lg bg-slate-900 border border-white/10 text-slate-200 hover:border-amber-400/50 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {progress.audio.muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
            className="p-2.5 rounded-lg bg-slate-900 border border-white/10 text-slate-200 hover:border-amber-400/50 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 md:px-10 py-8 flex flex-col justify-between gap-8">
        {/* Hero Headline & Primary CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-2">
          <div className="lg:col-span-7 space-y-5">
            <BambangLogo size="lg" />
            <p className="text-base md:text-lg text-slate-200 max-w-xl leading-relaxed">
              Arcade 3D street racing across Tondo, Manila, Intramuros, BGC, Makati, Cebu, and Baguio. Drift corners, fire nitro, and claim the Philippine street championship.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={onPlayNow}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xl tracking-wide uppercase shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-slate-950" />
                Play Now
              </button>
              <button
                onClick={() => onNavigate('modes')}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-white font-semibold text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                Game Modes
              </button>
            </div>
          </div>

          {/* Current Loadout Summary Card */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-white/15 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Active Race Setup
              </span>
              <span className="text-xs text-slate-400 font-mono-tabular">
                {progress.totalWins} Wins · {progress.totalRaces} Races
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-400">Character</div>
                <div className="font-display font-bold text-white text-base truncate">
                  {activeChar.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Vehicle</div>
                <div className="font-display font-bold text-white text-base truncate">
                  {activeVeh?.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Circuit</div>
                <div className="font-semibold text-cyan-300 truncate">
                  {activeMap.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Mode</div>
                <div className="font-semibold text-amber-300 truncate">
                  {MODE_LABELS[progress.selectedMode]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Character Roster Strip (Displayed above the Menu Navigation) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Meet the 7 Racers</span>
            <span>Click any racer to inspect in 3D</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {CHARACTERS.map((ch) => {
              const isSelected = ch.id === progress.selectedCharacter;
              return (
                <button
                  key={ch.id}
                  onClick={() => onNavigate('characters')}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ch.primaryColor }}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-display font-bold text-sm mt-1 truncate">
                    {ch.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {ch.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Main Menu Action Grid */}
        <section aria-label="Main Menu Navigation" className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          <button
            onClick={() => onNavigate('characters')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Character Selection
              </div>
              <div className="text-xs text-slate-400 truncate">7 original drivers</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('vehicles')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <Car className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Vehicle Selection
              </div>
              <div className="text-xs text-slate-400 truncate">Cars, bikes, karts &amp; more</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('maps')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Map Selection
              </div>
              <div className="text-xs text-slate-400 truncate">Tondo &amp; 6 PH circuits</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('modes')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <Flag className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Game Modes
              </div>
              <div className="text-xs text-slate-400 truncate">Race, Tour, Trial, Roam</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Leaderboard
              </div>
              <div className="text-xs text-slate-400 truncate">Track records &amp; times</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-300 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                Settings
              </div>
              <div className="text-xs text-slate-400 truncate">Audio &amp; save data</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('how_to_play')}
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-400/50 transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white truncate">
                How to Play
              </div>
              <div className="text-xs text-slate-400 truncate">Controls &amp; drift tips</div>
            </div>
          </button>

          <button
            onClick={onPlayNow}
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition-colors text-left cursor-pointer"
          >
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-amber-300 truncate">
                Quick Launch
              </div>
              <div className="text-xs text-amber-200/80 truncate">Start {activeMap.name}</div>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
};
