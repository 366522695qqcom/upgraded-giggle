import { Config } from "../configuration/Config";
import { AllPlayersStats, ClientID } from "../Schemas";
import { getClanTag } from "../Util";
import { GameMap, TileRef } from "./GameMap";
import {
  GameUpdate,
  GameUpdateType,
  PlayerUpdate,
  UnitUpdate,
} from "./GameUpdates";
import { RailNetwork } from "./RailNetwork";
import { Stats } from "./Stats";
import { UnitPredicate } from "./UnitGrid";

function isEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown,
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

export type PlayerID = string;
export type Tick = number;
export type Gold = bigint;

export const AllPlayers = "AllPlayers" as const;

// export type GameUpdates = Record<GameUpdateType, GameUpdate[]>;
// Create a type that maps GameUpdateType to its corresponding update type
type UpdateTypeMap<T extends GameUpdateType> = Extract<GameUpdate, { type: T }>;

// Then use it to create the record type
export type GameUpdates = {
  [K in GameUpdateType]: UpdateTypeMap<K>[];
};

export interface MapPos {
  x: number;
  y: number;
}

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
  Impossible = "Impossible",
}
export const isDifficulty = (value: unknown): value is Difficulty =>
  isEnumValue(Difficulty, value);

export type Team = string;

export const Duos = "Duos" as const;
export const Trios = "Trios" as const;
export const Quads = "Quads" as const;

export const ColoredTeams: Record<string, Team> = {
  Red: "Red",
  Blue: "Blue",
  Teal: "Teal",
  Purple: "Purple",
  Yellow: "Yellow",
  Orange: "Orange",
  Green: "Green",
  Bot: "Bot",
} as const;

export enum GameMapType {
  World = "World",
  GiantWorldMap = "Giant World Map",
  Europe = "Europe",
  EuropeClassic = "Europe Classic",
  Mena = "Mena",
  NorthAmerica = "North America",
  SouthAmerica = "South America",
  Oceania = "Oceania",
  BlackSea = "Black Sea",
  Africa = "Africa",
  Pangaea = "Pangaea",
  Asia = "Asia",
  Mars = "Mars",
  Britannia = "Britannia",
  GatewayToTheAtlantic = "Gateway to the Atlantic",
  Australia = "Australia",
  Iceland = "Iceland",
  EastAsia = "East Asia",
  BetweenTwoSeas = "Between Two Seas",
  FaroeIslands = "Faroe Islands",
  DeglaciatedAntarctica = "Deglaciated Antarctica",
  FalklandIslands = "Falkland Islands",
  Baikal = "Baikal",
  Halkidiki = "Halkidiki",
  StraitOfGibraltar = "Strait of Gibraltar",
  Italia = "Italia",
  Japan = "Japan",
  Yenisei = "Yenisei",
  Pluto = "Pluto",
  Montreal = "Montreal",
  Achiran = "Achiran",
}

export type GameMapName = keyof typeof GameMapType;

export const mapCategories: Record<string, GameMapType[]> = {
  continental: [
    GameMapType.World,
    GameMapType.GiantWorldMap,
    GameMapType.NorthAmerica,
    GameMapType.SouthAmerica,
    GameMapType.Europe,
    GameMapType.EuropeClassic,
    GameMapType.Asia,
    GameMapType.Africa,
    GameMapType.Oceania,
  ],
  regional: [
    GameMapType.BlackSea,
    GameMapType.Britannia,
    GameMapType.GatewayToTheAtlantic,
    GameMapType.BetweenTwoSeas,
    GameMapType.Iceland,
    GameMapType.EastAsia,
    GameMapType.Mena,
    GameMapType.Australia,
    GameMapType.FaroeIslands,
    GameMapType.FalklandIslands,
    GameMapType.Baikal,
    GameMapType.Halkidiki,
    GameMapType.StraitOfGibraltar,
    GameMapType.Italia,
    GameMapType.Japan,
    GameMapType.Yenisei,
    GameMapType.Montreal,
  ],
  fantasy: [
    GameMapType.Pangaea,
    GameMapType.Pluto,
    GameMapType.Mars,
    GameMapType.DeglaciatedAntarctica,
    GameMapType.Achiran,
  ],
};

