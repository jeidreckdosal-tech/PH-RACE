import * as THREE from 'three';
import { CHARACTER_MAP } from '../data/characters';
import {
  AccessoryId,
  CharacterId,
  TrackLandmark,
  VehicleDef,
  VehicleLivery,
} from '../types/game';
import {
  createBuildingFacadeTexture,
  createContactShadowTexture,
  createLiveryStripeTexture,
  createSignTexture,
} from './textures';

let sharedContactShadowTex: THREE.CanvasTexture | null = null;
function getContactShadowTex(): THREE.CanvasTexture {
  if (!sharedContactShadowTex) {
    sharedContactShadowTex = createContactShadowTexture();
  }
  return sharedContactShadowTex;
}

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

export function buildCharacterModel(
  charId: CharacterId,
  accessory: AccessoryId = 'none'
): CharacterRig {
  const def = CHARACTER_MAP[charId];
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const primaryMat = new THREE.MeshStandardMaterial({
    color: def.primaryColor,
    roughness: 0.42,
    metalness: charId === 'bot-bob' ? 0.65 : 0.12,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: def.secondaryColor,
    roughness: 0.55,
    metalness: 0.1,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: def.accentColor,
    roughness: 0.3,
    metalness: 0.45,
    emissive: charId === 'bot-bob' ? new THREE.Color(def.primaryColor) : new THREE.Color(0x000000),
    emissiveIntensity: charId === 'bot-bob' ? 0.35 : 0,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: def.skinTone,
    roughness: 0.65,
    metalness: charId === 'bot-bob' ? 0.55 : 0.02,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Ground contact shadow
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTex(),
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  // Proportions tailored per character personality
  const isHeavy = charId === 'papaswetson';
  const isSlender = charId === 'msbengbeng';
  const torsoWidth = isHeavy ? 0.66 : isSlender ? 0.44 : 0.52;
  const torsoDepth = isHeavy ? 0.42 : 0.3;
  const torsoHeight = isHeavy ? 0.68 : 0.62;

  // Legs (pivoted at hip y = 0.58)
  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.58, 0);
    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(isHeavy ? 0.11 : 0.09, 0.28, 6, 10),
      secondaryMat
    );
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.28),
      charId === 'bobonoy' || charId === 'ketchupa' ? primaryMat : darkMat
    );
    shoe.position.set(0, -0.5, 0.05);
    shoe.castShadow = true;
    legPivot.add(shoe);

    // Shoe sole trim
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.04, 0.29),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
    );
    sole.position.set(0, -0.55, 0.05);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.14);
  const rightLeg = makeLeg(0.14);
  bodyGroup.add(leftLeg, rightLeg);

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth),
    primaryMat
  );
  torso.position.y = 0.92;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Outfit chest detail
  const chestDetail = new THREE.Mesh(
    new THREE.BoxGeometry(torsoWidth * 0.72, torsoHeight * 0.65, torsoDepth + 0.03),
    secondaryMat
  );
  chestDetail.position.set(0, 0.94, 0.01);
  bodyGroup.add(chestDetail);

  // Character-specific torso layers
  if (charId === 'bot-bob') {
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      })
    );
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.98, torsoDepth / 2 + 0.02);
    bodyGroup.add(core);
  } else if (charId === 'bobonoy') {
    // Gold chain on chest
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.022, 8, 18, Math.PI),
      accentMat
    );
    chain.rotation.z = Math.PI;
    chain.position.set(0, 1.15, torsoDepth / 2 + 0.02);
    bodyGroup.add(chain);
  } else if (charId === 'papaswetson') {
    // Champion gold belt buckle
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(torsoWidth + 0.04, 0.11, torsoDepth + 0.04),
      darkMat
    );
    belt.position.y = 0.64;
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), accentMat);
    buckle.position.set(0, 0.64, torsoDepth / 2 + 0.03);
    bodyGroup.add(belt, buckle);
  } else if (charId === 'matulokvin') {
    // Emerald scarf
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.06, 10, 20),
      primaryMat
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 1.24, 0);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.05), primaryMat);
    tail.position.set(0.12, 1.05, 0.17);
    tail.rotation.z = -0.18;
    bodyGroup.add(scarf, tail);
  } else if (charId === 'ketchupa') {
    // Mustard stripe & hoodie pocket
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, torsoHeight + 0.01, torsoDepth + 0.04),
      secondaryMat
    );
    stripe.position.set(0, 0.92, 0.01);
    bodyGroup.add(stripe);
  }

  // Arms (pivoted at shoulders)
  const makeArm = (xOffset: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 1.16, 0);
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.32, 6, 10),
      primaryMat
    );
    sleeve.position.y = -0.18;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    const glove = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 12, 12),
      charId === 'bot-bob' ? accentMat : darkMat
    );
    glove.position.y = -0.4;
    armPivot.add(glove);
    return armPivot;
  };

  const leftArm = makeArm(-(torsoWidth / 2 + 0.1));
  const rightArm = makeArm(torsoWidth / 2 + 0.1);
  bodyGroup.add(leftArm, rightArm);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, 0);
  bodyGroup.add(headGroup);

  if (charId === 'bot-bob') {
    // Robotic visor head + antennas
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.4), secondaryMat);
    helm.castShadow = true;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.16, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        roughness: 0.1,
      })
    );
    visor.position.set(0, 0.03, 0.19);
    const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 8), accentMat);
    antL.position.set(-0.14, 0.27, 0);
    const antR = antL.clone();
    antR.position.x = 0.14;
    headGroup.add(helm, visor, antL, antR);
  } else {
    // Expressive stylized arcade character head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 18), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    [-0.085, 0.085].forEach((ex) => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeWhiteMat);
      white.position.set(ex, 0.02, 0.2);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), eyeMat);
      pupil.position.set(ex, 0.02, 0.232);
      headGroup.add(white, pupil);
    });

    // Character-specific headgear & hair
    if (charId === 'bobonoy') {
      // Backwards snapback cap
      const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        primaryMat
      );
      capDome.position.y = 0.03;
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.2), accentMat);
      brim.position.set(0, 0.05, -0.22);
      headGroup.add(capDome, brim);
    } else if (charId === 'matulokvin') {
      // Spiky dark hair + tinted aviator shades
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.252, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        darkMat
      );
      hair.position.y = 0.04;
      const shades = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.09, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.85, roughness: 0.1 })
      );
      shades.position.set(0, 0.03, 0.22);
      headGroup.add(hair, shades);
    } else if (charId === 'toybayag') {
      // Checkered headband + large chrome goggles on forehead
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.252, 0.252, 0.1, 16), secondaryMat);
      band.position.y = 0.12;
      const goggleL = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 14), accentMat);
      goggleL.position.set(-0.09, 0.14, 0.22);
      const goggleR = goggleL.clone();
      goggleR.position.x = 0.09;
      headGroup.add(band, goggleL, goggleR);
    } else if (charId === 'papaswetson') {
      // Mustache + slick pompadour
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.34), darkMat);
      hair.position.set(0, 0.2, 0.02);
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), darkMat);
      stache.position.set(0, -0.05, 0.22);
      headGroup.add(hair, stache);
    } else if (charId === 'msbengbeng') {
      // Sleek open-face racing helmet + dynamic ponytail
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.268, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.68),
        secondaryMat
      );
      helmet.rotation.x = -0.15;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.45), primaryMat);
      stripe.position.set(0, 0.15, 0);
      const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 10), darkMat);
      ponytail.position.set(0, 0.05, -0.32);
      ponytail.rotation.x = -Math.PI * 0.62;
      headGroup.add(helmet, stripe, ponytail);
    } else if (charId === 'ketchupa') {
      // Signature red helmet with white & yellow cap nozzle crest
      const hood = new THREE.Mesh(
        new THREE.SphereGeometry(0.265, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65),
        primaryMat
      );
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 12), accentMat);
      nozzle.position.set(0, 0.32, 0);
      headGroup.add(hood, nozzle);
    }
  }

  // Optional unlockable Accessory
  if (accessory === 'crown') {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.14, 0.14, 6),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 })
    );
    crown.position.set(0, 0.32, 0);
    headGroup.add(crown);
  } else if (accessory === 'shades' && charId !== 'matulokvin' && charId !== 'bot-bob') {
    const shades = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    shades.position.set(0, 0.025, 0.23);
    headGroup.add(shades);
  } else if (accessory === 'wings') {
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.6,
      roughness: 0.25,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.04), wingMat);
    wingL.position.set(-0.34, 1.1, -0.2);
    wingL.rotation.z = 0.35;
    const wingR = wingL.clone();
    wingR.position.x = 0.34;
    wingR.rotation.z = -0.35;
    bodyGroup.add(wingL, wingR);
  } else if (accessory === 'garland') {
    const lei = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.045, 8, 18),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 })
    );
    lei.rotation.x = Math.PI / 2;
    lei.position.set(0, 1.24, 0.02);
    bodyGroup.add(lei);
  }

  return { root, bodyGroup, headGroup, leftArm, rightArm, leftLeg, rightLeg };
}

