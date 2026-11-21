import React from 'react';
import { Award, Coins, Home, RotateCcw, Trophy, ArrowRight } from 'lucide-react';
import { CHARACTER_MAP } from '../data/characters';
import { MAP_RECORD } from '../data/tracks';
import { VEHICLE_MAP } from '../data/vehicles';
import { formatTimeMs } from '../engine/storage';
import { ChampionshipState, RaceResultSummary } from '../types/game';
import { Preview3DCanvas } from './Preview3DCanvas';

interface RaceResultsProps {
  result: RaceResultSummary;
  championship: ChampionshipState;
  onPlayAgain: () => void;
  onNextChampionshipRace: () => void;
  onReturnToMenu: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  result,
  championship,
  onPlayAgain,
  onNextChampionshipRace,
  onReturnToMenu,
}) => {
  const playerChar = CHARACTER_MAP[result.characterId];
  const playerVeh = VEHICLE_MAP[result.vehicleId];
  const mapDef = MAP_RECORD[result.mapId];

  const isChampionship = result.mode === 'championship' && championship.active;
  const hasNextRound =
    isChampionship &&
    championship.currentRoundIndex < championship.mapOrder.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-6 py-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Live 3D Winner Podium with Unique Victory Animation */}
        <div className="lg:col-span-5 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 inline-flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Race Winner
            </span>
            <span className="text-xs text-slate-400">{mapDef.name}</span>
          </div>
          <div className="relative flex-1 min-h-[320px]">
            <Preview3DCanvas
              mode="podium"
              characterId={result.winnerCharacterId}
              interactive={true}
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 pt-10">
              <div className="font-display font-bold text-3xl text-amber-400">
                {result.winnerName}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Victory Move: {CHARACTER_MAP[result.winnerCharacterId].victoryMoveName}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Player Summary, Standings & Actions */}
        <div className="lg:col-span-7 bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Race Complete
                </div>
                <h1 className="font-display font-bold text-3xl text-white mt-0.5">
                  {result.position === 1
                    ? '1st Place Victory!'
                    : `Finished #${result.position} of ${result.totalRacers}`}
                </h1>
              </div>
              {result.isNewBest && (
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-display font-bold text-xs uppercase">
                  New Personal Best
                </span>
              )}
            </div>

            {/* Key Result Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-slate-400">Character</div>
                <div className="font-display font-bold text-base text-white truncate">
                  {playerChar.name}
                </div>
              </div>
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-slate-400">Vehicle</div>
                <div className="font-display font-bold text-base text-white truncate">
                  {playerVeh?.name}
                </div>
              </div>
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-slate-400">Finish Time</div>
                <div className="font-mono-tabular font-bold text-base text-cyan-300">
                  {formatTimeMs(result.finishTimeMs)}
                </div>
              </div>
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-slate-400">Rewards</div>
                <div className="font-mono-tabular font-bold text-base text-amber-400 inline-flex items-center gap-1">
                  <Coins className="w-4 h-4" />+{result.coinsEarned}
                </div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Race Standings</span>
                <span>Points Earned: +{result.pointsEarned} pts</span>
              </div>
              <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/10">
                {result.standings.map((row) => (
                  <div
                    key={`${row.characterId}-${row.position}`}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                      row.isPlayer ? 'bg-amber-500/15 font-semibold' : 'bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-tabular font-bold w-6 text-amber-400">
                        #{row.position}
                      </span>
                      <span className="text-white truncate">{row.name}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline truncate">
                        {row.vehicleName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 font-mono-tabular text-xs">
                      <span className="text-slate-300">
                        {row.finishTimeMs !== null ? formatTimeMs(row.finishTimeMs) : '--:--'}
                      </span>
                      <span className="text-amber-300 w-12 text-right">
                        +{row.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Championship Cumulative Standings if active */}
            {isChampionship && (
              <div className="bg-slate-950/80 border border-amber-400/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Championship Round {championship.currentRoundIndex + 1} of{' '}
                    {championship.mapOrder.length}
                  </span>
                  <span>Total Standings</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(championship.pointsByCharacter)
                    .sort((a, b) => b[1] - a[1])
                    .map(([charId, pts], idx) => (
                      <div
                        key={charId}
                        className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg"
                      >
                        <span className="truncate text-slate-200">
                          {idx + 1}. {CHARACTER_MAP[charId as keyof typeof CHARACTER_MAP]?.name ?? charId}
                        </span>
                        <span className="font-mono-tabular font-bold text-amber-400">
                          {pts}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={onReturnToMenu}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4" />
              Return to Main Menu
            </button>
            <button
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
            {hasNextRound && (
              <button
                onClick={onNextChampionshipRace}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Next Circuit
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
