export type ArtSpriteKind = 'npc' | 'monster';
export type ArtSpriteSource = 'first_party_art' | 'community_art';

export type ArtSpriteMapping =
  | {
    type: 'npc_exact';
    visualId: string;
    packageId: string;
    plotNpcId?: string;
  }
  | {
    type: 'npc_family';
    visualId: string;
    faction?: string;
    occupation?: string;
    variant?: string;
    note?: string;
    sex?: 'male' | 'female';
    ageCategory?: 'child' | 'young' | 'adult' | 'old';
    plotNpcId?: string;
  }
  | {
    type: 'monster_kind';
    visualId: string;
    monsterKind: string;
    note?: string;
  }
  | {
    type: 'unbound';
    reason: string;
  };

export interface ArtSpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArtSpriteAnchor {
  x: number;
  y: number;
}

export interface ArtSpriteManifestRow {
  id: string;
  kind: ArtSpriteKind;
  source: ArtSpriteSource;
  sourcePath: string;
  sha256: string;
  width: number;
  height: number;
  anchorFeet: ArtSpriteAnchor;
  portraitCrop?: ArtSpriteRect;
  author?: string;
  sourceNote?: string;
  consent?: string;
  intendedMappings: readonly ArtSpriteMapping[];
}

export const NPC_VISUAL_OLGA_DMITRIEVNA = 'olga_dmitrievna';
export const NPC_VISUAL_WILD_MALE = 'wild_male';
export const NPC_VISUAL_WILD_FEMALE = 'wild_female';
export const NPC_VISUAL_CULTIST_MALE = 'cultist_male';
export const NPC_VISUAL_CULTIST_FEMALE = 'cultist_female';
export const NPC_VISUAL_LIQUIDATOR_MALE = 'liquidator_male';
export const NPC_VISUAL_LIQUIDATOR_FEMALE = 'liquidator_female';
export const NPC_VISUAL_SCIENTIST_MALE = 'scientist_male';
export const NPC_VISUAL_SCIENTIST_FEMALE = 'scientist_female';
export const NPC_VISUAL_WORKER69 = 'worker69';
export const NPC_VISUAL_CITIZEN_MALE = 'citizen_male';
export const NPC_VISUAL_CITIZEN_FEMALE = 'citizen_female';
export const NPC_VISUAL_CITIZEN_OLD_MALE = 'citizen_old_male';
export const NPC_VISUAL_CITIZEN_OLD_FEMALE = 'citizen_old_female';
export const NPC_VISUAL_CITIZEN_CHILD_MALE = 'citizen_child_male';
export const NPC_VISUAL_CITIZEN_CHILD_FEMALE = 'citizen_child_female';