export enum GameType {
  Singleplayer = "Singleplayer",
  Public = "Public",
  Private = "Private",
}
export const isGameType = (value: unknown): value is GameType =>
  isEnumValue(GameType, value);

export enum GameMode {
  FFA = "Free For All",
  Team = "Team",
}
export const isGameMode = (value: unknown): value is GameMode =>
  isEnumValue(GameMode, value);

export enum GameMapSize {
  Compact = "Compact",
  Normal = "Normal",
}

export interface UnitInfo {
  cost: (player: Player) => Gold;
  // Determines if its owner changes when its tile is conquered.
  territoryBound: boolean;
  maxHealth?: number;
  damage?: number;
  constructionDuration?: number;
  upgradable?: boolean;
  canBuildTrainStation?: boolean;
  experimental?: boolean;
}

export enum UnitType {
  TransportShip = "Transport",
  Warship = "Warship",
  Shell = "Shell",
  SAMMissile = "SAMMissile",
  Port = "Port",
  AtomBomb = "Atom Bomb",
  HydrogenBomb = "Hydrogen Bomb",
  TradeShip = "Trade Ship",
  MissileSilo = "Missile Silo",
  DefensePost = "Defense Post",
  SAMLauncher = "SAM Launcher",
  City = "City",
  MIRV = "MIRV",
  MIRVWarhead = "MIRV Warhead",
  Construction = "Construction",
  Train = "Train",
  Factory = "Factory",
}

export enum TrainType {
  Engine = "Engine",
  Carriage = "Carriage",
}

const _structureTypes: ReadonlySet<UnitType> = new Set([
  UnitType.City,
  UnitType.Construction,
  UnitType.DefensePost,
  UnitType.SAMLauncher,
  UnitType.MissileSilo,
  UnitType.Port,
  UnitType.Factory,
]);

export function isStructureType(type: UnitType): boolean {
  return _structureTypes.has(type);
}

export interface OwnerComp {
  owner: Player;
}

export type TrajectoryTile = {
  tile: TileRef;
  targetable: boolean;
};
export interface UnitParamsMap {
  [UnitType.TransportShip]: {
    troops?: number;
    destination?: TileRef;
  };

  [UnitType.Warship]: {
    patrolTile: TileRef;
  };

  [UnitType.Shell]: Record<string, never>;

  [UnitType.SAMMissile]: Record<string, never>;

  [UnitType.Port]: Record<string, never>;

  [UnitType.AtomBomb]: {
    targetTile?: number;
    trajectory: TrajectoryTile[];
  };

  [UnitType.HydrogenBomb]: {
    targetTile?: number;
    trajectory: TrajectoryTile[];
  };

  [UnitType.TradeShip]: {
    targetUnit: Unit;
    lastSetSafeFromPirates?: number;
  };

  [UnitType.Train]: {
    trainType: TrainType;
    targetUnit?: Unit;
    loaded?: boolean;
  };

  [UnitType.Factory]: Record<string, never>;

  [UnitType.MissileSilo]: Record<string, never>;

  [UnitType.DefensePost]: Record<string, never>;

  [UnitType.SAMLauncher]: Record<string, never>;

  [UnitType.City]: Record<string, never>;

  [UnitType.MIRV]: Record<string, never>;

  [UnitType.MIRVWarhead]: {
    targetTile?: number;
  };

  [UnitType.Construction]: Record<string, never>;
}

// Type helper to get params type for a specific unit type
export type UnitParams<T extends UnitType> = UnitParamsMap[T];

export type AllUnitParams = UnitParamsMap[keyof UnitParamsMap];

export const nukeTypes = [
  UnitType.AtomBomb,
  UnitType.HydrogenBomb,
  UnitType.MIRVWarhead,
  UnitType.MIRV,
] as UnitType[];

export enum Relation {
  Hostile = 0,
  Distrustful = 1,
  Neutral = 2,
  Friendly = 3,
}

export class Nation {
  constructor(
    public readonly spawnCell: Cell,
    public readonly strength: number,
    public readonly playerInfo: PlayerInfo,
  ) {}
}

export class Cell {
  public index: number;