export function animateCharacter(
  rig: CharacterRig,
  charId: CharacterId,
  time: number,
  mode: 'idle' | 'driving' | 'victory',
  steerAngle = 0
): void {
  if (mode === 'driving') {
    rig.bodyGroup.position.y = Math.sin(time * 16) * 0.012;
    rig.bodyGroup.rotation.z = -steerAngle * 0.22;
    rig.headGroup.rotation.y = steerAngle * 0.35;
    rig.leftArm.rotation.set(-1.05, 0, 0.18);
    rig.rightArm.rotation.set(-1.05, 0, -0.18);
    rig.leftLeg.rotation.set(-1.25, 0, 0);
    rig.rightLeg.rotation.set(-1.25, 0, 0);
    return;
  }

  if (mode === 'idle') {
    rig.bodyGroup.position.y = Math.abs(Math.sin(time * 2.4)) * 0.03;
    rig.bodyGroup.rotation.set(0, Math.sin(time * 1.1) * 0.08, 0);
    rig.headGroup.rotation.set(Math.sin(time * 2.2) * 0.05, Math.sin(time * 1.4) * 0.14, 0);
    rig.leftArm.rotation.set(Math.sin(time * 2.4) * 0.12, 0, 0.12);
    rig.rightArm.rotation.set(-Math.sin(time * 2.4) * 0.12, 0, -0.12);
    rig.leftLeg.rotation.set(0, 0, 0);
    rig.rightLeg.rotation.set(0, 0, 0);
    return;
  }

  // Unique victory celebration animations per character!
  switch (charId) {
    case 'bot-bob': {
      // Hydraulic piston pump & 360 spin
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 6)) * 0.18;
      rig.bodyGroup.rotation.y = (time * 2.4) % (Math.PI * 2);
      rig.leftArm.rotation.set(-2.6 + Math.sin(time * 12) * 0.35, 0, 0.2);
      rig.rightArm.rotation.set(-2.6 - Math.sin(time * 12) * 0.35, 0, -0.2);
      rig.leftLeg.rotation.x = Math.sin(time * 6) * 0.25;
      rig.rightLeg.rotation.x = -Math.sin(time * 6) * 0.25;
      break;
    }
    case 'bobonoy': {
      // Rhythmic Tondo alley hop
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 5.2)) * 0.32;
      rig.bodyGroup.rotation.z = Math.sin(time * 2.6) * 0.15;
      rig.leftArm.rotation.set(-2.2, 0, 0.5 + Math.sin(time * 5.2) * 0.3);
      rig.rightArm.rotation.set(-0.6, 0, -0.4);
      rig.leftLeg.rotation.x = Math.sin(time * 5.2) * 0.45;
      rig.rightLeg.rotation.x = -Math.sin(time * 5.2) * 0.45;
      break;
    }
    case 'matulokvin': {
      // Ice-cool apex nod & sky fist raise
      rig.bodyGroup.position.y = Math.sin(time * 2.5) * 0.03;
      rig.bodyGroup.rotation.y = -0.25;
      rig.headGroup.rotation.x = Math.sin(time * 3) * 0.12;
      rig.leftArm.rotation.set(-0.75, 0.6, -0.45);
      rig.rightArm.rotation.set(-2.85 + Math.sin(time * 4) * 0.15, 0, -0.15);
      break;
    }
    case 'toybayag': {
      // Fiesta backflip-style exuberant bounce
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 4.5)) * 0.42;
      rig.bodyGroup.rotation.x = Math.sin(time * 4.5) * 0.22;
      rig.leftArm.rotation.set(-2.7, 0, 0.65);
      rig.rightArm.rotation.set(-2.7, 0, -0.65);
      rig.leftLeg.rotation.x = -0.35;
      rig.rightLeg.rotation.x = 0.35;
      break;
    }
    case 'papaswetson': {
      // Heavyweight champion double-bicep flex
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 3.8)) * 0.12;
      rig.bodyGroup.rotation.y = Math.sin(time * 2) * 0.2;
      rig.leftArm.rotation.set(-1.6, 0, 1.15 + Math.sin(time * 6) * 0.15);
      rig.rightArm.rotation.set(-1.6, 0, -1.15 - Math.sin(time * 6) * 0.15);
      break;
    }
    case 'msbengbeng': {
      // Graceful podium twirl & salute
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 4)) * 0.16;
      rig.bodyGroup.rotation.y = Math.sin(time * 1.8) * 0.85;
      rig.leftArm.rotation.set(-0.4, 0, 0.55);
      rig.rightArm.rotation.set(-2.5, 0, -0.45);
      rig.leftLeg.rotation.x = Math.sin(time * 4) * 0.2;
      rig.rightLeg.rotation.x = -Math.sin(time * 4) * 0.2;
      break;
    }
    case 'ketchupa': {
      // Spicy turbo spin & double clap
      rig.bodyGroup.position.y = Math.abs(Math.sin(time * 7)) * 0.28;
      rig.bodyGroup.rotation.y = (time * 3.5) % (Math.PI * 2);
      rig.leftArm.rotation.set(-1.9, 0.5 * Math.sin(time * 10), 0.3);
      rig.rightArm.rotation.set(-1.9, -0.5 * Math.sin(time * 10), -0.3);
      break;
    }
  }
}

