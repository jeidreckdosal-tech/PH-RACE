import React, { useState } from 'react';
import { ArrowLeft, Check, Coins, Lock, RotateCw, Sparkles } from 'lucide-react';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { ACCESSORIES } from '../data/vehicles';
import { AccessoryId, CharacterId, PlayerProgress } from '../types/game';
import { Preview3DCanvas } from './Preview3DCanvas';

interface CharacterSelectProps {
  progress: PlayerProgress;
  onSelectCharacter: (id: CharacterId) => void;
  onSelectAccessory: (id: AccessoryId) => void;
  onUnlockAccessory: (id: AccessoryId, price: number) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  progress,
  onSelectCharacter,
  onSelectAccessory,
  onUnlockAccessory,
  onBack,
}) => {
  const [focusedId, setFocusedId] = useState<CharacterId>(progress.selectedCharacter);
  const [previewPose, setPreviewPose] = useState<'idle' | 'victory'>('idle');

  const focusedChar = CHARACTER_MAP[focusedId];
  const isEquipped = focusedId === progress.selectedCharacter;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/70">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
        <h1 className="font-display font-bold text-xl md:text-2xl uppercase tracking-wide">
          Character Selection
        </h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 font-mono-tabular text-amber-400 text-sm">
          <Coins className="w-4 h-4" />
          <span>{progress.coins}</span>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive 3D Character Viewport */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="relative flex-1 min-h-[340px]">
            <Preview3DCanvas
              mode="character"
              characterId={focusedId}
              accessory={progress.selectedAccessory}
              animMode={previewPose}
              interactive={true}
            />
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/85 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              Drag to rotate 360°
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5 bg-slate-950/90 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setPreviewPose('idle')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  previewPose === 'idle'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Idle Stance
              </button>
              <button
                onClick={() => setPreviewPose('victory')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  previewPose === 'victory'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Victory Pose
              </button>
            </div>
            {/* Name plate directly below character model */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-5 pt-10 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl text-white tracking-wide">
                  {focusedChar.name}
                </h2>
                <p className="text-sm text-amber-400 font-medium">
                  {focusedChar.title} · Victory: {focusedChar.victoryMoveName}
                </p>
              </div>
              <button
                onClick={() => onSelectCharacter(focusedId)}
                className={`px-5 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2 ${
                  isEquipped
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {isEquipped && <Check className="w-4 h-4" />}
                {isEquipped ? 'Selected' : 'Select Character'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: 7 Character Roster + Bio + Accessories */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Roster Grid */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              7 Playable Racers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CHARACTERS.map((ch) => {
                const active = ch.id === focusedId;
                const selected = ch.id === progress.selectedCharacter;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setFocusedId(ch.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-400'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ch.primaryColor }}
                      />
                      {selected && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="font-display font-bold text-base text-white mt-1.5">
                      {ch.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{ch.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Character Details & Stat Bonuses */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-sm text-slate-200">{focusedChar.personality}</p>
            <p className="text-xs text-slate-400">
              Outfit: {focusedChar.outfitDescription}
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-950/70 rounded-xl p-3 border border-white/5">
                <div className="text-xs text-slate-400">Speed Bonus</div>
                <div className="font-mono-tabular font-bold text-lg text-amber-400">
                  +{focusedChar.statBonus.topSpeed}
                </div>
              </div>
              <div className="bg-slate-950/70 rounded-xl p-3 border border-white/5">
                <div className="text-xs text-slate-400">Accel Bonus</div>
                <div className="font-mono-tabular font-bold text-lg text-cyan-400">
                  +{focusedChar.statBonus.acceleration}
                </div>
              </div>
              <div className="bg-slate-950/70 rounded-xl p-3 border border-white/5">
                <div className="text-xs text-slate-400">Handling Bonus</div>
                <div className="font-mono-tabular font-bold text-lg text-emerald-400">
                  +{focusedChar.statBonus.handling}
                </div>
              </div>
            </div>
          </div>

          {/* Character Accessories Shop */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Unlockable Accessories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACCESSORIES.map((acc) => {
                const unlocked = progress.unlockedAccessories.includes(acc.id);
                const equipped = progress.selectedAccessory === acc.id;
                const canAfford = progress.coins >= acc.price;

                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      if (unlocked) {
                        onSelectAccessory(acc.id);
                      } else if (canAfford) {
                        onUnlockAccessory(acc.id, acc.price);
                      }
                    }}
                    disabled={!unlocked && !canAfford}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                      equipped
                        ? 'bg-emerald-500/15 border-emerald-400 cursor-pointer'
                        : unlocked
                          ? 'bg-slate-950/70 border-white/10 hover:border-amber-400/50 cursor-pointer'
                          : canAfford
                            ? 'bg-slate-950/70 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer'
                            : 'bg-slate-950/40 border-white/5 opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {acc.description}
                      </div>
                    </div>
                    {equipped ? (
                      <span className="text-xs font-bold text-emerald-400 shrink-0">
                        Active
                      </span>
                    ) : unlocked ? (
                      <span className="text-xs font-medium text-slate-300 shrink-0">
                        Equip
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-mono-tabular font-bold text-amber-400 shrink-0">
                        <Lock className="w-3 h-3" />
                        {acc.price}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