  private strRepr: string;

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    this.strRepr = `Cell[${this.x},${this.y}]`;
  }

  pos(): MapPos {
    return {
      x: this.x,
      y: this.y,
    };
  }

  toString(): string {
    return this.strRepr;
  }
}

export enum TerrainType {
  Plains,
  Highland,
  Mountain,
  Lake,
  Ocean,
}

export enum PlayerType {
  Bot = "BOT",
  Human = "HUMAN",
  FakeHuman = "FAKEHUMAN",
}

export interface Execution {
  isActive(): boolean;
  activeDuringSpawnPhase(): boolean;
  init(mg: Game, ticks: number): void;
  tick(ticks: number): void;
}

export interface Attack {
  id(): string;
  retreating(): boolean;
  retreated(): boolean;
  orderRetreat(): void;
  executeRetreat(): void;
  target(): Player | TerraNullius;
  attacker(): Player;
  troops(): number;
  setTroops(troops: number): void;
  isActive(): boolean;
  delete(): void;
  // The tile the attack originated from, mostly used for boat attacks.
  sourceTile(): TileRef | null;
  addBorderTile(tile: TileRef): void;
  removeBorderTile(tile: TileRef): void;
  clearBorder(): void;
  borderSize(): number;
  averagePosition(): Cell | null;
}

export interface AllianceRequest {
  accept(): void;
  reject(): void;
  requestor(): Player;
  recipient(): Player;
  createdAt(): Tick;
  status(): "pending" | "accepted" | "rejected";
}

export interface Alliance {
  requestor(): Player;
  recipient(): Player;
  createdAt(): Tick;
  expiresAt(): Tick;
  other(player: Player): Player;
}

export interface MutableAlliance extends Alliance {
  expire(): void;
  other(player: Player): Player;
  bothAgreedToExtend(): boolean;
  addExtensionRequest(player: Player): void;
  id(): number;
  extend(): void;
  onlyOneAgreedToExtend(): boolean;
}

export class PlayerInfo {
  public readonly clan: string | null;

  constructor(
    public readonly name: string,
    public readonly playerType: PlayerType,
    // null if bot.
    public readonly clientID: ClientID | null,
    // TODO: make player id the small id
    public readonly id: PlayerID,
    public readonly nation?: Nation | null,
  ) {
    this.clan = getClanTag(name);
  }
}

export function isUnit(unit: unknown): unit is Unit {
  return (
    unit &&
    typeof unit === "object" &&
    "isUnit" in unit &&
    typeof unit.isUnit === "function" &&
    unit.isUnit()
  );
}

export interface Unit {
  isUnit(): this is Unit;

  // Common properties.
  id(): number;
  type(): UnitType;
  owner(): Player;
  info(): UnitInfo;
  isMarkedForDeletion(): boolean;
  markForDeletion(): void;
  isOverdueDeletion(): boolean;
  delete(displayMessage?: boolean, destroyer?: Player): void;
  tile(): TileRef;
  lastTile(): TileRef;
  move(tile: TileRef): void;
  isActive(): boolean;
  setOwner(owner: Player): void;
  touch(): void;
  hash(): number;
  toUpdate(): UnitUpdate;
  hasTrainStation(): boolean;
  setTrainStation(trainStation: boolean): void;

  // Train
  trainType(): TrainType | undefined;
  isLoaded(): boolean | undefined;
  setLoaded(loaded: boolean): void;

  // Targeting
  setTargetTile(cell: TileRef | undefined): void;
  targetTile(): TileRef | undefined;
  setTrajectoryIndex(i: number): void;
  trajectoryIndex(): number;
  trajectory(): TrajectoryTile[];
  setTargetUnit(unit: Unit | undefined): void;
  targetUnit(): Unit | undefined;
  setTargetedBySAM(targeted: boolean): void;
  targetedBySAM(): boolean;
  setReachedTarget(): void;
  reachedTarget(): boolean;
  isTargetable(): boolean;
  setTargetable(targetable: boolean): void;

  // Health
  hasHealth(): boolean;
  retreating(): boolean;
  orderBoatRetreat(): void;
  health(): number;
  modifyHealth(delta: number, attacker?: Player): void;

  // Troops
  setTroops(troops: number): void;
  troops(): number;

  // --- UNIT SPECIFIC ---

