import React, { useEffect, useRef, useState } from 'react';
import { MAP_RECORD } from '../data/tracks';
import { RaceEngine } from '../engine/RaceEngine';
import {
  AccessoryId,
  CharacterId,
  GameMode,
  MapId,
  RaceHudState,
  RaceResultSummary,
  RacerInputState,
  VehicleLivery,
} from '../types/game';
import { LoadingScreen } from './LoadingScreen';
import { RaceHUD } from './RaceHUD';
import { PauseOverlay } from './SecondaryModals';

interface RaceViewportProps {
  mapId: MapId;
  mode: GameMode;
  characterId: CharacterId;
  vehicleId: string;
  colorHex: string;
  livery: VehicleLivery;
  accessory: AccessoryId;
  muted: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onRaceFinish: (result: RaceResultSummary) => void;
  onQuitToMenu: () => void;
}

export const RaceViewport: React.FC<RaceViewportProps> = ({
  mapId,
  mode,
  characterId,
  vehicleId,
  colorHex,
  livery,
  accessory,
  muted,
  onToggleMute,
  onToggleFullscreen,
  onRaceFinish,
  onQuitToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [hud, setHud] = useState<RaceHudState>({
    phase: 'countdown',
    countdownValue: 3,
    speedKmh: 0,
    nitro: 100,
    isDrifting: false,
    isNitroActive: false,
    lap: 1,
    totalLaps: MAP_RECORD[mapId].laps,
    position: 1,
    totalRacers: 6,
    elapsedMs: 0,
    currentZoneName: MAP_RECORD[mapId].featuredStreets[0] ?? MAP_RECORD[mapId].name,
    wrongWay: false,
    racers: [],
    trackOutline: [],
  });

  const onRaceFinishRef = useRef(onRaceFinish);
  onRaceFinishRef.current = onRaceFinish;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setIsPaused(false);

    const engine = new RaceEngine(container, {
      mapId,
      mode,
      playerCharacterId: characterId,
      playerVehicleId: vehicleId,
      playerColor: colorHex,
      playerLivery: livery,
      playerAccessory: accessory,
      onHudUpdate: (nextHud) => setHud(nextHud),
      onRaceFinish: (summary) => onRaceFinishRef.current(summary),
    });

    engineRef.current = engine;
    const readyTimer = window.setTimeout(() => setIsLoading(false), 380);

    return () => {
      window.clearTimeout(readyTimer);
      engine.dispose();
      engineRef.current = null;
    };
  }, [mapId, mode, characterId, vehicleId, colorHex, livery, accessory, sessionKey]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsPaused((prev) => {
          const next = !prev;
          engineRef.current?.setPaused(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handlePauseToggle = () => {
    setIsPaused((prev) => {
      const next = !prev;
      engineRef.current?.setPaused(next);
      return next;
    });
  };

  const handleTouchInput = (partial: Partial<RacerInputState>) => {
    engineRef.current?.setTouchInput(partial);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Dedicated isolated WebGL canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {isLoading && <LoadingScreen mapName={MAP_RECORD[mapId].name} />}

      {!isLoading && (
        <RaceHUD
          hud={hud}
          mode={mode}
          muted={muted}
          onPause={handlePauseToggle}
          onToggleMute={onToggleMute}
          onToggleFullscreen={onToggleFullscreen}
          onTouchInput={handleTouchInput}
        />
      )}

      {isPaused && (
        <PauseOverlay
          onResume={() => {
            setIsPaused(false);
            engineRef.current?.setPaused(false);
          }}
          onRestart={() => {
            setIsPaused(false);
            setSessionKey((k) => k + 1);
          }}
          onQuitToMenu={onQuitToMenu}
        />
      )}
    </div>
  );
};
