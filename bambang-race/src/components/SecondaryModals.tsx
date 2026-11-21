import React, { useState } from 'react';
import {
  ArrowLeft,
  Home,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CHARACTER_MAP } from '../data/characters';
import { MAP_RECORD, MAPS } from '../data/tracks';
import { VEHICLE_MAP } from '../data/vehicles';
import { formatTimeMs } from '../engine/storage';
import { AudioSettings, MapId, PlayerProgress } from '../types/game';

/* ================= LEADERBOARD SCREEN ================= */
interface LeaderboardScreenProps {
  progress: PlayerProgress;
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  progress,
  onBack,
}) => {
  const [filterMap, setFilterMap] = useState<'all' | MapId>('all');
  const entries =
    filterMap === 'all'
      ? progress.leaderboard
      : progress.leaderboard.filter((e) => e.mapId === filterMap);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/70">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase">
          Circuit Leaderboard
        </h1>
        <div className="w-24" />
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMap('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filterMap === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 border border-white/10'
            }`}
          >
            All Circuits
          </button>
          {MAPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterMap(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMap === m.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 border border-white/10'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          {entries.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No times recorded for this circuit yet. Complete a race to set a benchmark!
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono-tabular font-bold text-amber-400 w-7">
                      {idx === 0 ? <Trophy className="w-4 h-4" /> : `#${idx + 1}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-white truncate">
                        {CHARACTER_MAP[entry.characterId]?.name} ·{' '}
                        <span className="text-cyan-400">
                          {MAP_RECORD[entry.mapId]?.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {VEHICLE_MAP[entry.vehicleId]?.name ?? entry.vehicleId}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono-tabular font-bold text-base text-amber-300 shrink-0">
                    {formatTimeMs(entry.timeMs)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= SETTINGS SCREEN ================= */
interface SettingsScreenProps {
  audio: AudioSettings;
  onUpdateAudio: (next: AudioSettings) => void;
  onResetSave: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  audio,
  onUpdateAudio,
  onResetSave,
  onBack,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/70">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase">
          Settings
        </h1>
        <div className="w-24" />
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 space-y-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Audio Controls</h2>
            <button
              onClick={() => onUpdateAudio({ ...audio, muted: !audio.muted })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                audio.muted
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {audio.muted ? (
                <>
                  <VolumeX className="w-4 h-4" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" /> Sound Active
                </>
              )}
            </button>
          </div>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Master Volume</span>
              <span className="font-mono-tabular">
                {Math.round(audio.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.masterVolume}
              onChange={(e) =>
                onUpdateAudio({ ...audio, masterVolume: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Background Music</span>
              <span className="font-mono-tabular">
                {Math.round(audio.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.musicVolume}
              onChange={(e) =>
                onUpdateAudio({ ...audio, musicVolume: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Engine &amp; Race SFX</span>
              <span className="font-mono-tabular">
                {Math.round(audio.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.sfxVolume}
              onChange={(e) =>
                onUpdateAudio({ ...audio, sfxVolume: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg">Saved Progress</h2>
            <p className="text-xs text-slate-400">
              Coins, unlocked vehicles, colors, accessories, and lap times are stored locally in your browser.
            </p>
          </div>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Reset Data
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onResetSave();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= HOW TO PLAY SCREEN ================= */
export const HowToPlayScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/70">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase">
          How to Play
        </h1>
        <div className="w-24" />
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-amber-400">
            Desktop Controls
          </h2>
          <div className="space-y-2.5 text-sm">
            {[
              ['W / Arrow Up', 'Accelerate'],
              ['S / Arrow Down', 'Brake / Reverse'],
              ['A / Arrow Left', 'Turn Left'],
              ['D / Arrow Right', 'Turn Right'],
              ['Spacebar', 'Drift (Charges Boost!)'],
              ['Shift', 'Nitro Boost'],
              ['ESC', 'Pause Race'],
            ].map(([key, action]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-white/10"
              >
                <span className="font-mono-tabular font-bold text-cyan-300">
                  {key}
                </span>
                <span className="text-slate-200">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-cyan-400">
            Mobile &amp; Racing Tips
          </h2>
          <ul className="space-y-3 text-sm text-slate-200 list-disc pl-5">
            <li>
              <strong>Mobile Touch Controls</strong> automatically appear on mobile/tablet screens with dedicated Left/Right steer buttons, Gas, Brake, and Nitro pedals.
            </li>
            <li>
              <strong>Drift for Mini-Turbo</strong>: Hold Spacebar while steering through tight corners in Tondo or Baguio. Releasing a sustained drift gives an instant burst of speed and refills Nitro!
            </li>
            <li>
              <strong>Earn Coins &amp; Unlock Gear</strong>: Every completed race awards coins to unlock Monster Trucks, Futuristic Hyper-GTs, metallic paints, and character accessories.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ================= PAUSE MODAL OVERLAY ================= */
interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onRestart,
  onQuitToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-2xl p-6 space-y-4 text-center">
        <h2 className="font-display font-bold text-3xl text-white uppercase">
          Race Paused
        </h2>
        <p className="text-xs text-slate-400">
          Take a breather or adjust your line before hitting the street again.
        </p>
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-base uppercase inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Race
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Race
          </button>
          <button
            onClick={onQuitToMenu}
            className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
