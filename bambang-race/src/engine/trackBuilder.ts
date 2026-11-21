import * as THREE from 'three';
import { MapDef } from '../types/game';
import {
  buildJeepneyProp,
  buildLandmarkMesh,
  buildSariSariStore,
  buildTricycleProp,
} from './models';
import {
  createBuildingFacadeTexture,
  createCheckeredTexture,
  createRoadTexture,
} from './textures';

export interface TrackSample {
  t: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
}

export interface BuiltTrack {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  samples: TrackSample[];
  roadWidth: number;
  outline2D: { x: number; z: number }[];
  getClosestSampleIndex: (x: number, z: number) => number;
  getZoneName: (t: number) => string;
}

export function buildPhilippineTrack(
  mapDef: MapDef,
  anisotropy = 4
): BuiltTrack {
  const group = new THREE.Group();
  const controlPoints = mapDef.waypoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(controlPoints, true, 'catmullrom', 0.45);

  const SEGMENTS = 260;
  const samples: TrackSample[] = [];
  const outline2D: { x: number; z: number }[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    samples.push({ t, point, tangent, right });
    if (i % 4 === 0) {
      outline2D.push({ x: point.x, z: point.z });
    }
  }

  // Expansive outer ground terrain extending smoothly into horizon fog
  const groundMat = new THREE.MeshStandardMaterial({
    color: mapDef.groundColor,
    roughness: 0.95,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.15;
  ground.receiveShadow = true;
  group.add(ground);

  // Manila Bay / Cebu Coastal water strip when relevant
  if (mapDef.id === 'manila' || mapDef.id === 'cebu') {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 1800),
      new THREE.MeshStandardMaterial({
        color: mapDef.id === 'manila' ? 0x0e7490 : 0x0284c7,
        roughness: 0.2,
        metalness: 0.65,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-540, -0.08, 0);
    group.add(water);
  }

  // Build smooth 3D road ribbon geometry
  const halfW = mapDef.roadWidth / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const s = samples[i % SEGMENTS];
    const leftPt = s.point.clone().addScaledVector(s.right, -halfW);
    const rightPt = s.point.clone().addScaledVector(s.right, halfW);

    positions.push(leftPt.x, leftPt.y + 0.03, leftPt.z);
    positions.push(rightPt.x, rightPt.y + 0.03, rightPt.z);

    normals.push(0, 1, 0, 0, 1, 0);

    const vCoord = (i / SEGMENTS) * 38;
    uvs.push(0, vCoord, 1, vCoord);

    if (i < SEGMENTS) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);

  const roadTex = createRoadTexture(
    mapDef.roadColor,
    mapDef.curbColorA,
    mapDef.curbColorB,
    anisotropy
  );
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.78,
    metalness: 0.08,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Start / Finish Checkered Strip right at t = 0
  const startSample = samples[0];
  const checkTex = createCheckeredTexture(anisotropy);
  const startStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(mapDef.roadWidth - 1.2, 4.2),
    new THREE.MeshStandardMaterial({
      map: checkTex,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  startStrip.position.copy(startSample.point);
  startStrip.position.y += 0.05;
  startStrip.rotation.x = -Math.PI / 2;
  startStrip.rotation.z = -Math.atan2(startSample.tangent.x, startSample.tangent.z);
  group.add(startStrip);

  // Trackside guardrails / low sidewalk curbs (InstancedMesh for crisp FPS)
  const postGeo = new THREE.BoxGeometry(0.45, 0.75, 2.2);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.6,
  });
  const barrierCount = SEGMENTS * 2;
  const barrierInst = new THREE.InstancedMesh(postGeo, postMat, barrierCount);
  const dummy = new THREE.Object3D();
  const colorA = new THREE.Color(mapDef.curbColorA);
  const colorB = new THREE.Color(0xf1f5f9);
  let bIdx = 0;

  for (let i = 0; i < SEGMENTS; i++) {
    const s = samples[i];
    const yaw = Math.atan2(s.tangent.x, s.tangent.z);
    for (const side of [-1, 1]) {
      const p = s.point.clone().addScaledVector(s.right, side * (halfW + 1.25));
      dummy.position.set(p.x, p.y + 0.36, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      barrierInst.setMatrixAt(bIdx, dummy.matrix);
      barrierInst.setColorAt(bIdx, i % 2 === 0 ? colorA : colorB);
      bIdx++;
    }
  }
  barrierInst.instanceMatrix.needsUpdate = true;
  if (barrierInst.instanceColor) barrierInst.instanceColor.needsUpdate = true;
  barrierInst.computeBoundingSphere();
  group.add(barrierInst);

  // Named Philippine Landmarks along the route
  for (const lm of mapDef.landmarks) {
    const lmSample = samples[Math.floor(lm.t * SEGMENTS) % SEGMENTS];
    const yaw = Math.atan2(lmSample.tangent.x, lmSample.tangent.z);
    const mesh = buildLandmarkMesh(lm, mapDef.roadWidth, anisotropy);

    if (lm.side === 'overhead') {
      mesh.position.copy(lmSample.point);
      mesh.rotation.y = yaw;
    } else {
      const dir = lm.side === 'left' ? -1 : 1;
      const offsetDist = halfW + 14;
      const pos = lmSample.point.clone().addScaledVector(lmSample.right, dir * offsetDist);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = yaw + (dir === -1 ? Math.PI / 2 : -Math.PI / 2);
    }
    group.add(mesh);
  }

  // Street scenery: Filipino shophouses / towers, Sari-Sari stores, Jeepneys, Tricycles, Festive Banderitas
  const facadeTexA = createBuildingFacadeTexture('#e5d5c5', '#fef08a', mapDef.id === 'bgc' || mapDef.id === 'makati', anisotropy);
  const facadeTexB = createBuildingFacadeTexture('#cbd5e1', '#38bdf8', mapDef.id === 'bgc' || mapDef.id === 'makati', anisotropy);
  const bldgMats = [
    new THREE.MeshStandardMaterial({ map: facadeTexA, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ map: facadeTexB, roughness: 0.65 }),
  ];

  // Check if a candidate point is safely away from all track segments
  const isClearOfTrack = (x: number, z: number, minDist: number): boolean => {
    for (let k = 0; k < SEGMENTS; k += 2) {
      const dx = samples[k].point.x - x;
      const dz = samples[k].point.z - z;
      if (dx * dx + dz * dz < minDist * minDist) return false;
    }
    return true;
  };

  for (let i = 6; i < SEGMENTS; i += 9) {
    const s = samples[i];
    const yaw = Math.atan2(s.tangent.x, s.tangent.z);
    const side = i % 2 === 0 ? 1 : -1;
    const dist = halfW + 16 + (i % 3) * 5;
    const bx = s.point.x + s.right.x * side * dist;
    const bz = s.point.z + s.right.z * side * dist;

    if (!isClearOfTrack(bx, bz, halfW + 10)) continue;

    if (mapDef.id === 'tondo' && i % 27 === 6) {
      // Authentic Sari-Sari store with roadside awning
      const store = buildSariSariStore(anisotropy);
      store.position.set(bx, s.point.y, bz);
      store.rotation.y = yaw + (side === -1 ? Math.PI / 2 : -Math.PI / 2);
      group.add(store);
    } else if (mapDef.id === 'tondo' && i % 18 === 0) {
      // Parked Philippine Jeepney on shoulder
      const jx = s.point.x + s.right.x * side * (halfW + 6.5);
      const jz = s.point.z + s.right.z * side * (halfW + 6.5);
      if (isClearOfTrack(jx, jz, halfW + 4.5)) {
        const jeep = buildJeepneyProp(i % 36 === 0 ? '#ef4444' : '#2563eb', '#facc15');
        jeep.position.set(jx, s.point.y, jz);
        jeep.rotation.y = yaw;
        group.add(jeep);
      }
    } else if ((mapDef.id === 'tondo' || mapDef.id === 'manila' || mapDef.id === 'cebu') && i % 27 === 15) {
      // Parked Tricycle
      const tx = s.point.x + s.right.x * side * (halfW + 5.8);
      const tz = s.point.z + s.right.z * side * (halfW + 5.8);
      if (isClearOfTrack(tx, tz, halfW + 4)) {
        const trike = buildTricycleProp(i % 2 === 0 ? '#10b981' : '#f97316');
        trike.position.set(tx, s.point.y, tz);
        trike.rotation.y = yaw;
        group.add(trike);
      }
    } else if (mapDef.id !== 'baguio') {
      // Urban buildings / shophouses / glass towers
      const h =
        mapDef.id === 'bgc' || mapDef.id === 'makati'
          ? 20 + (i % 5) * 9
          : 8 + (i % 4) * 3.5;
      const w = 9 + (i % 3) * 2.5;
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, w),
        bldgMats[i % bldgMats.length]
      );
      bldg.position.set(bx, s.point.y + h / 2, bz);
      bldg.rotation.y = yaw;
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      group.add(bldg);
    }
  }

  // Festive overhead Banderitas strings (signature Philippine street fiesta atmosphere)
  if (mapDef.id === 'tondo' || mapDef.id === 'cebu' || mapDef.id === 'manila') {
    const pennantColors = [0xef4444, 0xfacc15, 0x2563eb, 0x10b981, 0xec4899];
    const pennantGeo = new THREE.ConeGeometry(0.45, 0.85, 3);
    for (let i = 16; i < SEGMENTS; i += 38) {
      const s = samples[i];
      const yaw = Math.atan2(s.tangent.x, s.tangent.z);
      const bandGroup = new THREE.Group();
      bandGroup.position.set(s.point.x, s.point.y + 6.4, s.point.z);
      bandGroup.rotation.y = yaw;

      for (let p = -8; p <= 8; p += 1.6) {
        const flag = new THREE.Mesh(
          pennantGeo,
          new THREE.MeshStandardMaterial({
            color: pennantColors[Math.abs(Math.round(p)) % pennantColors.length],
            roughness: 0.5,
          })
        );
        flag.rotation.x = Math.PI;
        flag.position.set(p, -Math.cos((p / 9) * Math.PI * 0.5) * -0.55, 0);
        bandGroup.add(flag);
      }
      group.add(bandGroup);
    }
  }

  // Instanced Trees (Pine trees for Baguio, Tropical Palms/Acacias for others)
  const treeCount = mapDef.id === 'baguio' ? 140 : 75;
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 4.2, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const crownGeo =
    mapDef.id === 'baguio'
      ? new THREE.ConeGeometry(2.3, 6.2, 7)
      : new THREE.DodecahedronGeometry(2.4, 0);
  const crownMat = new THREE.MeshStandardMaterial({
    color: mapDef.id === 'baguio' ? 0x14532d : 0x15803d,
    roughness: 0.82,
  });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  let tIdx = 0;

  for (let attempt = 0; attempt < treeCount * 6 && tIdx < treeCount; attempt++) {
    const s = samples[(attempt * 7) % SEGMENTS];
    const side = attempt % 2 === 0 ? 1 : -1;
    const dist = halfW + 11 + ((attempt * 13) % 55);
    const tx = s.point.x + s.right.x * side * dist;
    const tz = s.point.z + s.right.z * side * dist;
    if (!isClearOfTrack(tx, tz, halfW + 9)) continue;

    const scale = 0.85 + ((attempt * 17) % 30) / 100;
    dummy.position.set(tx, s.point.y + 2.1 * scale, tz);
    dummy.rotation.set(0, attempt * 0.7, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(tIdx, dummy.matrix);

    dummy.position.set(tx, s.point.y + (mapDef.id === 'baguio' ? 5.6 : 4.5) * scale, tz);
    dummy.updateMatrix();
    crowns.setMatrixAt(tIdx, dummy.matrix);
    tIdx++;
  }
  trunks.count = tIdx;
  crowns.count = tIdx;
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  group.add(trunks, crowns);

  const getClosestSampleIndex = (x: number, z: number): number => {
    let bestIdx = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < SEGMENTS; i++) {
      const dx = samples[i].point.x - x;
      const dz = samples[i].point.z - z;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const getZoneName = (t: number): string => {
    let closestName = mapDef.featuredStreets[0] || mapDef.name;
    let minDiff = 999;
    for (const lm of mapDef.landmarks) {
      let diff = Math.abs(lm.t - t);
      if (diff > 0.5) diff = 1 - diff;
      if (diff < minDiff) {
        minDiff = diff;
        closestName = lm.name;
      }
    }
    return closestName;
  };

  return {
    group,
    curve,
    samples,
    roadWidth: mapDef.roadWidth,
    outline2D,
    getClosestSampleIndex,
    getZoneName,
  };
}
