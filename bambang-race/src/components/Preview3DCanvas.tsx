import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARACTERS } from '../data/characters';
import { VEHICLE_MAP, VEHICLES } from '../data/vehicles';
import {
  animateCharacter,
  buildCharacterModel,
  buildVehicleModel,
  CharacterRig,
  VehicleRig,
} from '../engine/models';
import {
  createManagedRenderer,
  disposeObject3D,
} from '../engine/rendererUtils';
import {
  AccessoryId,
  CharacterId,
  VehicleLivery,
} from '../types/game';

interface Preview3DCanvasProps {
  mode: 'lineup' | 'character' | 'vehicle' | 'podium';
  characterId?: CharacterId;
  vehicleId?: string;
  colorHex?: string;
  livery?: VehicleLivery;
  accessory?: AccessoryId;
  animMode?: 'idle' | 'victory';
  interactive?: boolean;
  className?: string;
}

export const Preview3DCanvas: React.FC<Preview3DCanvasProps> = ({
  mode,
  characterId = 'bobonoy',
  vehicleId = 'moriones-gt',
  colorHex = '#ef4444',
  livery = 'stripes',
  accessory = 'none',
  animMode = 'idle',
  interactive = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animModeRef = useRef(animMode);
  animModeRef.current = animMode;

  const yawOffsetRef = useRef(0.38);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.FogExp2(0x0b1220, 0.025);

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 220);
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 100);

    const managed = createManagedRenderer(container, scene);

    // 3-Point Studio Lighting Rig
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.9);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1d6, 2.0);
    key.position.set(5, 8, 6);
    if (!managed.isSoftwareGl) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.0005;
    }
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rim.position.set(-6, 4, -5);
    scene.add(rim);

    // Studio Showroom Floor & Podium Disc
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.45,
        metalness: 0.35,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.55, 48),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    if (mode !== 'lineup') {
      scene.add(ring);
    }

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const charRigs: { rig: CharacterRig; id: CharacterId; baseRotY: number }[] = [];
    let vehicleRig: VehicleRig | null = null;

    if (mode === 'lineup') {
      camera.position.set(0, 2.5, 9.6);
      camera.lookAt(0, 1.05, 0);
      // Show all 7 original characters in a semicircular street pit showcase
      CHARACTERS.forEach((ch, idx) => {
        const rig = buildCharacterModel(ch.id, 'none');
        const angle = ((idx - 3) / 3) * 0.85;
        const radius = 4.3;
        rig.root.position.set(
          Math.sin(angle) * radius * 1.15,
          0,
          Math.cos(angle) * 1.8 - 1.2
        );
        const faceYaw = -angle * 0.45;
        rig.root.rotation.y = faceYaw;
        stageGroup.add(rig.root);
        charRigs.push({ rig, id: ch.id, baseRotY: faceYaw });
      });
    } else if (mode === 'character' || mode === 'podium') {
      camera.position.set(0, 1.85, 4.4);
      camera.lookAt(0, 0.95, 0);
      if (mode === 'podium') {
        const podium = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.7, 0.45, 24),
          new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.65,
            roughness: 0.25,
          })
        );
        podium.position.y = 0.225;
        stageGroup.add(podium);
      }
      const rig = buildCharacterModel(characterId, accessory);
      rig.root.position.y = mode === 'podium' ? 0.45 : 0;
      stageGroup.add(rig.root);
      charRigs.push({ rig, id: characterId, baseRotY: 0 });
    } else if (mode === 'vehicle') {
      camera.position.set(0, 2.35, 5.8);
      camera.lookAt(0, 0.85, 0);
      const vehDef = VEHICLE_MAP[vehicleId] || VEHICLES[0];
      vehicleRig = buildVehicleModel(
        vehDef,
        colorHex,
        livery,
        characterId,
        accessory,
        managed.maxAnisotropy
      );
      stageGroup.add(vehicleRig.root);
    }

    if (!managed.isSoftwareGl) {
      managed.renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 300);
      const h = Math.max(container.clientHeight, 220);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      managed.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    const startTime = performance.now();

    const tick = () => {
      if (disposed) return;
      const elapsed = (performance.now() - startTime) * 0.001;

      if (mode === 'lineup') {
        charRigs.forEach((item, idx) => {
          animateCharacter(item.rig, item.id, elapsed + idx * 0.7, 'idle');
        });
      } else {
        if (!isDraggingRef.current && interactive) {
          yawOffsetRef.current += 0.004;
        }
        stageGroup.rotation.y = yawOffsetRef.current;

        if (vehicleRig) {
          animateCharacter(
            vehicleRig.driver,
            characterId,
            elapsed,
            'driving',
            Math.sin(elapsed * 1.4) * 0.35
          );
          for (const w of vehicleRig.wheels) {
            w.rotation.x += 0.02;
          }
        } else {
          for (const item of charRigs) {
            animateCharacter(
              item.rig,
              item.id,
              elapsed,
              mode === 'podium' ? 'victory' : animModeRef.current
            );
          }
        }
      }

      managed.renderer.render(scene, camera);

      if (managed.isSoftwareGl) {
        frameId = managed.afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      disposeObject3D(scene);
      managed.dispose();
    };
  }, [mode, characterId, vehicleId, colorHex, livery, accessory, interactive]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive || mode === 'lineup') return;
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    yawOffsetRef.current += dx * 0.012;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`w-full h-full select-none ${interactive && mode !== 'lineup' ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      aria-label="Interactive 3D preview viewport"
    />
  );
};