  // SAMs & Missile Silos
  launch(): void;
  reloadMissile(): void;
  isInCooldown(): boolean;
  missileTimerQueue(): number[];

  // Trade Ships
  setSafeFromPirates(): void; // Only for trade ships
  isSafeFromPirates(): boolean; // Only for trade ships

  // Construction
  constructionType(): UnitType | null;
  setConstructionType(type: UnitType): void;

  // Upgradable Structures
  level(): number;
  increaseLevel(): void;
  decreaseLevel(destroyer?: Player): void;

  // Warships
  setPatrolTile(tile: TileRef): void;
  patrolTile(): TileRef | undefined;
}

export interface TerraNullius {
  isPlayer(): false;
  id(): null;
  clientID(): ClientID;
  smallID(): number;
}

export class Embargo {
  public readonly createdAt: Tick;
  public readonly isTemporary: boolean;
  public readonly target: PlayerID; // 使用 PlayerID 而不是 Player 来避免循环依赖

  constructor(createdAt: Tick, isTemporary: boolean, target: PlayerID) {
    this.createdAt = createdAt;
    this.isTemporary = isTemporary;
    this.target = target;
  }
}

export abstract class Player {
  // 基础信息
  abstract smallID(): number;
  abstract info(): PlayerInfo;
  abstract name(): string;
  abstract displayName(): string;
  abstract clientID(): ClientID | null;
  abstract id(): PlayerID;
  abstract type(): PlayerType;
  abstract isPlayer(): this is Player;
  abstract toString(): string;

  // 国策系统相关方法
  abstract activePolicies(): Policy[];
  abstract availablePolicies(): Policy[];
  abstract enactPolicy(policyType: PolicyType): boolean;
  abstract cancelPolicy(policyType: PolicyType): boolean;
  abstract policyRemainingDuration(policyType: PolicyType): number | null;
  abstract updatePolicyAndTech(): void;

  // 科技树系统相关方法
  abstract researchedTechs(): Tech[];
  abstract currentResearch(): {
    tech: Tech;
    progress: number;
    remainingTime: number;
  } | null;
  abstract availableTechs(): Tech[];
  abstract startResearch(techType: TechType): boolean;
  abstract cancelResearch(): boolean;
  abstract researchProgress(techType: TechType): number | null;

  // 效果计算相关方法
  abstract getEffectiveGoldProductionRate(): number;
  abstract getEffectiveTroopTrainingRate(): number;
  abstract getUnitCostReduction(): number;
  abstract getUnlockedUnits(): UnitType[];
  abstract getUnlockedPolicies(): PolicyType[];
  abstract getResearchSpeedMultiplier(): number;
  abstract getDefenseBonus(): number;
  abstract getAttackBonus(): number;
  abstract getDiplomacyBonus(): number;

  // State & Properties
  abstract isAlive(): boolean;
  abstract isTraitor(): boolean;
  abstract markTraitor(): void;
  abstract get largestClusterBoundingBox(): { min: Cell; max: Cell } | null;
  abstract lastTileChange(): Tick;

  abstract isDisconnected(): boolean;
  abstract markDisconnected(isDisconnected: boolean): void;

  abstract hasSpawned(): boolean;
  abstract setHasSpawned(hasSpawned: boolean): void;

  // Territory
  abstract tiles(): ReadonlySet<TileRef>;
  abstract borderTiles(): ReadonlySet<TileRef>;
  abstract numTilesOwned(): number;
  abstract conquer(tile: TileRef): void;
  abstract relinquish(tile: TileRef): void;

  // Resources & Troops
  abstract gold(): Gold;
  abstract addGold(toAdd: Gold, tile?: TileRef): void;
  abstract removeGold(toRemove: Gold): Gold;
  abstract troops(): number;
  abstract setTroops(troops: number): void;
  abstract addTroops(troops: number): void;
  abstract removeTroops(troops: number): number;

  // Units
  abstract units(...types: UnitType[]): Unit[];
  abstract unitCount(type: UnitType): number;
  abstract unitsConstructed(type: UnitType): number;
  abstract unitsOwned(type: UnitType): number;
  abstract buildableUnits(tile: TileRef | null): BuildableUnit[];
  abstract canBuild(type: UnitType, targetTile: TileRef): TileRef | false;
  abstract buildUnit<T extends UnitType>(
    type: T,
    spawnTile: TileRef,
    params: UnitParams<T>,
  ): Unit;