export interface VehicleRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  wheels: THREE.Mesh[];
  driver: CharacterRig;
  nitroFlames: THREE.Mesh[];
}

export function buildVehicleModel(
  vehicleDef: VehicleDef,
  colorHex: string,
  livery: VehicleLivery,
  charId: CharacterId,
  accessory: AccessoryId = 'none',
  anisotropy = 4
): VehicleRig {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const wheels: THREE.Mesh[] = [];
  const nitroFlames: THREE.Mesh[] = [];

  const liveryTex = createLiveryStripeTexture(colorHex, livery, anisotropy);
  const paintMat = new THREE.MeshPhysicalMaterial({
    map: liveryTex,
    roughness: 0.22,
    metalness: 0.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.62,
    metalness: 0.3,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.14,
    metalness: 0.92,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.8,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.05,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  // Ground contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 4.9),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTex(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  root.add(shadow);

  const makeWheel = (radius: number, width: number, x: number, y: number, z: number) => {
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 18),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, y, z);
    tire.castShadow = true;

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.03, 12),
      chromeMat
    );
    tire.add(rim);
    root.add(tire);
    wheels.push(tire);
  };

  const makeFlame = (x: number, y: number, z: number) => {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.75, 10), flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.set(x, y, z);
    flame.visible = false;
    chassisGroup.add(flame);
    nitroFlames.push(flame);
  };

  // Driver seated in/on vehicle
  const driver = buildCharacterModel(charId, accessory);
  driver.root.scale.setScalar(0.76);
  // Remove character's ground shadow when seated in vehicle
  if (driver.root.children[1]) {
    driver.root.children[1].visible = false;
  }

  const cat = vehicleDef.category;

  if (cat === 'motorcycle') {
    // Sleek Racing Motorcycle
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-1.1, 0.35);
    frameShape.lineTo(0.85, 0.35);
    frameShape.lineTo(1.15, 0.85);
    frameShape.lineTo(0.55, 1.1);
    frameShape.lineTo(-0.3, 0.85);
    frameShape.lineTo(-1.1, 0.95);
    frameShape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.44,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 2,
    });
    bodyGeo.center();
    bodyGeo.rotateY(Math.PI / 2);

    const fairing = new THREE.Mesh(bodyGeo, paintMat);
    fairing.position.set(0, 0.78, 0);
    fairing.castShadow = true;

    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.36), glassMat);
    windscreen.position.set(0, 1.15, 0.85);
    windscreen.rotation.x = -0.55;

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), chromeMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.1, 0.65);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.85, 10), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.28, 0.55, -0.95);

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), headlightMat);
    headL.position.set(0, 0.92, 1.24);
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.08), taillightMat);
    tailL.position.set(0, 0.98, -1.24);

    chassisGroup.add(fairing, windscreen, handlebar, exhaust, headL, tailL);
    makeWheel(0.46, 0.24, 0, 0.46, 1.08);
    makeWheel(0.48, 0.3, 0, 0.48, -1.05);
    makeFlame(0.28, 0.55, -1.65);

    driver.root.position.set(0, 0.42, -0.05);
    chassisGroup.add(driver.root);
  } else if (cat === 'go_kart') {
    // Open-wheel Go-Kart
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 2.55), trimMat);
    floor.position.set(0, 0.28, 0);
    floor.castShadow = true;

    const noseCone = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.36, 0.72), paintMat);
    noseCone.position.set(0, 0.44, 1.05);
    noseCone.castShadow = true;

    const sidePodL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 1.2), paintMat);
    sidePodL.position.set(-0.68, 0.36, 0);
    const sidePodR = sidePodL.clone();
    sidePodR.position.x = 0.68;

    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 0.36), paintMat);
    wing.position.set(0, 0.95, -1.2);
    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.48), chromeMat);
    engineBlock.position.set(0, 0.55, -0.82);

    const steerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), trimMat);
    steerCol.position.set(0, 0.65, 0.45);
    steerCol.rotation.x = 0.55;

    chassisGroup.add(floor, noseCone, sidePodL, sidePodR, wing, engineBlock, steerCol);
    makeWheel(0.3, 0.24, -0.82, 0.3, 0.92);
    makeWheel(0.3, 0.24, 0.82, 0.3, 0.92);
    makeWheel(0.34, 0.3, -0.88, 0.34, -0.92);
    makeWheel(0.34, 0.3, 0.88, 0.34, -0.92);
    makeFlame(-0.22, 0.45, -1.48);
    makeFlame(0.22, 0.45, -1.48);

    driver.root.position.set(0, 0.05, -0.15);
    chassisGroup.add(driver.root);
  } else if (cat === 'monster_truck') {
    // Lifted Monster Truck
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.32, 3.3), trimMat);
    frame.position.set(0, 0.95, 0);

    const truckBody = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.68, 3.5), paintMat);
    truckBody.position.set(0, 1.38, 0);
    truckBody.castShadow = true;

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.58, 1.45), paintMat);
    cab.position.set(0, 1.98, 0.15);
    cab.castShadow = true;

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.42, 0.08), glassMat);
    windshield.position.set(0, 1.98, 0.88);
    windshield.rotation.x = -0.18;

    const rollbar = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.055, 8, 16, Math.PI), chromeMat);
    rollbar.position.set(0, 1.72, -0.7);

    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 0.18), chromeMat);
    bullbar.position.set(0, 1.24, 1.82);

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), headlightMat);
    headL.position.set(-0.62, 1.44, 1.77);
    const headR = headL.clone();
    headR.position.x = 0.62;

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), taillightMat);
    tailL.position.set(-0.65, 1.44, -1.77);
    const tailR = tailL.clone();
    tailR.position.x = 0.65;

    chassisGroup.add(frame, truckBody, cab, windshield, rollbar, bullbar, headL, headR, tailL, tailR);
    makeWheel(0.72, 0.54, -1.18, 0.72, 1.15);
    makeWheel(0.72, 0.54, 1.18, 0.72, 1.15);
    makeWheel(0.72, 0.54, -1.18, 0.72, -1.15);
    makeWheel(0.72, 0.54, 1.18, 0.72, -1.15);
    makeFlame(-0.45, 1.05, -2.0);
    makeFlame(0.45, 1.05, -2.0);

    driver.root.position.set(0, 1.22, 0.1);
    chassisGroup.add(driver.root);
  } else if (cat === 'futuristic') {
    // Futuristic Hover-Aero Prototype
    const wedgeShape = new THREE.Shape();
    wedgeShape.moveTo(-1.95, 0);
    wedgeShape.lineTo(1.95, 0);
    wedgeShape.lineTo(2.05, 0.28);
    wedgeShape.lineTo(0.85, 0.62);
    wedgeShape.lineTo(-0.95, 0.68);
    wedgeShape.lineTo(-1.95, 0.48);
    wedgeShape.closePath();

    const hullGeo = new THREE.ExtrudeGeometry(wedgeShape, {
      depth: 1.85,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    });
    hullGeo.center();
    hullGeo.rotateY(Math.PI / 2);

    const hull = new THREE.Mesh(hullGeo, paintMat);
    hull.position.set(0, 0.58, 0);
    hull.castShadow = true;

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      glassMat
    );
    canopy.scale.set(1.05, 0.62, 1.55);
    canopy.position.set(0, 0.88, -0.05);

    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
    });
    const underglowL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.2), neonMat);
    underglowL.position.set(-0.96, 0.26, 0);
    const underglowR = underglowL.clone();
    underglowR.position.x = 0.96;

    const haloWing = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.1, 0.42), trimMat);
    haloWing.position.set(0, 1.15, -1.65);

    const headStrip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), neonMat);
    headStrip.position.set(0, 0.46, 2.08);
    const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.08), taillightMat);
    tailStrip.position.set(0, 0.66, -2.02);

    chassisGroup.add(hull, canopy, underglowL, underglowR, haloWing, headStrip, tailStrip);
    makeWheel(0.38, 0.34, -0.98, 0.38, 1.32);
    makeWheel(0.38, 0.34, 0.98, 0.38, 1.32);
    makeWheel(0.42, 0.38, -1.0, 0.42, -1.28);
    makeWheel(0.42, 0.38, 1.0, 0.42, -1.28);
    makeFlame(-0.42, 0.48, -2.3);
    makeFlame(0.42, 0.48, -2.3);

    driver.root.position.set(0, 0.26, -0.1);
    chassisGroup.add(driver.root);
  } else {
    // Sports Car (open-cockpit / low-roof arcade GT so character is clearly visible!)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.55, 3.85), paintMat);
    lowerBody.position.set(0, 0.56, 0);
    lowerBody.castShadow = true;

    const hoodSlope = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.22, 1.35), paintMat);
    hoodSlope.position.set(0, 0.84, 1.1);
    hoodSlope.rotation.x = 0.12;

    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.3, 1.05), paintMat);
    rearDeck.position.set(0, 0.9, -1.25);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.38, 0.08), glassMat);
    windshield.position.set(0, 1.06, 0.52);
    windshield.rotation.x = -0.62;

    const rollHoops = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.055, 8, 16, Math.PI), chromeMat);
    rollHoops.position.set(0, 0.95, -0.72);

    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.36), trimMat);
    spoilerWing.position.set(0, 1.24, -1.72);
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.18), trimMat);
    strutL.position.set(-0.55, 1.1, -1.68);
    const strutR = strutL.clone();
    strutR.position.x = 0.55;

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), headlightMat);
    headL.position.set(-0.62, 0.62, 1.94);
    const headR = headL.clone();
    headR.position.x = 0.62;

    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), taillightMat);
    tailL.position.set(-0.6, 0.72, -1.94);
    const tailR = tailL.clone();
    tailR.position.x = 0.6;

    const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 10), chromeMat);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.42, 0.34, -1.96);
    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.42;

    chassisGroup.add(
      lowerBody,
      hoodSlope,
      rearDeck,
      windshield,
      rollHoops,
      spoilerWing,
      strutL,
      strutR,
      headL,
      headR,
      tailL,
      tailR,
      exhaustL,
      exhaustR
    );
    makeWheel(0.4, 0.3, -0.98, 0.4, 1.24);
    makeWheel(0.4, 0.3, 0.98, 0.4, 1.24);
    makeWheel(0.42, 0.34, -1.0, 0.42, -1.24);
    makeWheel(0.42, 0.34, 1.0, 0.42, -1.24);
    makeFlame(-0.42, 0.34, -2.35);
    makeFlame(0.42, 0.34, -2.35);

    driver.root.position.set(0, 0.22, -0.1);
    chassisGroup.add(driver.root);
  }

  return { root, chassisGroup, wheels, driver, nitroFlames };
}