export const ART_SPRITE_MANIFEST: readonly ArtSpriteManifestRow[] = [
  {
    id: 'olga_dmitrievna',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/olga_dmitrievna.png',
    sha256: '89b4832e12aadc40e3c62c215caa96325724cddca649e12b3eeb83800d482eb4',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_exact',
      visualId: NPC_VISUAL_OLGA_DMITRIEVNA,
      packageId: 'olga',
      plotNpcId: 'olga',
    }],
  },
  {
    id: 'bandit_m_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/bandit_m_1.png',
    sha256: 'a911ac855d21c8d80169230a2e494cc6cd3cb1932cf142256be3f1c84c406b8b',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_WILD_MALE,
      faction: 'WILD',
      sex: 'male',
      variant: '1',
      note: 'explicitly mapped to wild NPCs, not MonsterKind.DIKIY_MERTVYAK',
    }],
  },
  {
    id: 'bandit_m_2',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/bandit_m_2.png',
    sha256: '7602f7e1401936a63308ecbba3adbb59a634992437a72931d88d6c7d13e0cf39',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_WILD_MALE,
      faction: 'WILD',
      sex: 'male',
      variant: '2',
      note: 'explicitly mapped to wild NPCs, not MonsterKind.DIKIY_MERTVYAK',
    }],
  },
  {
    id: 'bandit_f_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/bandit_f_1.png',
    sha256: '940e866b764f9f9e687e5e9b19267e0ce4d82d4d72e095228fcc804e1932ff7b',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_WILD_FEMALE,
      faction: 'WILD',
      sex: 'female',
      variant: '1',
      note: 'explicitly mapped to wild NPCs, not MonsterKind.DIKIY_MERTVYAK',
    }],
  },
  {
    id: 'cultist_m_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/cultist_m_1.png',
    sha256: '8ae706bb326fc6adc78c3fa721236e5f7b75b7cb48984f0441e3243771a90a99',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CULTIST_MALE,
      faction: 'CULTIST',
      sex: 'male',
    }],
  },
  {
    id: 'cultist_f_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/cultist_f_1.png',
    sha256: '04ef78a6cfdb895ee9057d801e54a2b3a971b2d92351fdd1a8658036188c0f01',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CULTIST_FEMALE,
      faction: 'CULTIST',
      sex: 'female',
    }],
  },
  {
    id: 'liquidator_m_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/liquidator_m_1.png',
    sha256: '3e74e9bc4b3382fd414c6fd508259feb1bddb4d9df90c0423a7cb18e8e49666d',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_LIQUIDATOR_MALE,
      faction: 'LIQUIDATOR',
      sex: 'male',
      variant: '1',
    }],
  },
  {
    id: 'liquidator_m_2',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/liquidator_m_2.png',
    sha256: '409e9fdbc11bd96fc61744adf6d8c525a3775478fa4ab934f2c2642b0527253d',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_LIQUIDATOR_MALE,
      faction: 'LIQUIDATOR',
      sex: 'male',
      variant: '2',
    }],
  },
  {
    id: 'liquidator_m_3',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/liquidator_m_3.png',
    sha256: '1150f2cd45aaaf5d7e5e8bd00dbb00a67dec8bb357df363b8c0cea2e4f43e06d',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_LIQUIDATOR_MALE,
      faction: 'LIQUIDATOR',
      sex: 'male',
      variant: '3',
    }],
  },
  {
    id: 'liquidator_f_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/liquidator_f_1.png',
    sha256: 'a20772a0109169a527c86ee0626a7debff3dbb693f4ec371a24af27daccbbf19',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_LIQUIDATOR_FEMALE,
      faction: 'LIQUIDATOR',
      sex: 'female',
      variant: '1',
    }],
  },
  {
    id: 'scientist_m_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/scientist_m_1.png',
    sha256: '16e130a24d5faf25f76498dbdb86870e03980684859e39a569f2caf4fa683cef',
    width: 64,
    height: 77,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_SCIENTIST_MALE,
      faction: 'SCIENTIST',
      sex: 'male',
      variant: '1',
    }],
  },
  {
    id: 'scientist_m_2',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/scientist_m_2.png',
    sha256: 'dcb5d0d4b1f4a0c77e27fe9f20890705ac6f67768e1a626432024578bbe301e3',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_SCIENTIST_MALE,
      faction: 'SCIENTIST',
      sex: 'male',
      variant: '2',
    }],
  },
  {
    id: 'scientist_f_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/scientist_f_1.png',
    sha256: '9a2e254309fde2a4dabdf11281bcb27fef1ec7fb464b583f4cf947ab38ad9692',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_SCIENTIST_FEMALE,
      faction: 'SCIENTIST',
      sex: 'female',
      variant: '1',
    }],
  },
  {
    id: 'worker69_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/69worker_1.png',
    sha256: 'dcc79359711bb265b86305f73469886a0cbce84c3007e726083f974aae561089',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_WORKER69,
      occupation: 'WORKER69',
      sex: 'female',
      variant: '1',
    }],
  },
  {
    id: 'worker69_2',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/69worker_2.png',
    sha256: 'af93bc40ec9eb53ee45525414deb18ecba714d2fdbc20e07d6bd3010cb2de600',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_WORKER69,
      occupation: 'WORKER69',
      sex: 'female',
      variant: '2',
    }],
  },
  {
    id: 'citizen_m_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/citizen_m_1.png',
    sha256: '5a0bd359a733dfe5f8b8a38cf6efedaf693d73f77b6793374967036cc861c4f1',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_MALE,
      faction: 'CITIZEN',
      sex: 'male',
      ageCategory: 'adult',
      variant: '1',
    }],
  },
  {
    id: 'citizen_f_1',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/citizen_f_1.png',
    sha256: 'fd36f7426e8af5893af91fc657ca088c0afb0595fea067ab9a7560219a8c3216',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_FEMALE,
      faction: 'CITIZEN',
      sex: 'female',
      ageCategory: 'adult',
      variant: '1',
    }],
  },
  {
    id: 'citizen_old_m',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/citizen_old_m.png',
    sha256: '1e6fed57eb6c2874217cb32ecabd1b7587737b8152bc0fb67f0b35726c765a39',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_OLD_MALE,
      faction: 'CITIZEN',
      sex: 'male',
      ageCategory: 'old',
      variant: '1',
    }],
  },
  {
    id: 'citizen_old_f',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/citizen_old_f.png',
    sha256: 'c5196e4b4105dc4be47710b14affe0d8f5484ed4ffb809b52d28c6977ba4c440',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_OLD_FEMALE,
      faction: 'CITIZEN',
      sex: 'female',
      ageCategory: 'old',
      variant: '1',
    }],
  },
  {
    id: 'citizen_child_m',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/citizen_child_m.png',
    sha256: 'a1496d28ec6513e4f9bdded69ff677cbea04c3697e109841aa8265b1b02ce6f3',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_CHILD_MALE,
      faction: 'CITIZEN',
      sex: 'male',
      ageCategory: 'child',
      variant: '1',
    }],
  },
  {
    id: 'citizen_child_f',
    kind: 'npc',
    source: 'first_party_art',
    sourcePath: 'arts/ctizen_child_f.png',
    sha256: 'd171a86800d91bc3c47121ef1324e9daca931ca8e0ce153351e225b1618d2581',
    width: 147,
    height: 213,
    anchorFeet: { x: 32, y: 61 },
    portraitCrop: { x: 16, y: 4, w: 32, h: 40 },
    author: 'first_party',
    sourceNote: 'manual pixel art',
    consent: 'project_owned',
    intendedMappings: [{
      type: 'npc_family',
      visualId: NPC_VISUAL_CITIZEN_CHILD_FEMALE,
      faction: 'CITIZEN',
      sex: 'female',
      ageCategory: 'child',
      variant: '1',
    }],
  },
] as const;

export function artSpriteManifestRow(id: string | undefined): ArtSpriteManifestRow | undefined {
  if (!id) return undefined;
  return ART_SPRITE_MANIFEST.find(row => row.id === id);
}