  // Returns the existing unit that can be upgraded,
  // or false if it cannot be upgraded.
  // New units of the same type can upgrade existing units.
  // e.g. if a place a new city here, can it upgrade an existing city?
  abstract findUnitToUpgrade(type: UnitType, targetTile: TileRef): Unit | false;
  abstract canUpgradeUnit(unit: Unit): boolean;
  abstract upgradeUnit(unit: Unit): void;
  abstract captureUnit(unit: Unit): void;

  // Relations & Diplomacy
  abstract neighbors(): (Player | TerraNullius)[];
  abstract sharesBorderWith(other: Player | TerraNullius): boolean;
  abstract relation(other: Player): Relation;
  abstract allRelationsSorted(): { player: Player; relation: Relation }[];
  abstract updateRelation(other: Player, delta: number): void;
  abstract decayRelations(): void;
  abstract isOnSameTeam(other: Player): boolean;
  // Either allied or on same team.
  abstract isFriendly(other: Player): boolean;
  abstract team(): Team | null;
  abstract clan(): string | null;
  abstract incomingAllianceRequests(): AllianceRequest[];
  abstract outgoingAllianceRequests(): AllianceRequest[];
  abstract alliances(): MutableAlliance[];
  abstract expiredAlliances(): Alliance[];
  abstract allies(): Player[];
  abstract isAlliedWith(other: Player): boolean;
  abstract allianceWith(other: Player): MutableAlliance | null;
  abstract canSendAllianceRequest(other: Player): boolean;
  abstract breakAlliance(alliance: Alliance): void;
  abstract createAllianceRequest(recipient: Player): AllianceRequest | null;

  // Targeting
  abstract canTarget(other: Player): boolean;
  abstract target(other: Player): void;
  abstract targets(): Player[];
  abstract transitiveTargets(): Player[];

  // Communication
  abstract canSendEmoji(recipient: Player | typeof AllPlayers): boolean;
  abstract outgoingEmojis(): EmojiMessage[];
  abstract sendEmoji(
    recipient: Player | typeof AllPlayers,
    emoji: string,
  ): void;

  // Donation
  abstract canDonateGold(recipient: Player): boolean;
  abstract canDonateTroops(recipient: Player): boolean;
  abstract donateTroops(recipient: Player, troops: number): boolean;
  abstract donateGold(recipient: Player, gold: Gold): boolean;
  abstract canDeleteUnit(): boolean;
  abstract recordDeleteUnit(): void;
  abstract canEmbargoAll(): boolean;
  abstract recordEmbargoAll(): void;

  // Embargo
  abstract hasEmbargoAgainst(other: Player): boolean;
  abstract tradingPartners(): Player[];
  abstract addEmbargo(other: Player, isTemporary: boolean): void;
  abstract getEmbargoes(): Embargo[];
  abstract stopEmbargo(other: Player): void;
  abstract endTemporaryEmbargo(other: Player): void;
  abstract canTrade(other: Player): boolean;

  // Attacking.
  abstract canAttack(tile: TileRef): boolean;

  abstract createAttack(
    target: Player | TerraNullius,
    troops: number,
    sourceTile: TileRef | null,
    border: Set<number>,
  ): Attack;
  abstract outgoingAttacks(): Attack[];
  abstract incomingAttacks(): Attack[];
  abstract orderRetreat(attackID: string): void;
  abstract executeRetreat(attackID: string): void;

  // Misc
  abstract toUpdate(): PlayerUpdate;
  abstract playerProfile(): PlayerProfile;
  // WARNING: this operation is expensive.
  abstract bestTransportShipSpawn(tile: TileRef): TileRef | false;
}

export interface Game extends GameMap {
  // Map & Dimensions
  isOnMap(cell: Cell): boolean;
  width(): number;
  height(): number;
  map(): GameMap;
  miniMap(): GameMap;
  forEachTile(fn: (tile: TileRef) => void): void;