/**
 * Philippine Roadside Props: Jeepney, Tricycle, Sari-Sari Store, Banderitas
 */
export function buildJeepneyProp(colorA = '#ef4444', colorB = '#facc15'): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.45, 5.4),
    new THREE.MeshStandardMaterial({ color: colorA, roughness: 0.35, metalness: 0.3 })
  );
  body.position.y = 1.05;
  body.castShadow = true;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.16, 0.18, 4.4),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  roof.position.set(0, 1.85, -0.35);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.85, 1.3),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
  );
  hood.position.set(0, 0.85, 2.35);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.14, 0.28, 4.6),
    new THREE.MeshStandardMaterial({ color: colorB, roughness: 0.4 })
  );
  stripe.position.set(0, 0.82, -0.2);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  [
    [-1.02, 0.42, 1.8],
    [1.02, 0.42, 1.8],
    [-1.02, 0.42, -1.65],
    [1.02, 0.42, -1.65],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    g.add(w);
  });

  g.add(body, roof, hood, stripe);
  return g;
}

export function buildTricycleProp(colorHex = '#2563eb'): THREE.Group {
  const g = new THREE.Group();
  const moto = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.75, 1.85),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  moto.position.set(-0.45, 0.65, 0);

  const sidecar = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.95, 1.55),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.25 })
  );
  sidecar.position.set(0.45, 0.75, -0.05);
  sidecar.castShadow = true;

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.14, 1.65),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
  );
  canopy.position.set(0.45, 1.52, -0.05);

  g.add(moto, sidecar, canopy);
  return g;
}

