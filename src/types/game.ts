export interface Building {
  id: string;
  nameZh: string;
  category: 'resource' | 'defense' | 'special' | 'military';
  baseCost: {
    gold: number;
    steel: number;
    crystal: number;
    rareEarth?: number;
  };
  upgradeCost?: {
    gold: number;
    steel: number;
    crystal: number;
    rareEarth?: number;
  };
  effectZh: string;
  image: string;
  level?: number;
}

export interface Resources {
  gold: number;
  steel: number;
  crystal: number;
  rareEarth: number;
}

export interface GameConfig {
  map: 'continental' | 'regional' | 'other' | 'random';
  difficulty: 'relaxed' | 'balanced' | 'intense' | 'impossible';
  mode: 'ffa' | 'teams';
  bots: number;
  instantBuild: boolean;
  infiniteResources: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Resources;
  territory: number;
  rank: number;
  isAlly: boolean;
  isTraitor: boolean;
  badges: ('crown' | 'broken-shield' | 'handshake' | 'ban' | 'envelope' | 'ore')[];
}

export interface Territory {
  id: string;
  x: number;
  y: number;
  owner: string;
  color: string;
  buildings: Building[];
}