  // Player Management
  player(id: PlayerID): Player;
  players(): Player[];
  allPlayers(): Player[];
  playerByClientID(id: ClientID): Player | null;
  playerBySmallID(id: number): Player | TerraNullius;
  hasPlayer(id: PlayerID): boolean;
  addPlayer(playerInfo: PlayerInfo): Player;
  terraNullius(): TerraNullius;
  owner(ref: TileRef): Player | TerraNullius;

  teams(): Team[];

  // Alliances
  alliances(): MutableAlliance[];
  expireAlliance(alliance: Alliance): void;

  // Game State
  /**
   * 获取当前游戏的tick数
   */
  ticks(): Tick;
  inSpawnPhase(): boolean;
  executeNextTick(): GameUpdates;
  setWinner(winner: Player | Team, allPlayersStats: AllPlayersStats): void;
  config(): Config;

  // Units
  units(...types: UnitType[]): Unit[];
  unitCount(type: UnitType): number;
  unitInfo(type: UnitType): UnitInfo;
  hasUnitNearby(
    tile: TileRef,
    searchRange: number,
    type: UnitType,
    playerId?: PlayerID,
  ): boolean;
  nearbyUnits(
    tile: TileRef,
    searchRange: number,
    types: UnitType | UnitType[],
    predicate?: UnitPredicate,
  ): Array<{ unit: Unit; distSquared: number }>;

  addExecution(...exec: Execution[]): void;
  displayMessage(
    message: string,
    type: MessageType,
    playerID: PlayerID | null,
    goldAmount?: bigint,
    params?: Record<string, string | number>,
  ): void;
  displayIncomingUnit(
    unitID: number,
    message: string,
    type: MessageType,
    playerID: PlayerID | null,
  ): void;

  displayChat(
    message: string,
    category: string,
    target: PlayerID | undefined,
    playerID: PlayerID | null,
    isFrom: boolean,
    recipient: string,
  ): void;

  // Nations
  nations(): Nation[];

  numTilesWithFallout(): number;
  // Optional as it's not initialized before the end of spawn phase
  stats(): Stats;

  addUpdate(update: GameUpdate): void;
  railNetwork(): RailNetwork;
  conquerPlayer(conqueror: Player, conquered: Player): void;
}

export interface PlayerActions {
  canAttack: boolean;
  buildableUnits: BuildableUnit[];
  canSendEmojiAllPlayers: boolean;
  canEmbargoAll?: boolean;
  interaction?: PlayerInteraction;
}

export interface BuildableUnit {
  canBuild: TileRef | false;
  // unit id of the existing unit that can be upgraded, or false if it cannot be upgraded.
  canUpgrade: number | false;
  type: UnitType;
  cost: Gold;
}

export interface PlayerProfile {
  relations: Record<number, Relation>;
  alliances: number[];
}

export interface PlayerBorderTiles {
  borderTiles: ReadonlySet<TileRef>;
}

export interface PlayerInteraction {
  sharedBorder: boolean;
  canSendEmoji: boolean;
  canSendAllianceRequest: boolean;
  canBreakAlliance: boolean;
  canTarget: boolean;
  canDonateGold: boolean;
  canDonateTroops: boolean;
  canEmbargo: boolean;
  allianceExpiresAt?: Tick;
}

export interface EmojiMessage {
  message: string;
  senderID: number;
  recipientID: number | typeof AllPlayers;
  createdAt: Tick;
}

// 国策类型枚举
export enum PolicyType {
  // 经济类
  ECONOMIC_STIMULUS = "EconomicStimulus",
  INDUSTRIALIZATION = "Industrialization",
  FREE_TRADE = "FreeTrade",
  PROTECTIONISM = "Protectionism",
  TAX_REFORM = "TaxReform",
  // 军事类
  MILITARY_TRAINING = "MilitaryTraining",
  DEFENSIVE_DOCTRINE = "DefensiveDoctrine",
  OFFENSIVE_DOCTRINE = "OffensiveDoctrine",
  SIEGE_EXPERTISE = "SiegeExpertise",
  NAVAL_SUPREMACY = "NavalSupremacy",
  // 文化类
  CULTURAL_EXPANSION = "CulturalExpansion",
  EDUCATIONAL_REFORM = "EducationalReform",
  RELIGIOUS_UNITY = "ReligiousUnity",
  DIPLOMATIC_FINESSE = "DiplomaticFinesse",
  PROPAGANDA = "Propaganda",
}

