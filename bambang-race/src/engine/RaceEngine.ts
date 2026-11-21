import * as THREE from 'three';
import { CHARACTERS, CHARACTER_MAP } from '../data/characters';
import { MAP_RECORD } from '../data/tracks';
import { VEHICLES, VEHICLE_MAP } from '../data/vehicles';
import {
  AccessoryId,
  CharacterId,
  GameMode,
  MapId,
  RaceHudState,
  RaceResultSummary,
  RacerHudEntry,
  RacerInputState,
  VehicleLivery,
} from '../types/game';
import { audioEngine } from './audio';
import { animateCharacter, buildVehicleModel, VehicleRig } from './models';
import {
  createManagedRenderer,
  disposeObject3D,
  ManagedRenderer,
} from './rendererUtils';
import { buildPhilippineTrack, BuiltTrack } from './trackBuilder';

interface RacerActor {
  id: string;
  name: string;
  characterId: CharacterId;
  vehicleId: string;
  vehicleName: string;
  color: string;
  isPlayer: boolean;
  rig: VehicleRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  maxSpeed: number;
  accelRate: number;
  handlingRate: number;
  brakeRate: number;
  nitro: number;
  isDrifting: boolean;
  driftDirection: number;
  driftCharge: number;
  isNitroActive: boolean;
  nitroTimer: number;
  lap: number;
  lastSampleIdx: number;
  furthestGate: number; // 0..3 quarterly checkpoints per lap
  totalProgress: number;
  finished: boolean;
  finishTimeMs: number | null;
  aiLaneOffset: number;
  aiSkillFactor: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface RaceSessionOptions {
  mapId: MapId;
  mode: GameMode;
  playerCharacterId: CharacterId;
  playerVehicleId: string;
  playerColor: string;
  playerLivery: VehicleLivery;
  playerAccessory: AccessoryId;
  onHudUpdate: (hud: RaceHudState) => void;
  onRaceFinish: (result: RaceResultSummary) => void;
}

const POINTS_BY_POSITION = [15, 12, 10, 8, 6, 4];

// Pre-allocated scratch vectors to avoid GC pressure inside render loop
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _tempVec = new THREE.Vector3();

export class RaceEngine {
  private container: HTMLElement;
  private options: RaceSessionOptions;
  private managed: ManagedRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private track: BuiltTrack;
  private racers: RacerActor[] = [];
  private particles: Particle[] = [];
  private particleGeo = new THREE.SphereGeometry(0.24, 6, 6);
  private smokeMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.55,
  });
  private sparkMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
  });

  private frameId = 0;
  private disposed = false;
  private paused = false;
  private phase: 'countdown' | 'racing' | 'paused' | 'finished' = 'countdown';
  private countdownTimer = 3.4;
  private lastBeepInt = 4;
  private raceElapsedMs = 0;
  private lastFrameTime = performance.now();
  private hudEmitAccum = 0;

  // Input state (Keyboard + Mobile Touch merged cleanly)
  private keys = new Set<string>();
  private touchInput: RacerInputState = {
    throttle: 0,
    brake: 0,
    steer: 0,
    drift: false,
    nitro: false,
  };
  private currentSteerSmoothed = 0;

  constructor(container: HTMLElement, options: RaceSessionOptions) {
    this.container = container;
    this.options = options;
    const mapDef = MAP_RECORD[options.mapId];

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(mapDef.skyHorizonColor);
    this.scene.fog = new THREE.FogExp2(mapDef.fogColor, mapDef.fogDensity);

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);
    this.camera = new THREE.PerspectiveCamera(64, width / height, 0.25, 950);

    this.managed = createManagedRenderer(container, this.scene);

    // Balanced 3-Point Outdoor Lighting Rig (Warm Sun Key + Cool Hemisphere Fill + Rim)
    const hemi = new THREE.HemisphereLight(
      mapDef.ambientSky,
      mapDef.ambientGround,
      0.85
    );
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(mapDef.sunColor, mapDef.sunIntensity);
    sun.position.set(110, 160, 95);
    if (!this.managed.isSoftwareGl) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 10;
      sun.shadow.camera.far = 420;
      const d = 190;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.03;
    }
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rim.position.set(-120, 75, -110);
    this.scene.add(rim);

    // Build Philippine Track
    this.track = buildPhilippineTrack(mapDef, this.managed.maxAnisotropy);
    this.scene.add(this.track.group);

    // Spawn Player + AI Racers (depending on Game Mode)
    this.spawnRacers();

    // Position camera behind player immediately
    const player = this.racers[0];
    this.camera.position.set(
      player.x - Math.sin(player.yaw) * 10,
      player.y + 4.8,
      player.z - Math.cos(player.yaw) * 10
    );
    this.camera.lookAt(player.x, player.y + 1.2, player.z);

    if (!this.managed.isSoftwareGl) {
      this.managed.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();

    // Start procedural audio
    const pVeh = VEHICLE_MAP[options.playerVehicleId] || VEHICLES[0];
    audioEngine.startRaceEngineSound(pVeh.category);
    audioEngine.startMusic();

    this.emitHud();
    this.scheduleNextTick();
  }

  private spawnRacers(): void {
    const startSamples = this.track.samples;
    const totalSamples = startSamples.length;
    const isSoloMode =
      this.options.mode === 'time_trial' || this.options.mode === 'free_roam';

    const playerChar = CHARACTER_MAP[this.options.playerCharacterId];
    const playerVeh = VEHICLE_MAP[this.options.playerVehicleId] || VEHICLES[0];

    const roster: {
      id: string;
      charId: CharacterId;
      vehId: string;
      color: string;
      livery: VehicleLivery;
      accessory: AccessoryId;
      isPlayer: boolean;
      skill: number;
    }[] = [
      {
        id: 'player',
        charId: this.options.playerCharacterId,
        vehId: playerVeh.id,
        color: this.options.playerColor,
        livery: this.options.playerLivery,
        accessory: this.options.playerAccessory,
        isPlayer: true,
        skill: 1.0,
      },
    ];

    if (!isSoloMode) {
      const otherChars = CHARACTERS.filter(
        (c) => c.id !== this.options.playerCharacterId
      ).slice(0, 5);
      otherChars.forEach((ch, idx) => {
        const veh = VEHICLES[(idx + 1) % VEHICLES.length];
        roster.push({
          id: `ai-${ch.id}`,
          charId: ch.id,
          vehId: veh.id,
          color: ch.primaryColor,
          livery: idx % 2 === 0 ? 'stripes' : 'jeepney',
          accessory: 'none',
          isPlayer: false,
          // Competitive balanced AI speed factors
          skill: 0.91 + (idx % 3) * 0.045,
        });
      });
    }

    roster.forEach((entry, gridIdx) => {
      const charDef = CHARACTER_MAP[entry.charId];
      const vehDef = VEHICLE_MAP[entry.vehId] || VEHICLES[0];
      const rig = buildVehicleModel(
        vehDef,
        entry.color,
        entry.livery,
        entry.charId,
        entry.accessory,
        this.managed.maxAnisotropy
      );

      // Staggered 2-column starting grid behind the start line
      const backSteps = 2 + Math.floor(gridIdx / 2) * 3;
      const sampleIdx = (totalSamples - backSteps) % totalSamples;
      const sample = startSamples[sampleIdx];
      const laneOffset = (gridIdx % 2 === 0 ? -1 : 1) * 3.4;

      const x = sample.point.x + sample.right.x * laneOffset;
      const y = sample.point.y;
      const z = sample.point.z + sample.right.z * laneOffset;
      const yaw = Math.atan2(sample.tangent.x, sample.tangent.z);

      rig.root.position.set(x, y, z);
      rig.root.rotation.y = yaw;
      this.scene.add(rig.root);

      const topStat = vehDef.stats.topSpeed + charDef.statBonus.topSpeed;
      const accelStat = vehDef.stats.acceleration + charDef.statBonus.acceleration;
      const handStat = vehDef.stats.handling + charDef.statBonus.handling;

      this.racers.push({
        id: entry.id,
        name: entry.isPlayer ? `${playerChar.name} (YOU)` : charDef.name,
        characterId: entry.charId,
        vehicleId: vehDef.id,
        vehicleName: vehDef.name,
        color: entry.color,
        isPlayer: entry.isPlayer,
        rig,
        x,
        y,
        z,
        yaw,
        speed: 0,
        maxSpeed: 42 + (topStat / 100) * 28, // ~62 - 70 units/s (~180-225 km/h)
        accelRate: 18 + (accelStat / 100) * 18,
        handlingRate: 1.85 + (handStat / 100) * 1.15,
        brakeRate: 30 + (vehDef.stats.braking / 100) * 22,
        nitro: 100,
        isDrifting: false,
        driftDirection: 0,
        driftCharge: 0,
        isNitroActive: false,
        nitroTimer: 0,
        lap: 1,
        lastSampleIdx: sampleIdx,
        furthestGate: 0,
        totalProgress: -(backSteps / totalSamples),
        finished: false,
        finishTimeMs: null,
        aiLaneOffset: ((gridIdx % 3) - 1) * 3.2,
        aiSkillFactor: entry.skill,
      });
    });

    if (this.options.mode === 'free_roam') {
      this.phase = 'racing';
      this.countdownTimer = 0;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onResize = () => {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 240);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.managed.renderer.setSize(width, height);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
  }

  public setTouchInput(partial: Partial<RacerInputState>): void {
    this.touchInput = { ...this.touchInput, ...partial };
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.phase = 'paused';
      audioEngine.updateRaceEngine(0, false, false, 'sports_car');
    } else {
      this.phase = this.countdownTimer > 0 ? 'countdown' : 'racing';
      this.lastFrameTime = performance.now();
    }
    this.emitHud();
  }

  private readPlayerInput(): RacerInputState {
    const accelKey =
      this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0;
    const brakeKey =
      this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0;
    const leftKey =
      this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0;
    const rightKey =
      this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0;
    const driftKey = this.keys.has('Space');
    const nitroKey =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    return {
      throttle: Math.max(accelKey, this.touchInput.throttle),
      brake: Math.max(brakeKey, this.touchInput.brake),
      steer: THREE.MathUtils.clamp(
        rightKey - leftKey + this.touchInput.steer,
        -1,
        1
      ),
      drift: driftKey || this.touchInput.drift,
      nitro: nitroKey || this.touchInput.nitro,
    };
  }

  private computeAiInput(racer: RacerActor): RacerInputState {
    const samples = this.track.samples;
    const n = samples.length;
    const lookAheadIdx = (racer.lastSampleIdx + 10) % n;
    const targetSample = samples[lookAheadIdx];

    const tx = targetSample.point.x + targetSample.right.x * racer.aiLaneOffset;
    const tz = targetSample.point.z + targetSample.right.z * racer.aiLaneOffset;

    const dx = tx - racer.x;
    const dz = tz - racer.z;
    const desiredYaw = Math.atan2(dx, dz);

    let angleDiff = desiredYaw - racer.yaw;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const steer = THREE.MathUtils.clamp(angleDiff * 2.2, -1, 1);
    const sharpTurn = Math.abs(angleDiff) > 0.45;
    const useNitro =
      !sharpTurn && racer.nitro > 45 && Math.abs(angleDiff) < 0.14 && Math.random() < 0.04;

    return {
      throttle: sharpTurn ? 0.72 * racer.aiSkillFactor : racer.aiSkillFactor,
      brake: sharpTurn && racer.speed > 45 ? 0.35 : 0,
      steer,
      drift: sharpTurn && racer.speed > 36,
      nitro: useNitro,
    };
  }

  private spawnParticle(x: number, y: number, z: number, isSpark: boolean): void {
    if (this.particles.length > 48) return;
    const mesh = new THREE.Mesh(
      this.particleGeo,
      isSpark ? this.sparkMat : this.smokeMat
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 1.5 + Math.random() * 2.5,
      vz: (Math.random() - 0.5) * 3.5,
      life: 0,
      maxLife: isSpark ? 0.28 : 0.48,
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const scale = 1 + (p.life / p.maxLife) * 1.4;
      p.mesh.scale.setScalar(scale);
    }
  }

  private stepSimulation(dt: number): void {
    const mapDef = MAP_RECORD[this.options.mapId];
    const totalLaps = mapDef.laps;
    const samples = this.track.samples;
    const nSamples = samples.length;
    const halfRoad = this.track.roadWidth * 0.5 - 1.2;

    if (this.phase === 'countdown') {
      this.countdownTimer -= dt;
      const ceilVal = Math.ceil(this.countdownTimer);
      if (ceilVal < this.lastBeepInt && ceilVal >= 1 && ceilVal <= 3) {
        this.lastBeepInt = ceilVal;
        audioEngine.playCountdownBeep(false);
      }
      if (this.countdownTimer <= 0) {
        this.phase = 'racing';
        audioEngine.playCountdownBeep(true);
      }
    } else if (this.phase === 'racing') {
      this.raceElapsedMs += dt * 1000;
    }

    const canDrive = this.phase === 'racing' || this.phase === 'finished';

    // Update each racer
    for (const r of this.racers) {
      const input: RacerInputState = !canDrive
        ? { throttle: 0, brake: 0, steer: 0, drift: false, nitro: false }
        : r.isPlayer && !r.finished
          ? this.readPlayerInput()
          : this.computeAiInput(r);

      if (r.isPlayer) {
        this.currentSteerSmoothed = THREE.MathUtils.damp(
          this.currentSteerSmoothed,
          input.steer,
          10,
          dt
        );
      }

      // Nitro activation
      if (input.nitro && r.nitro > 14 && !r.isNitroActive && r.speed > 10) {
        r.isNitroActive = true;
        r.nitroTimer = 0.8;
        if (r.isPlayer) audioEngine.playNitroBurst();
      }
      if (r.isNitroActive) {
        r.nitro = Math.max(0, r.nitro - 38 * dt);
        r.nitroTimer -= dt;
        if (r.nitro <= 1 || (!input.nitro && r.nitroTimer <= 0)) {
          r.isNitroActive = false;
        }
      } else {
        r.nitro = Math.min(100, r.nitro + (r.isDrifting ? 16 : 6.5) * dt);
      }

      const activeMax = r.maxSpeed * (r.isNitroActive ? 1.32 : 1.0);

      // Longitudinal acceleration / braking / drag
      if (input.throttle > 0) {
        const boostAccel = r.isNitroActive ? 1.75 : 1.0;
        r.speed += r.accelRate * input.throttle * boostAccel * dt;
      } else if (input.brake > 0) {
        r.speed -= r.brakeRate * input.brake * dt;
      } else {
        r.speed = THREE.MathUtils.damp(r.speed, 0, 1.8, dt);
      }

      r.speed = THREE.MathUtils.clamp(r.speed, -16, activeMax);

      // Drifting mechanics
      const wantsDrift = input.drift && Math.abs(r.speed) > 22 && Math.abs(input.steer) > 0.15;
      if (wantsDrift) {
        if (!r.isDrifting) {
          r.isDrifting = true;
          r.driftDirection = Math.sign(input.steer);
        }
        r.driftCharge += dt;
        if (Math.random() < 0.45) {
          this.spawnParticle(r.x, r.y + 0.2, r.z, false);
        }
      } else {
        if (r.isDrifting && r.driftCharge > 0.65) {
          // Mini-turbo boost on releasing a clean drift!
          r.nitro = Math.min(100, r.nitro + 18);
          r.speed = Math.min(r.maxSpeed * 1.2, r.speed + 10);
        }
        r.isDrifting = false;
        r.driftCharge = 0;
      }

      // Steering (inverted when reversing)
      const speedFactor = THREE.MathUtils.clamp(Math.abs(r.speed) / 24, 0.2, 1.15);
      const dirSign = r.speed >= -0.5 ? 1 : -1;
      const driftMult = r.isDrifting ? 1.38 : 1.0;
      r.yaw -= input.steer * r.handlingRate * speedFactor * driftMult * dirSign * dt;

      // Integrate position
      const moveYaw = r.isDrifting ? r.yaw + r.driftDirection * 0.18 : r.yaw;
      r.x += Math.sin(moveYaw) * r.speed * dt;
      r.z += Math.cos(moveYaw) * r.speed * dt;

      // Track closest sample, elevation, and boundary guardrail clamping
      const closestIdx = this.track.getClosestSampleIndex(r.x, r.z);
      const s = samples[closestIdx];
      r.y = THREE.MathUtils.damp(r.y, s.point.y, 14, dt);

      _tempVec.set(r.x - s.point.x, 0, r.z - s.point.z);
      const lateralOffset = _tempVec.dot(s.right);
      if (Math.abs(lateralOffset) > halfRoad) {
        const clampedLat = Math.sign(lateralOffset) * halfRoad;
        const excess = lateralOffset - clampedLat;
        r.x -= s.right.x * excess;
        r.z -= s.right.z * excess;
        r.speed *= 0.84;
        if (r.isPlayer && Math.abs(r.speed) > 15) {
          this.spawnParticle(r.x, r.y + 0.4, r.z, true);
        }
      }

      // Checkpoint & Lap Counting (4 sectors per lap)
      const sector = Math.floor((closestIdx / nSamples) * 4); // 0, 1, 2, 3
      if (sector === r.furthestGate + 1) {
        r.furthestGate = sector;
      } else if (r.furthestGate === 3 && sector === 0 && r.lastSampleIdx > nSamples * 0.75) {
        r.furthestGate = 0;
        if (this.options.mode !== 'free_roam' && !r.finished) {
          if (r.lap >= totalLaps) {
            r.finished = true;
            r.finishTimeMs = this.raceElapsedMs;
            if (r.isPlayer) {
              this.handlePlayerFinish();
            }
          } else {
            r.lap += 1;
            if (r.isPlayer) audioEngine.playLapChime();
          }
        }
      }
      r.lastSampleIdx = closestIdx;
      r.totalProgress = r.finished
        ? totalLaps + 10 - (r.finishTimeMs ?? 0) * 0.000001
        : (r.lap - 1) + closestIdx / nSamples;

      // Apply visual transforms, wheel spin, bike/car lean, and driver animation
      r.rig.root.position.set(r.x, r.y, r.z);
      const visualDriftYaw = r.isDrifting ? -r.driftDirection * 0.24 : 0;
      r.rig.root.rotation.y = r.yaw + visualDriftYaw;

      const vehDef = VEHICLE_MAP[r.vehicleId];
      const leanAngle =
        vehDef?.category === 'motorcycle'
          ? -input.steer * 0.42 * speedFactor
          : -input.steer * 0.06 * speedFactor;
      r.rig.chassisGroup.rotation.z = THREE.MathUtils.damp(
        r.rig.chassisGroup.rotation.z,
        leanAngle,
        12,
        dt
      );

      for (const w of r.rig.wheels) {
        w.rotation.x += r.speed * dt * 1.4;
      }
      for (const f of r.rig.nitroFlames) {
        f.visible = r.isNitroActive;
        if (r.isNitroActive) {
          f.scale.setScalar(0.85 + Math.random() * 0.4);
        }
      }

      animateCharacter(
        r.rig.driver,
        r.characterId,
        this.raceElapsedMs * 0.001,
        'driving',
        input.steer
      );
    }

    // Vehicle-to-Vehicle Arcade Collisions
    for (let i = 0; i < this.racers.length; i++) {
      for (let j = i + 1; j < this.racers.length; j++) {
        const a = this.racers[i];
        const b = this.racers[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distSq = dx * dx + dz * dz;
        const minDist = 3.1;
        if (distSq > 0.0001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          a.x -= nx * overlap;
          a.z -= nz * overlap;
          b.x += nx * overlap;
          b.z += nz * overlap;
          a.speed *= 0.94;
          b.speed *= 0.94;
          if (a.isPlayer || b.isPlayer) {
            audioEngine.playBump();
            this.spawnParticle((a.x + b.x) * 0.5, a.y + 0.6, (a.z + b.z) * 0.5, true);
          }
        }
      }
    }

    // Engine sound for player
    const player = this.racers[0];
    if (player) {
      const pVeh = VEHICLE_MAP[player.vehicleId] || VEHICLES[0];
      audioEngine.updateRaceEngine(
        Math.abs(player.speed) / player.maxSpeed,
        player.isDrifting,
        player.isNitroActive,
        pVeh.category
      );
      this.updateCamera(player, dt);
    }

    this.updateParticles(dt);
  }

  private updateCamera(player: RacerActor, dt: number): void {
    const timeSec = performance.now() * 0.001;
    if (this.phase === 'countdown') {
      // Dramatic pre-race sweep behind player
      const sweep = Math.sin(timeSec * 1.4) * 2.2;
      _camTargetPos.set(
        player.x - Math.sin(player.yaw) * 10.5 + sweep,
        player.y + 4.4,
        player.z - Math.cos(player.yaw) * 10.5
      );
    } else {
      const speedNorm = THREE.MathUtils.clamp(Math.abs(player.speed) / player.maxSpeed, 0, 1.3);
      const chaseDist = 8.4 + speedNorm * 1.6 + (player.isNitroActive ? 1.1 : 0);
      const chaseHeight = 3.9 + speedNorm * 0.45;
      const shake = player.isNitroActive ? (Math.random() - 0.5) * 0.14 : 0;

      _camTargetPos.set(
        player.x - Math.sin(player.yaw) * chaseDist + shake,
        player.y + chaseHeight + shake,
        player.z - Math.cos(player.yaw) * chaseDist
      );

      // Dynamic FOV widening with speed & nitro
      const targetFov = 62 + speedNorm * 14 + (player.isNitroActive ? 8 : 0);
      if (Math.abs(this.camera.fov - targetFov) > 0.2) {
        this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
        this.camera.updateProjectionMatrix();
      }
    }

    this.camera.position.lerp(_camTargetPos, 1 - Math.exp(-9 * dt));
    _camLookAt.set(
      player.x + Math.sin(player.yaw) * 6,
      player.y + 1.4,
      player.z + Math.cos(player.yaw) * 6
    );
    this.camera.lookAt(_camLookAt);
  }

  private handlePlayerFinish(): void {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    audioEngine.stopRaceEngineSound();
    audioEngine.playVictoryFanfare();

    // Estimate finish times for AI racers that haven't crossed the line yet
    const sorted = [...this.racers].sort((a, b) => b.totalProgress - a.totalProgress);
    const playerPos = sorted.findIndex((r) => r.isPlayer) + 1;
    const totalRacers = sorted.length;

    const standings = sorted.map((r, idx) => {
      const pos = idx + 1;
      const estTime =
        r.finishTimeMs ??
        Math.round(this.raceElapsedMs + (pos - playerPos) * 1400 + Math.random() * 400);
      return {
        characterId: r.characterId,
        name: r.name,
        vehicleName: r.vehicleName,
        position: pos,
        finishTimeMs: estTime,
        points: POINTS_BY_POSITION[idx] ?? 2,
        isPlayer: r.isPlayer,
      };
    });

    const winner = standings[0];
    const playerEntry = standings.find((s) => s.isPlayer)!;
    const coinsEarned =
      this.options.mode === 'time_trial'
        ? 90
        : Math.max(40, (totalRacers - playerPos + 1) * 45 + (playerPos === 1 ? 80 : 0));

    this.emitHud();

    window.setTimeout(() => {
      if (this.disposed) return;
      this.options.onRaceFinish({
        mode: this.options.mode,
        mapId: this.options.mapId,
        characterId: this.options.playerCharacterId,
        vehicleId: this.options.playerVehicleId,
        position: playerPos,
        totalRacers,
        finishTimeMs: playerEntry.finishTimeMs ?? this.raceElapsedMs,
        winnerCharacterId: winner.characterId,
        winnerName: winner.name.replace(' (YOU)', ''),
        coinsEarned,
        pointsEarned: playerEntry.points,
        isNewBest: false,
        standings,
      });
    }, 1100);
  }

  private emitHud(): void {
    const mapDef = MAP_RECORD[this.options.mapId];
    const sorted = [...this.racers].sort((a, b) => b.totalProgress - a.totalProgress);
    const player = this.racers[0];
    if (!player) return;

    const playerPos = sorted.findIndex((r) => r.isPlayer) + 1;
    const sample = this.track.samples[player.lastSampleIdx];
    const forwardDot =
      Math.sin(player.yaw) * sample.tangent.x +
      Math.cos(player.yaw) * sample.tangent.z;

    const racersHud: RacerHudEntry[] = sorted.map((r, i) => ({
      id: r.id,
      name: r.name,
      characterId: r.characterId,
      isPlayer: r.isPlayer,
      position: i + 1,
      lap: r.lap,
      totalProgress: r.totalProgress,
      finished: r.finished,
      finishTimeMs: r.finishTimeMs,
      trackX: r.x,
      trackZ: r.z,
      color: r.color,
    }));

    this.options.onHudUpdate({
      phase: this.phase,
      countdownValue: Math.max(0, Math.ceil(this.countdownTimer)),
      speedKmh: Math.round(Math.abs(player.speed) * 3.2),
      nitro: Math.round(player.nitro),
      isDrifting: player.isDrifting,
      isNitroActive: player.isNitroActive,
      lap: player.lap,
      totalLaps: this.options.mode === 'free_roam' ? 0 : mapDef.laps,
      position: playerPos,
      totalRacers: this.racers.length,
      elapsedMs: this.raceElapsedMs,
      currentZoneName: this.track.getZoneName(player.lastSampleIdx / this.track.samples.length),
      wrongWay: player.speed > 8 && forwardDot < -0.35,
      racers: racersHud,
      trackOutline: this.track.outline2D,
    });
  }

  private tick = () => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;

    if (!this.paused) {
      this.stepSimulation(dt);
      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.05) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
    }

    this.managed.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  };

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.managed.isSoftwareGl) {
      this.frameId = this.managed.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    audioEngine.stopRaceEngineSound();
    disposeObject3D(this.scene);
    this.particleGeo.dispose();
    this.smokeMat.dispose();
    this.sparkMat.dispose();
    this.managed.dispose();
  }
}