export function buildSariSariStore(anisotropy = 4): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: Math.random() > 0.5 ? 0xfef3c7 : 0xdbeafe,
    roughness: 0.85,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 3.8), wallMat);
  base.position.y = 1.7;
  base.castShadow = true;
  base.receiveShadow = true;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.28, 4.5),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
  );
  roof.position.set(0, 3.55, 0.2);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.14, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 })
  );
  awning.position.set(0, 2.35, 2.3);
  awning.rotation.x = 0.28;

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 1.0, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
  );
  counter.position.set(0, 0.5, 2.0);

  const signTex = createSignTexture('SARI-SARI STORE', 'COLD DRINKS & SNACKS', '#dc2626', '#fde047', anisotropy);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.9),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  sign.position.set(0, 2.95, 1.94);

  g.add(base, roof, awning, counter, sign);
  return g;
}

export function buildLandmarkMesh(landmark: TrackLandmark, roadWidth: number, anisotropy = 4): THREE.Group {
  const g = new THREE.Group();
  const signTex = createSignTexture(
    landmark.signText || landmark.name,
    'BAMBANG RACE CIRCUIT',
    '#0f766e',
    '#f59e0b',
    anisotropy
  );

  if (landmark.type === 'arch') {
    const span = roadWidth + 3.5;
    const pillarGeo = new THREE.BoxGeometry(1.4, 8.5, 1.4);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
    const leftP = new THREE.Mesh(pillarGeo, pillarMat);
    leftP.position.set(-span / 2, 4.25, 0);
    const rightP = new THREE.Mesh(pillarGeo, pillarMat);
    rightP.position.set(span / 2, 4.25, 0);

    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(span + 2, 2.6, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 })
    );
    beam.position.set(0, 8.4, 0);

    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(span - 1.5, 2.1),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    banner.position.set(0, 8.4, 0.85);
    const bannerBack = banner.clone();
    bannerBack.position.z = -0.85;
    g.add(leftP, rightP, beam, banner, bannerBack);
    return g;
  }

  if (landmark.type === 'church') {
    // Santo Niño de Tondo Church inspired baroque facade & twin belfries
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe7dcc8, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
    const nave = new THREE.Mesh(new THREE.BoxGeometry(18, 13, 24), stoneMat);
    nave.position.y = 6.5;
    nave.castShadow = true;

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 })
    );
    dome.position.set(0, 13, -3);

    const towerL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 19, 4.2), stoneMat);
    towerL.position.set(-7.5, 9.5, 10.5);
    const capL = new THREE.Mesh(new THREE.ConeGeometry(3.1, 4.5, 4), trimMat);
    capL.rotation.y = Math.PI / 4;
    capL.position.set(-7.5, 21.2, 10.5);

    const towerR = towerL.clone();
    towerR.position.x = 7.5;
    const capR = capL.clone();
    capR.position.x = 7.5;

    const archDoor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.5, 0.8), trimMat);
    archDoor.position.set(0, 2.75, 12.1);

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 3.2),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 10.5, 12.2);

    g.add(nave, dome, towerL, capL, towerR, capR, archDoor, signBoard);
    return g;
  }

  if (landmark.type === 'market') {
    // Tutuban / Divisoria bustling market hall
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const hall = new THREE.Mesh(new THREE.BoxGeometry(20, 8.5, 14), brickMat);
    hall.position.y = 4.25;
    hall.castShadow = true;

    const roof = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 10.5, 4.2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 10.6;

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(19, 0.35, 3.8),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 })
    );
    canopy.position.set(0, 3.6, 8.2);
    canopy.rotation.x = 0.2;

    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3.4),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 6.8, 7.1);

    g.add(hall, roof, canopy, signBoard);
    return g;
  }

  if (landmark.type === 'clocktower') {
    // Manila City Hall Clock Tower
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.75 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 14), wallMat);
    base.position.y = 4.5;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 22, 6), wallMat);
    tower.position.set(0, 11, 2);
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.5 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 17, 5.1);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
    );
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, 25, 2);
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 3),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 6.2, 7.15);
    g.add(base, tower, clockFace, spire, signBoard);
    return g;
  }

  if (landmark.type === 'monument' || landmark.type === 'plaza') {
    const stone = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 });
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(6, 7.5, 2.2, 8), stone);
    plinth.position.y = 1.1;
    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.2, 16, 4), stone);
    obelisk.position.y = 10;
    const goldTop = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 })
    );
    goldTop.position.y = 19;
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(9.5, 2.8),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 4.2, 6.6);
    g.add(plinth, obelisk, goldTop, signBoard);
    return g;
  }

  if (landmark.type === 'skyscraper') {
    const facadeTex = createBuildingFacadeTexture('#1e293b', '#38bdf8', true, anisotropy);
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(14, 38, 14),
      new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.25, metalness: 0.65 })
    );
    tower.position.y = 19;
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 3),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 5.5, 7.15);
    g.add(tower, signBoard);
    return g;
  }

  // Default: Filipino Shophouse / Baywalk / Pine Lodge / Bridge
  const facadeTex = createBuildingFacadeTexture(
    landmark.type === 'pine_lodge' ? '#78350f' : '#e2e8f0',
    '#fde68a',
    false,
    anisotropy
  );
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(14, 10, 10),
    new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.75 })
  );
  block.position.y = 5;
  const signBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.8),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  signBoard.position.set(0, 5.4, 5.15);
  g.add(block, signBoard);
  return g;
}