// 科技类型枚举
export enum TechType {
  // 基础科技
  AGRICULTURAL_REVOLUTION = "AgriculturalRevolution",
  IRON_WORKING = "IronWorking",
  WRITING = "Writing",
  // 经济科技
  BANKING = "Banking",
  INDUSTRIAL_REVOLUTION = "IndustrialRevolution",
  TRADE_NETWORKS = "TradeNetworks",
  // 军事科技
  MILITARY_ENGINEERING = "MilitaryEngineering",
  GUNPOWDER = "Gunpowder",
  NAVAL_TECHNOLOGY = "NavalTechnology",
  // 高级科技
  COMPUTERS = "Computers",
  NUCLEAR_FISSION = "NuclearFission",
  SPACE_EXPLORATION = "SpaceExploration",
}

// 国策效果类型
export type PolicyEffect = {
  goldProductionMultiplier?: number;
  troopTrainingMultiplier?: number;
  unitCostReduction?: number;
  resourceProductionMultiplier?: number;
  defenseBonus?: number;
  attackBonus?: number;
  diplomacyBonus?: number;
  researchSpeedMultiplier?: number;
};

// 科技效果类型
export type TechEffect = {
  goldProductionMultiplier?: number;
  troopTrainingMultiplier?: number;
  unitCostReduction?: number;
  unlockedUnits?: UnitType[];
  unlockedPolicies?: PolicyType[];
  resourceProductionMultiplier?: number;
  defenseBonus?: number;
  attackBonus?: number;
  researchSpeedMultiplier?: number;
};

// 国策接口
export interface Policy {
  type: PolicyType;
  name: string;
  description: string;
  category: "economic" | "military" | "cultural";
  cost: Gold;
  duration: number; // 持续时间（回合数）
  effects: PolicyEffect;
  prerequisites?: TechType[];
}

// 科技接口
export interface Tech {
  type: TechType;
  name: string;
  description: string;
  category: "basic" | "economic" | "military" | "advanced";
  cost: Gold;
  researchTime: number; // 研发时间（回合数）
  effects: TechEffect;
  prerequisites?: TechType[];
}

export enum MessageType {
  ATTACK_FAILED,
  ATTACK_CANCELLED,
  ATTACK_REQUEST,
  CONQUERED_PLAYER,
  MIRV_INBOUND,
  NUKE_INBOUND,
  HYDROGEN_BOMB_INBOUND,
  NAVAL_INVASION_INBOUND,
  SAM_MISS,
  SAM_HIT,
  CAPTURED_ENEMY_UNIT,
  UNIT_CAPTURED_BY_ENEMY,
  UNIT_DESTROYED,
  ALLIANCE_ACCEPTED,
  ALLIANCE_REJECTED,
  ALLIANCE_REQUEST,
  ALLIANCE_BROKEN,
  ALLIANCE_EXPIRED,
  SENT_GOLD_TO_PLAYER,
  RECEIVED_GOLD_FROM_PLAYER,
  RECEIVED_GOLD_FROM_TRADE,
  SENT_TROOPS_TO_PLAYER,
  RECEIVED_TROOPS_FROM_PLAYER,
  CHAT,
  RENEW_ALLIANCE,
  POLICY_ENACTED,
  POLICY_EXPIRED,
  TECH_RESEARCHED,
  RESEARCH_STARTED,
  ENACT_POLICY,
  START_RESEARCH,
  MOVE_UNIT,
  ATTACK,
  TRAIN_UNIT,
  BUILD_CITY,
  UPGRADE_CITY,
  TRADE_RESOURCES,
  DECLARE_WAR,
  SEND_DIPLOMATIC_MESSAGE,
  GAME_ERROR,
}

// 基础消息接口
export interface Message {
  type: MessageType;
  data?: any;
}

// 游戏消息接口
export interface GameMessage {
  type: MessageType;
  senderId?: PlayerID;
  data?: any;
  timestamp?: number;
}

// Message categories used for filtering events in the EventsDisplay
export enum MessageCategory {
  ATTACK = "ATTACK",
  NUKE = "NUKE",
  ALLIANCE = "ALLIANCE",
  TRADE = "TRADE",
  CHAT = "CHAT",
}

