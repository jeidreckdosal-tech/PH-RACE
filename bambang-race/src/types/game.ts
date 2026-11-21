export type CharacterId =
  | 'bot-bob'
  | 'bobonoy'
  | 'matulokvin'
  | 'toybayag'
  | 'papaswetson'
  | 'msbengbeng'
  | 'ketchupa';

export type VehicleCategory =
  | 'sports_car'
  | 'motorcycle'
  | 'go_kart'
  | 'monster_truck'
  | 'futuristic';

export type VehicleLivery = 'solid' | 'stripes' | 'jeepney' | 'checkered';

export type AccessoryId = 'none' | 'crown' | 'shades' | 'wings' | 'garland';

export type MapId =
  | 'tondo'
  | 'manila'
  | 'quezon_city'
  | 'bgc'
  | 'makati'
  | 'cebu'
  | 'baguio';

export type GameMode = 'quick' | 'championship' | 'time_trial' | 'free_roam';

export type ScreenState =
  | 'menu'
  | 'characters'
  | 'vehicles'
  | 'maps'
  | 'modes'
  | 'leaderboard'
  | 'settings'
  | 'how_to_play'
  | 'racing'
  | 'results';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  personality: string;
  outfitDescription: string;
  victoryMoveName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  skinTone: string;
  statBonus: {
    topSpeed: number;
    acceleration: number;
    handling: number;
  };
}

export interface VehicleStats {
  topSpeed: number; // 1-100 scale
  acceleration: number; // 1-100 scale
  handling: number; // 1-100 scale
  braking: number; // 1-100 scale
}

export interface VehicleDef {
  id: string;
  name: string;
  category: VehicleCategory;
  categoryLabel: string;
  description: string;
  price: number; // 0 = starter unlocked
  stats: VehicleStats;
  defaultColor: string;
}

export interface PaintColorDef {
  id: string;
  name: string;
  hex: string;
  price: number;
  metalness: number;
  roughness: number;
}

export interface AccessoryDef {
  id: AccessoryId;
  name: string;
  description: string;
  price: number;
}

export interface TrackLandmark {
  name: string;
  t: number; // 0..1 normalized spline position
  side: 'left' | 'right' | 'overhead';
  type:
    | 'church'
    | 'plaza'
    | 'market'
    | 'shophouse'
    | 'arch'
    | 'clocktower'
    | 'monument'
    | 'bridge'
    | 'skyscraper'
    | 'baywalk'
    | 'pine_lodge';
  signText?: string;
}

export interface MapDef {
  id: MapId;
  name: string;
  region: string;
  tagline: string;
  description: string;
  laps: number;
  roadWidth: number;
  skyTopColor: string;
  skyHorizonColor: string;
  fogColor: string;
  fogDensity: number;
  groundColor: string;
  roadColor: string;
  curbColorA: string;
  curbColorB: string;
  sunColor: string;
  sunIntensity: number;
  ambientSky: string;
  ambientGround: string;
  isNightOrDusk: boolean;
  waypoints: [number, number, number][];
  landmarks: TrackLandmark[];
  featuredStreets: string[];
}

export interface LeaderboardEntry {
  id: string;
  mapId: MapId;
  characterId: CharacterId;
  vehicleId: string;
  timeMs: number;
  mode: GameMode;
  dateIso: string;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface PlayerProgress {
  coins: number;
  totalRaces: number;
  totalWins: number;
  selectedCharacter: CharacterId;
  selectedVehicle: string;
  selectedColor: string;
  selectedLivery: VehicleLivery;
  selectedAccessory: AccessoryId;
  selectedMap: MapId;
  selectedMode: GameMode;
  unlockedVehicles: string[];
  unlockedColors: string[];
  unlockedAccessories: AccessoryId[];
  bestTimesMs: Partial<Record<MapId, number>>;
  leaderboard: LeaderboardEntry[];
  audio: AudioSettings;
}

export interface RacerHudEntry {
  id: string;
  name: string;
  characterId: CharacterId;
  isPlayer: boolean;
  position: number;
  lap: number;
  totalProgress: number;
  finished: boolean;
  finishTimeMs: number | null;
  trackX: number;
  trackZ: number;
  color: string;
}

export interface RaceHudState {
  phase: 'countdown' | 'racing' | 'paused' | 'finished';
  countdownValue: number; // 3, 2, 1, 0 (GO)
  speedKmh: number;
  nitro: number; // 0..100
  isDrifting: boolean;
  isNitroActive: boolean;
  lap: number;
  totalLaps: number;
  position: number;
  totalRacers: number;
  elapsedMs: number;
  currentZoneName: string;
  wrongWay: boolean;
  racers: RacerHudEntry[];
  trackOutline: { x: number; z: number }[];
}

export interface RaceResultSummary {
  mode: GameMode;
  mapId: MapId;
  characterId: CharacterId;
  vehicleId: string;
  position: number;
  totalRacers: number;
  finishTimeMs: number;
  winnerCharacterId: CharacterId;
  winnerName: string;
  coinsEarned: number;
  pointsEarned: number;
  isNewBest: boolean;
  standings: {
    characterId: CharacterId;
    name: string;
    vehicleName: string;
    position: number;
    finishTimeMs: number | null;
    points: number;
    isPlayer: boolean;
  }[];
}

export interface ChampionshipState {
  active: boolean;
  currentRoundIndex: number;
  mapOrder: MapId[];
  pointsByCharacter: Record<string, number>;
}

/**
 * Multiplayer-ready input & state synchronization contracts.
 * Local player input and future WebSocket/WebRTC remote peers implement this exact shape.
 */
export interface RacerInputState {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (left..right)
  drift: boolean;
  nitro: boolean;
}

export interface RacerNetworkSnapshot {
  racerId: string;
  timestamp: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  lap: number;
  progress: number;
}

export interface NetworkTransportAdapter {
  readonly isConnected: boolean;
  sendLocalInput(input: RacerInputState): void;
  onRemoteSnapshot?(cb: (snapshot: RacerNetworkSnapshot) => void): void;
}
