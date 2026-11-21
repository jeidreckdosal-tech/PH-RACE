import { AccessoryDef, PaintColorDef, VehicleDef } from '../types/game';

export const VEHICLES: VehicleDef[] = [
  {
    id: 'moriones-gt',
    name: 'Moriones GT',
    category: 'sports_car',
    categoryLabel: 'Sports Car',
    description: 'Balanced street coupe tuned for tight Manila intersections and sweeping bayfront straights.',
    price: 0,
    stats: { topSpeed: 80, acceleration: 76, handling: 78, braking: 80 },
    defaultColor: '#ef4444',
  },
  {
    id: 'tondo-sb600',
    name: 'Tondo Superbike 600',
    category: 'motorcycle',
    categoryLabel: 'Racing Motorcycle',
    description: 'Razor-lean sportbike that carves through Divisoria chicanes with explosive launch speed.',
    price: 0,
    stats: { topSpeed: 82, acceleration: 88, handling: 86, braking: 74 },
    defaultColor: '#06b6d4',
  },
  {
    id: 'bambang-kart',
    name: 'Bambang Kart X',
    category: 'go_kart',
    categoryLabel: 'Go-Kart',
    description: 'Lightweight open-wheel street kart with unmatched drift grip and instantaneous cornering.',
    price: 0,
    stats: { topSpeed: 70, acceleration: 84, handling: 96, braking: 92 },
    defaultColor: '#f59e0b',
  },
  {
    id: 'manila-apex-v8',
    name: 'Manila Apex V8',
    category: 'sports_car',
    categoryLabel: 'Sports Car',
    description: 'Widebody twin-turbo supercar engineered for top-end velocity down Ayala and Roxas Boulevard.',
    price: 350,
    stats: { topSpeed: 92, acceleration: 82, handling: 76, braking: 82 },
    defaultColor: '#2563eb',
  },
  {
    id: 'divisoria-duc',
    name: 'Divisoria Street GP',
    category: 'motorcycle',
    categoryLabel: 'Racing Motorcycle',
    description: 'Factory-spec café racer with titanium exhausts and lightning-fast throttle response.',
    price: 450,
    stats: { topSpeed: 88, acceleration: 94, handling: 88, braking: 78 },
    defaultColor: '#dc2626',
  },
  {
    id: 'lakandula-crusher',
    name: 'Lakandula Crusher',
    category: 'monster_truck',
    categoryLabel: 'Monster Truck',
    description: 'Lifted steel-framed titan with oversized knobby tires that shrugs off rival bumps.',
    price: 550,
    stats: { topSpeed: 76, acceleration: 72, handling: 64, braking: 70 },
    defaultColor: '#10b981',
  },
  {
    id: 'bgc-hyper-gt',
    name: 'BGC Hyper-Hover GT',
    category: 'futuristic',
    categoryLabel: 'Futuristic Car',
    description: 'Next-gen carbon aero prototype with plasma diffusers and blistering straight-line pace.',
    price: 850,
    stats: { topSpeed: 98, acceleration: 90, handling: 85, braking: 88 },
    defaultColor: '#8b5cf6',
  },
];

export const PAINT_COLORS: PaintColorDef[] = [
  { id: 'crimson', name: 'Manila Crimson', hex: '#ef4444', price: 0, metalness: 0.45, roughness: 0.25 },
  { id: 'cyan', name: 'Bayfront Cyan', hex: '#06b6d4', price: 0, metalness: 0.55, roughness: 0.22 },
  { id: 'amber', name: 'Jeepney Gold', hex: '#f59e0b', price: 0, metalness: 0.5, roughness: 0.28 },
  { id: 'royal', name: 'Pacific Cobalt', hex: '#2563eb', price: 0, metalness: 0.6, roughness: 0.2 },
  { id: 'emerald', name: 'Baguio Pine', hex: '#10b981', price: 120, metalness: 0.5, roughness: 0.25 },
  { id: 'magenta', name: 'Sinulog Magenta', hex: '#ec4899', price: 150, metalness: 0.55, roughness: 0.2 },
  { id: 'violet', name: 'BGC Ultraviolet', hex: '#8b5cf6', price: 200, metalness: 0.65, roughness: 0.18 },
  { id: 'obsidian', name: 'Midnight Carbon', hex: '#1e293b', price: 220, metalness: 0.75, roughness: 0.22 },
  { id: 'pearl', name: 'Pearl White', hex: '#f8fafc', price: 180, metalness: 0.35, roughness: 0.18 },
];

export const ACCESSORIES: AccessoryDef[] = [
  { id: 'none', name: 'Standard Gear', description: 'Classic character racewear.', price: 0 },
  { id: 'shades', name: 'Turbo Shades', description: 'Chrome-rimmed arcade racing sunglasses.', price: 150 },
  { id: 'garland', name: 'Fiesta Garland', description: 'Colorful sampaguita & fiesta winner lei.', price: 200 },
  { id: 'wings', name: 'Aero Wings', description: 'Lightweight carbon-fiber shoulder fins.', price: 320 },
  { id: 'crown', name: 'Hari ng Tondo Crown', description: 'Golden street-circuit championship crown.', price: 500 },
];

export const VEHICLE_MAP: Record<string, VehicleDef> = Object.fromEntries(
  VEHICLES.map((v) => [v.id, v])
);
