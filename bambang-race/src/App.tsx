import { useEffect, useState } from 'react';
import { CharacterSelect } from './components/CharacterSelect';
import { GameModeSelect } from './components/GameModeSelect';
import { MainMenu } from './components/MainMenu';
import { MapSelect } from './components/MapSelect';
import { RaceResults } from './components/RaceResults';
import { RaceViewport } from './components/RaceViewport';
import {
  HowToPlayScreen,
  LeaderboardScreen,
  SettingsScreen,
} from './components/SecondaryModals';
import { VehicleSelect } from './components/VehicleSelect';
import { audioEngine } from './engine/audio';
import {
  addLeaderboardRecord,
  loadProgress,
  resetProgress,
  saveProgress,
} from './engine/storage';
import {
  AccessoryId,
  AudioSettings,
  ChampionshipState,
  CharacterId,
  GameMode,
  MapId,
  PlayerProgress,
  RaceResultSummary,
  ScreenState,
  VehicleLivery,
} from './types/game';

const CHAMPIONSHIP_MAPS: MapId[] = ['tondo', 'manila', 'bgc'];

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [lastResult, setLastResult] = useState<RaceResultSummary | null>(null);
  const [championship, setChampionship] = useState<ChampionshipState>({
    active: false,
    currentRoundIndex: 0,
    mapOrder: CHAMPIONSHIP_MAPS,
    pointsByCharacter: {},
  });

  useEffect(() => {
    audioEngine.applySettings(progress.audio);
  }, [progress.audio]);

  const updateProgress = (updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  };

  const navigate = (next: ScreenState) => {
    audioEngine.playUiClick();
    setScreen(next);
  };

  const toggleMute = () => {
    audioEngine.ensureContext();
    updateProgress((prev) => ({
      ...prev,
      audio: { ...prev.audio, muted: !prev.audio.muted },
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const startRace = (overrideMap?: MapId, overrideMode?: GameMode) => {
    audioEngine.ensureContext();
    audioEngine.playUiClick();

    const modeToUse = overrideMode ?? progress.selectedMode;
    let mapToUse = overrideMap ?? progress.selectedMap;

    if (modeToUse === 'championship') {
      mapToUse = CHAMPIONSHIP_MAPS[0];
      setChampionship({
        active: true,
        currentRoundIndex: 0,
        mapOrder: CHAMPIONSHIP_MAPS,
        pointsByCharacter: {},
      });
    } else {
      setChampionship((prev) => ({ ...prev, active: false }));
    }

    updateProgress((prev) => ({
      ...prev,
      selectedMap: mapToUse,
      selectedMode: modeToUse,
    }));
    setScreen('racing');
  };

  const handleRaceFinish = (summary: RaceResultSummary) => {
    let isNewBest = false;
    let updated = progress;

    // Record time on leaderboard for timed modes
    if (summary.mode !== 'free_roam') {
      const res = addLeaderboardRecord(progress, {
        mapId: summary.mapId,
        characterId: summary.characterId,
        vehicleId: summary.vehicleId,
        timeMs: summary.finishTimeMs,
        mode: summary.mode,
      });
      updated = res.next;
      isNewBest = res.isNewBest;
    }

    // Update coins, total races, and wins
    const finalProgress: PlayerProgress = {
      ...updated,
      coins: updated.coins + summary.coinsEarned,
      totalRaces: updated.totalRaces + 1,
      totalWins: updated.totalWins + (summary.position === 1 ? 1 : 0),
    };
    saveProgress(finalProgress);
    setProgress(finalProgress);

    // Update Championship cumulative points if active
    if (summary.mode === 'championship' && championship.active) {
      setChampionship((prev) => {
        const nextPts = { ...prev.pointsByCharacter };
        for (const row of summary.standings) {
          nextPts[row.characterId] = (nextPts[row.characterId] ?? 0) + row.points;
        }
        return { ...prev, pointsByCharacter: nextPts };
      });
    }

    setLastResult({ ...summary, isNewBest });
    setScreen('results');
  };

  const handleNextChampionshipRace = () => {
    const nextIdx = championship.currentRoundIndex + 1;
    if (nextIdx >= championship.mapOrder.length) return;
    const nextMap = championship.mapOrder[nextIdx];
    setChampionship((prev) => ({ ...prev, currentRoundIndex: nextIdx }));
    updateProgress((prev) => ({ ...prev, selectedMap: nextMap }));
    setScreen('racing');
  };

  if (screen === 'racing') {
    return (
      <RaceViewport
        mapId={progress.selectedMap}
        mode={progress.selectedMode}
        characterId={progress.selectedCharacter}
        vehicleId={progress.selectedVehicle}
        colorHex={progress.selectedColor}
        livery={progress.selectedLivery}
        accessory={progress.selectedAccessory}
        muted={progress.audio.muted}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onRaceFinish={handleRaceFinish}
        onQuitToMenu={() => {
          audioEngine.stopMusic();
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'results' && lastResult) {
    return (
      <RaceResults
        result={lastResult}
        championship={championship}
        onPlayAgain={() => setScreen('racing')}
        onNextChampionshipRace={handleNextChampionshipRace}
        onReturnToMenu={() => {
          audioEngine.stopMusic();
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'characters') {
    return (
      <CharacterSelect
        progress={progress}
        onSelectCharacter={(id: CharacterId) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedCharacter: id }));
        }}
        onSelectAccessory={(id: AccessoryId) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedAccessory: id }));
        }}
        onUnlockAccessory={(id: AccessoryId, price: number) => {
          audioEngine.playLapChime();
          updateProgress((p) => ({
            ...p,
            coins: Math.max(0, p.coins - price),
            unlockedAccessories: [...p.unlockedAccessories, id],
            selectedAccessory: id,
          }));
        }}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'vehicles') {
    return (
      <VehicleSelect
        progress={progress}
        onSelectVehicle={(id: string) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedVehicle: id }));
        }}
        onUnlockVehicle={(id: string, price: number) => {
          audioEngine.playLapChime();
          updateProgress((p) => ({
            ...p,
            coins: Math.max(0, p.coins - price),
            unlockedVehicles: [...p.unlockedVehicles, id],
            selectedVehicle: id,
          }));
        }}
        onSelectColor={(hex: string) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedColor: hex }));
        }}
        onUnlockColor={(hex: string, price: number) => {
          audioEngine.playLapChime();
          updateProgress((p) => ({
            ...p,
            coins: Math.max(0, p.coins - price),
            unlockedColors: [...p.unlockedColors, hex],
            selectedColor: hex,
          }));
        }}
        onSelectLivery={(livery: VehicleLivery) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedLivery: livery }));
        }}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'maps') {
    return (
      <MapSelect
        progress={progress}
        onSelectMap={(id: MapId) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedMap: id }));
        }}
        onStartRace={(id: MapId) => startRace(id)}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'modes') {
    return (
      <GameModeSelect
        progress={progress}
        onSelectMode={(mode: GameMode) => {
          audioEngine.playUiClick();
          updateProgress((p) => ({ ...p, selectedMode: mode }));
        }}
        onLaunchMode={(mode: GameMode) => startRace(undefined, mode)}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'leaderboard') {
    return (
      <LeaderboardScreen
        progress={progress}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        audio={progress.audio}
        onUpdateAudio={(next: AudioSettings) =>
          updateProgress((p) => ({ ...p, audio: next }))
        }
        onResetSave={() => {
          const fresh = resetProgress();
          setProgress(fresh);
        }}
        onBack={() => navigate('menu')}
      />
    );
  }

  if (screen === 'how_to_play') {
    return <HowToPlayScreen onBack={() => navigate('menu')} />;
  }

  return (
    <MainMenu
      progress={progress}
      onNavigate={navigate}
      onPlayNow={() => startRace()}
      onToggleMute={toggleMute}
      onToggleFullscreen={toggleFullscreen}
    />
  );
}