// Ensures that all message types are included in a category
export const MESSAGE_TYPE_CATEGORIES: Record<MessageType, MessageCategory> = {
  [MessageType.ATTACK_FAILED]: MessageCategory.ATTACK,
  [MessageType.ATTACK_CANCELLED]: MessageCategory.ATTACK,
  [MessageType.ATTACK_REQUEST]: MessageCategory.ATTACK,
  [MessageType.CONQUERED_PLAYER]: MessageCategory.ATTACK,
  [MessageType.MIRV_INBOUND]: MessageCategory.NUKE,
  [MessageType.NUKE_INBOUND]: MessageCategory.NUKE,
  [MessageType.HYDROGEN_BOMB_INBOUND]: MessageCategory.NUKE,
  [MessageType.NAVAL_INVASION_INBOUND]: MessageCategory.ATTACK,
  [MessageType.SAM_MISS]: MessageCategory.ATTACK,
  [MessageType.SAM_HIT]: MessageCategory.ATTACK,
  [MessageType.CAPTURED_ENEMY_UNIT]: MessageCategory.ATTACK,
  [MessageType.UNIT_CAPTURED_BY_ENEMY]: MessageCategory.ATTACK,
  [MessageType.UNIT_DESTROYED]: MessageCategory.ATTACK,
  [MessageType.ALLIANCE_ACCEPTED]: MessageCategory.ALLIANCE,
  [MessageType.ALLIANCE_REJECTED]: MessageCategory.ALLIANCE,
  [MessageType.ALLIANCE_REQUEST]: MessageCategory.ALLIANCE,
  [MessageType.ALLIANCE_BROKEN]: MessageCategory.ALLIANCE,
  [MessageType.ALLIANCE_EXPIRED]: MessageCategory.ALLIANCE,
  [MessageType.RENEW_ALLIANCE]: MessageCategory.ALLIANCE,
  [MessageType.SENT_GOLD_TO_PLAYER]: MessageCategory.TRADE,
  [MessageType.RECEIVED_GOLD_FROM_PLAYER]: MessageCategory.TRADE,
  [MessageType.RECEIVED_GOLD_FROM_TRADE]: MessageCategory.TRADE,
  [MessageType.SENT_TROOPS_TO_PLAYER]: MessageCategory.TRADE,
  [MessageType.RECEIVED_TROOPS_FROM_PLAYER]: MessageCategory.TRADE,
  [MessageType.CHAT]: MessageCategory.CHAT,
  [MessageType.POLICY_ENACTED]: MessageCategory.CHAT,
  [MessageType.POLICY_EXPIRED]: MessageCategory.CHAT,
  [MessageType.TECH_RESEARCHED]: MessageCategory.CHAT,
  [MessageType.RESEARCH_STARTED]: MessageCategory.CHAT,
  [MessageType.ENACT_POLICY]: MessageCategory.CHAT,
  [MessageType.START_RESEARCH]: MessageCategory.CHAT,
  [MessageType.MOVE_UNIT]: MessageCategory.CHAT,
  [MessageType.ATTACK]: MessageCategory.ATTACK,
  [MessageType.TRAIN_UNIT]: MessageCategory.CHAT,
  [MessageType.BUILD_CITY]: MessageCategory.CHAT,
  [MessageType.UPGRADE_CITY]: MessageCategory.CHAT,
  [MessageType.TRADE_RESOURCES]: MessageCategory.TRADE,
  [MessageType.DECLARE_WAR]: MessageCategory.ATTACK,
  [MessageType.SEND_DIPLOMATIC_MESSAGE]: MessageCategory.CHAT,
  [MessageType.GAME_ERROR]: MessageCategory.CHAT,
} as const;

/**
 * Get the category of a message type
 */
export function getMessageCategory(messageType: MessageType): MessageCategory {
  return MESSAGE_TYPE_CATEGORIES[messageType];
}

export interface NameViewData {
  x: number;
  y: number;
  size: number;
}

// 国策实施消息数据接口
export interface EnactPolicyMessageData {
  policyType: PolicyType;
}

// 科技研究消息数据接口
export interface StartResearchMessageData {
  techType: TechType;
}
