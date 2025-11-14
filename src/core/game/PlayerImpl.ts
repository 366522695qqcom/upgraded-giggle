import { renderNumber, renderTroops } from "../../client/Utils";
import { PseudoRandom } from "../PseudoRandom";
import { ClientID } from "../Schemas";
import {
  assertNever,
  distSortUnit,
  minInt,
  simpleHash,
  toInt,
  within,
} from "../Util";
import { sanitizeUsername } from "../validations/username";
import { AttackImpl } from "./AttackImpl";
import {
  Alliance,
  AllianceRequest,
  AllPlayers,
  Attack,
  BuildableUnit,
  Cell,
  ColoredTeams,
  Embargo,
  EmojiMessage,
  GameMode,
  Gold,
  Message,
  MessageType,
  MutableAlliance,
  Player,
  PlayerID,
  PlayerInfo,
  PlayerProfile,
  PlayerType,
  Policy,
  PolicyType,
  Relation,
  Team,
  Tech,
  TechType,
  TerraNullius,
  Tick,
  Unit,
  UnitParams,
  UnitType,
} from "./Game";
import { GameImpl } from "./GameImpl";
import { andFN, manhattanDistFN, TileRef } from "./GameMap";
import {
  AllianceView,
  AttackUpdate,
  GameUpdateType,
  PlayerUpdate,
} from "./GameUpdates";
import {
  PREDEFINED_POLICIES,
  PREDEFINED_TECHNOLOGIES,
} from "./PolicyTechExamples";
import { PolicyTechManager } from "./PolicyTechManager";
import { PolicyManager, TechTreeManager } from "./PolicyTechSystem";
import {
  bestShoreDeploymentSource,
  canBuildTransportShip,
} from "./TransportShipUtils";
import { UnitImpl } from "./UnitImpl";

interface Target {
  tick: Tick;
  target: Player;
}

class Donation {
  constructor(
    public readonly recipient: Player,
    public readonly tick: Tick,
  ) {}
}

export class PlayerImpl extends Player {
  public _lastTileChange: number = 0;
  public _pseudo_random: PseudoRandom;

  private _gold: bigint;
  private _troops: bigint;

  markedTraitorTick = -1;

  private embargoes = new Map<PlayerID, Embargo>();

  public _borderTiles: Set<TileRef> = new Set();

  public _units: Unit[] = [];
  public _tiles: Set<TileRef> = new Set();

  private _name: string;
  private _displayName: string;

  // 国策和科技树系统
  public policyManager: PolicyManager;
  public techTreeManager: TechTreeManager;

  // 额外的属性用于支持国策和科技效果
  public goldProductionRate: number = 0;
  public troopTrainingRate: number = 0;
  public unitCostReduction: number = 0;
  public unlockedUnits: Set<string> = new Set();

  public pastOutgoingAllianceRequests: AllianceRequest[] = [];
  private _expiredAlliances: Alliance[] = [];

  private targets_: Target[] = [];

  private outgoingEmojis_: EmojiMessage[] = [];

  private sentDonations: Donation[] = [];

  private relations = new Map<Player, number>();

  private lastDeleteUnitTick: Tick = -1;
  private lastEmbargoAllTick: Tick = -1;

  public _incomingAttacks: Attack[] = [];
  public _outgoingAttacks: Attack[] = [];
  public _outgoingLandAttacks: Attack[] = [];

  private _hasSpawned = false;
  private _isDisconnected = false;
  private _isTraitor = false;

  constructor(
    private mg: GameImpl,
    private _smallID: number,
    private readonly playerInfo: PlayerInfo,
    startTroops: number,
    private readonly _team: Team | null,
  ) {
    super();
    this._name = sanitizeUsername(playerInfo.name);
    this._troops = toInt(startTroops);
    this._gold = 0n;
    this._displayName = this._name;
    this._pseudo_random = new PseudoRandom(simpleHash(this.playerInfo.id));

    // 初始化国策和科技树系统
    this.policyManager = new PolicyManager(this);
    this.techTreeManager = new TechTreeManager(this, [
      ...PREDEFINED_TECHNOLOGIES,
    ]);
  }

  // 获取活跃的政策
  getActivePolicies(): Policy[] {
    return this.policyManager.getActivePolicies();
  }

  largestClusterBoundingBox: { min: Cell; max: Cell } | null;

  toUpdate(): PlayerUpdate {
    const outgoingAllianceRequests = this.outgoingAllianceRequests().map((ar) =>
      ar.recipient().id(),
    );
    const stats = this.mg.stats().getPlayerStats(this);

    return {
      type: GameUpdateType.Player,
      clientID: this.clientID(),
      name: this.name(),
      displayName: this.displayName(),
      id: this.id(),
      team: this.team() ?? undefined,
      smallID: this.smallID(),
      playerType: this.type(),
      isAlive: this.isAlive(),
      isDisconnected: this.isDisconnected(),
      tilesOwned: this.numTilesOwned(),
      gold: this._gold,
      troops: this.troops(),
      allies: this.alliances().map((a) => a.other(this).smallID()),
      embargoes: new Set([...this.embargoes.keys()].map((p) => p.toString())),
      isTraitor: this.isTraitor(),
      traitorRemainingTicks: this.getTraitorRemainingTicks(),
      targets: this.targets().map((p) => p.smallID()),
      outgoingEmojis: this.outgoingEmojis(),
      outgoingAttacks: this._outgoingAttacks.map((a) => {
        return {
          attackerID: a.attacker().smallID(),
          targetID: a.target().smallID(),
          troops: a.troops(),
          id: a.id(),
          retreating: a.retreating(),
        } satisfies AttackUpdate;
      }),
      incomingAttacks: this._incomingAttacks.map((a) => {
        return {
          attackerID: a.attacker().smallID(),
          targetID: a.target().smallID(),
          troops: a.troops(),
          id: a.id(),
          retreating: a.retreating(),
        } satisfies AttackUpdate;
      }),
      outgoingAllianceRequests: outgoingAllianceRequests,
      alliances: this.alliances().map(
        (a) =>
          ({
            id: a.id(),
            other: a.other(this).id(),
            createdAt: a.createdAt(),
            expiresAt: a.expiresAt(),
          }) satisfies AllianceView,
      ),
      hasSpawned: this.hasSpawned(),
      betrayals: stats?.betrayals,
      lastDeleteUnitTick: this.lastDeleteUnitTick,
    };
  }

  smallID(): number {
    return this._smallID;
  }

  name(): string {
    return this._name;
  }
  displayName(): string {
    return this._displayName;
  }

  clientID(): ClientID | null {
    return this.playerInfo.clientID;
  }

  id(): PlayerID {
    return this.playerInfo.id;
  }

  type(): PlayerType {
    return this.playerInfo.playerType;
  }

  clan(): string | null {
    return this.playerInfo.clan;
  }

  units(...types: UnitType[]): Unit[] {
    if (types.length === 0) {
      return this._units;
    }
    const ts = new Set(types);
    return this._units.filter((u) => ts.has(u.type()));
  }

  private numUnitsConstructed: Partial<Record<UnitType, number>> = {};
  private recordUnitConstructed(type: UnitType): void {
    if (this.numUnitsConstructed[type] !== undefined) {
      this.numUnitsConstructed[type]++;
    } else {
      this.numUnitsConstructed[type] = 1;
    }
  }

  // Count of units built by the player, including construction
  unitsConstructed(type: UnitType): number {
    const built = this.numUnitsConstructed[type] ?? 0;
    let constructing = 0;
    for (const unit of this._units) {
      if (unit.type() !== UnitType.Construction) continue;
      if (unit.constructionType() !== type) continue;
      constructing++;
    }
    const total = constructing + built;
    return total;
  }

  // Count of units owned by the player, not including construction
  unitCount(type: UnitType): number {
    let total = 0;
    for (const unit of this._units) {
      if (unit.type() === type) {
        total += unit.level();
      }
    }
    return total;
  }

  // Count of units owned by the player, including construction
  unitsOwned(type: UnitType): number {
    let total = 0;
    for (const unit of this._units) {
      if (unit.type() === type) {
        total += unit.level();
        continue;
      }
      if (unit.type() !== UnitType.Construction) continue;
      if (unit.constructionType() !== type) continue;
      total++;
    }
    return total;
  }

  sharesBorderWith(other: Player | TerraNullius): boolean {
    for (const border of this._borderTiles) {
      for (const neighbor of this.mg.map().neighbors(border)) {
        if (this.mg.map().ownerID(neighbor) === other.smallID()) {
          return true;
        }
      }
    }
    return false;
  }
  numTilesOwned(): number {
    return this._tiles.size;
  }

  tiles(): ReadonlySet<TileRef> {
    return new Set(this._tiles.values()) as Set<TileRef>;
  }

  borderTiles(): ReadonlySet<TileRef> {
    return this._borderTiles;
  }

  neighbors(): (Player | TerraNullius)[] {
    const ns: Set<Player | TerraNullius> = new Set();
    for (const border of this.borderTiles()) {
      for (const neighbor of this.mg.map().neighbors(border)) {
        if (this.mg.map().isLand(neighbor)) {
          const owner = this.mg.map().ownerID(neighbor);
          if (owner !== this.smallID()) {
            ns.add(
              this.mg.playerBySmallID(owner) satisfies Player | TerraNullius,
            );
          }
        }
      }
    }
    return Array.from(ns);
  }

  isPlayer(): this is Player {
    return true as const;
  }
  setTroops(troops: number) {
    this._troops = toInt(troops);
  }
  conquer(tile: TileRef) {
    this.mg.conquer(this, tile);
  }
  orderRetreat(id: string) {
    const attack = this._outgoingAttacks.filter((attack) => attack.id() === id);
    if (!attack || !attack[0]) {
      console.warn(`Didn't find outgoing attack with id ${id}`);
      return;
    }
    attack[0].orderRetreat();
  }
  executeRetreat(id: string): void {
    const attack = this._outgoingAttacks.filter((attack) => attack.id() === id);
    // Execution is delayed so it's not an error that the attack does not exist.
    if (!attack || !attack[0]) {
      return;
    }
    attack[0].executeRetreat();
  }
  relinquish(tile: TileRef) {
    if (this.mg.owner(tile) !== this) {
      throw new Error(`Cannot relinquish tile not owned by this player`);
    }
    this.mg.relinquish(tile);
  }
  info(): PlayerInfo {
    return this.playerInfo;
  }
  isAlive(): boolean {
    return this._tiles.size > 0;
  }

  hasSpawned(): boolean {
    return this._hasSpawned;
  }

  setHasSpawned(hasSpawned: boolean): void {
    this._hasSpawned = hasSpawned;
  }

  // 国策系统相关方法
  // 实施政策
  enactPolicy(policyType: PolicyType): boolean {
    const policy = PolicyTechManager.getPolicy(policyType);
    if (!policy) return false;

    const success = this.policyManager.implementPolicy(policy as any);
    if (success) {
      // 设置激活时间
      const policyObj = this.policyManager.getActivePolicy(policy.id);
      if (policyObj) {
        (policyObj as any).activationTick = this.mg.ticks();
      }
    }
    return success;
  }

  // 获取活跃的政策
  activePolicies(): Policy[] {
    return this.policyManager.getActivePolicies();
  }

  // 获取可用的政策
  availablePolicies(): Policy[] {
    // 这里应该根据玩家状态过滤可用的政策
    return PolicyTechManager.getAllPolicies().filter((policy) =>
      this.canImplementPolicy(policy.id),
    );
  }

  // 取消政策
  cancelPolicy(policyType: PolicyType): boolean {
    const policy = PolicyTechManager.getPolicy(policyType);
    if (!policy) return false;

    return this.policyManager.cancelPolicy(policy.id);
  }

  // 获取政策剩余持续时间
  policyRemainingDuration(policyType: PolicyType): number | null {
    const policy = PolicyTechManager.getPolicy(policyType);
    if (!policy) return null;

    const activePolicy = this.policyManager.getActivePolicy(policy.id);
    if (!activePolicy || !(activePolicy as any).activationTick) return null;

    const elapsedTicks = this.mg.ticks() - (activePolicy as any).activationTick;
    const remainingDuration = policy.duration - elapsedTicks;
    return remainingDuration > 0 ? remainingDuration : 0;
  }

  // 科技树系统相关方法
  startResearch(techType: TechType): boolean {
    return this.techTreeManager.startResearch(techType);
  }

  // 获取已研究的科技
  researchedTechs(): Tech[] {
    return this.getResearchedTechnologies();
  }

  // 获取当前正在研究的科技
  currentResearch(): {
    tech: Tech;
    progress: number;
    remainingTime: number;
  } | null {
    const currentTech = this.getCurrentResearch();
    if (!currentTech) return null;

    const progress = this.getTechResearchProgress(currentTech.id);
    const researchSpeed = 1; // 可以根据政策和科技效果调整
    const remainingTime = Math.ceil((100 - progress) / researchSpeed);

    return {
      tech: currentTech,
      progress,
      remainingTime,
    };
  }

  // 获取可用的科技
  availableTechs(): Tech[] {
    // 这里应该根据玩家已研究的科技过滤可用的科技
    return PolicyTechManager.getAllTechnologies().filter((tech) =>
      this.canResearchTech(tech.id),
    );
  }

  // 检查是否可以研究科技
  canResearchTech(techId: string): boolean {
    const tech = this.techTreeManager.getTechnology(techId);
    if (!tech) return false;

    // 检查是否已经研究过
    if (this.isTechResearched(techId)) return false;

    // 检查是否正在研究
    if (this.getCurrentResearch()?.id === techId) return false;

    // 检查前置科技
    if (tech.prerequisites) {
      for (const prereq of tech.prerequisites) {
        if (!this.isTechResearched(prereq)) {
          return false;
        }
      }
    }

    // 检查资金
    return this.gold() >= tech.researchCost;
  }

  // 获取已研究的科技
  getResearchedTechnologies(): Tech[] {
    return this.techTreeManager.getResearchedTechnologies();
  }

  getCurrentResearch(): Tech | null {
    return this.techTreeManager.getCurrentResearch();
  }

  // 检查科技是否已研究
  isTechResearched(techId: string): boolean {
    return this.techTreeManager.isTechResearched(techId);
  }

  getAllTechnologies() {
    return this.techTreeManager.getAllTechnologies();
  }

  // 更新国策和科技系统
  updatePolicyAndTech(): void {
    // 更新国策和科技管理器
    this.policyManager.update();
    this.techTreeManager.update();

    // 获取活跃政策和已研究科技
    const activePolicies = new Set();
    this.policyManager.getActivePolicies().forEach((policy) => {
      if ("type" in policy) {
        activePolicies.add(policy.type);
      }
    });

    const researchedTechs = new Set();
    this.techTreeManager.getResearchedTechnologies().forEach((tech) => {
      if ("type" in tech) {
        researchedTechs.add(tech.type);
      }
    });

    // 使用PolicyTechManager计算各种加成效果
    const goldProductionMultiplier =
      PolicyTechManager.calculateGoldProductionMultiplier(
        researchedTechs,
        activePolicies,
      );
    const troopTrainingMultiplier =
      PolicyTechManager.calculateTroopTrainingMultiplier(
        researchedTechs,
        activePolicies,
      );
    const unitCostReduction = PolicyTechManager.calculateUnitCostReduction(
      researchedTechs,
      activePolicies,
    );
    const attackBonus = PolicyTechManager.calculateAttackBonus(
      researchedTechs,
      activePolicies,
    );
    const defenseBonus = PolicyTechManager.calculateDefenseBonus(
      researchedTechs,
      activePolicies,
    );

    // 更新加成属性
    // 转换为百分比表示
    this.goldProductionRate = (goldProductionMultiplier - 1) * 100;
    this.troopTrainingRate = (troopTrainingMultiplier - 1) * 100;
    this.unitCostReduction = unitCostReduction * 100; // 转换为百分比
    this.attackBonus = attackBonus * 100;
    this.defenseBonus = defenseBonus * 100;

    // 更新解锁的单位
    this.unlockedUnits = new Set(
      PolicyTechManager.getUnlockedUnits(researchedTechs),
    );

    // 确保加成不会出现负值
    this.unitCostReduction = Math.max(0, this.unitCostReduction);
  }

  incomingAllianceRequests(): AllianceRequest[] {
    return this.mg.allianceRequests.filter((ar) => ar.recipient() === this);
  }

  outgoingAllianceRequests(): AllianceRequest[] {
    return this.mg.allianceRequests.filter((ar) => ar.requestor() === this);
  }

  alliances(): MutableAlliance[] {
    return this.mg.alliances_.filter(
      (a) => a.requestor() === this || a.recipient() === this,
    );
  }

  expiredAlliances(): Alliance[] {
    return [...this._expiredAlliances];
  }

  allies(): Player[] {
    return this.alliances().map((a) => a.other(this));
  }

  isAlliedWith(other: Player): boolean {
    if (other === this) {
      return false;
    }
    return this.allianceWith(other) !== null;
  }

  allianceWith(other: Player): MutableAlliance | null {
    if (other === this) {
      return null;
    }
    return (
      this.alliances().find(
        (a) => a.recipient() === other || a.requestor() === other,
      ) ?? null
    );
  }

  canSendAllianceRequest(other: Player): boolean {
    if (other === this) {
      return false;
    }
    if (this.isDisconnected() || other.isDisconnected()) {
      // Disconnected players are marked as not-friendly even if they are allies,
      // so we need to return early if either player is disconnected.
      // Otherise we could end up sending an alliance request to someone
      // we are already allied with.
      return false;
    }
    if (this.isFriendly(other) || !this.isAlive()) {
      return false;
    }

    const hasPending = this.outgoingAllianceRequests().some(
      (ar) => ar.recipient() === other,
    );

    if (hasPending) {
      return false;
    }

    const recent = this.pastOutgoingAllianceRequests
      .filter((ar) => ar.recipient() === other)
      .sort((a, b) => b.createdAt() - a.createdAt());

    if (recent.length === 0) {
      return true;
    }

    const delta = this.mg.ticks() - recent[0].createdAt();

    return delta >= this.mg.config().allianceRequestCooldown();
  }

  breakAlliance(alliance: Alliance): void {
    this.mg.breakAlliance(this, alliance);
  }

  isTraitor(): boolean {
    return this.getTraitorRemainingTicks() > 0;
  }

  getTraitorRemainingTicks(): number {
    if (this.markedTraitorTick < 0) return 0;
    const elapsed = this.mg.ticks() - this.markedTraitorTick;
    const duration = this.mg.config().traitorDuration();
    const remaining = duration - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  markTraitor(): void {
    this.markedTraitorTick = this.mg.ticks();

    // Record stats
    this.mg.stats().betray(this);
  }

  createAllianceRequest(recipient: Player): AllianceRequest | null {
    if (this.isAlliedWith(recipient)) {
      throw new Error(`cannot create alliance request, already allies`);
    }
    return this.mg.createAllianceRequest(this, recipient satisfies Player);
  }

  relation(other: Player): Relation {
    if (other === this) {
      throw new Error(`cannot get relation with self: ${this}`);
    }
    const relation = this.relations.get(other) ?? 0;
    return this.relationFromValue(relation);
  }

  private relationFromValue(relationValue: number): Relation {
    if (relationValue < -50) {
      return Relation.Hostile;
    }
    if (relationValue < 0) {
      return Relation.Distrustful;
    }
    if (relationValue < 50) {
      return Relation.Neutral;
    }
    return Relation.Friendly;
  }

  allRelationsSorted(): { player: Player; relation: Relation }[] {
    return Array.from(this.relations, ([k, v]) => ({ player: k, relation: v }))
      .sort((a, b) => a.relation - b.relation)
      .map((r) => ({
        player: r.player,
        relation: this.relationFromValue(r.relation),
      }));
  }

  updateRelation(other: Player, delta: number): void {
    if (other === this) {
      throw new Error(`cannot update relation with self: ${this}`);
    }
    const relation = this.relations.get(other) ?? 0;
    const newRelation = within(relation + delta, -100, 100);
    this.relations.set(other, newRelation);
  }

  decayRelations() {
    this.relations.forEach((r: number, p: Player) => {
      const sign = -1 * Math.sign(r);
      const delta = 0.05;
      r += sign * delta;
      if (Math.abs(r) < delta * 2) {
        r = 0;
      }
      this.relations.set(p, r);
    });
  }

  canTarget(other: Player): boolean {
    if (this === other) {
      return false;
    }
    if (this.isFriendly(other)) {
      return false;
    }
    for (const t of this.targets_) {
      if (this.mg.ticks() - t.tick < this.mg.config().targetCooldown()) {
        return false;
      }
    }
    return true;
  }

  target(other: Player): void {
    this.targets_.push({ tick: this.mg.ticks(), target: other });
    this.mg.target(this, other);
  }

  targets(): Player[] {
    return this.targets_
      .filter(
        (t) => this.mg.ticks() - t.tick < this.mg.config().targetDuration(),
      )
      .map((t) => t.target);
  }

  transitiveTargets(): Player[] {
    const ts = this.alliances()
      .map((a) => a.other(this))
      .flatMap((ally) => ally.targets());
    ts.push(...this.targets());
    return [...new Set(ts)] satisfies Player[];
  }

  sendEmoji(recipient: Player | typeof AllPlayers, emoji: string): void {
    if (recipient === this) {
      throw Error(`Cannot send emoji to oneself: ${this}`);
    }
    const msg: EmojiMessage = {
      message: emoji,
      senderID: this.smallID(),
      recipientID: recipient === AllPlayers ? recipient : recipient.smallID(),
      createdAt: this.mg.ticks(),
    };
    this.outgoingEmojis_.push(msg);
    this.mg.sendEmojiUpdate(msg);
  }

  outgoingEmojis(): EmojiMessage[] {
    return this.outgoingEmojis_
      .filter(
        (e) =>
          this.mg.ticks() - e.createdAt <
          this.mg.config().emojiMessageDuration(),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  canSendEmoji(recipient: Player | typeof AllPlayers): boolean {
    if (recipient === this) {
      return false;
    }
    const recipientID =
      recipient === AllPlayers ? AllPlayers : recipient.smallID();
    const prevMsgs = this.outgoingEmojis_.filter(
      (msg) => msg.recipientID === recipientID,
    );
    for (const msg of prevMsgs) {
      if (
        this.mg.ticks() - msg.createdAt <
        this.mg.config().emojiMessageCooldown()
      ) {
        return false;
      }
    }
    return true;
  }

  canDonateGold(recipient: Player): boolean {
    if (
      !this.isAlive() ||
      !recipient.isAlive() ||
      !this.isFriendly(recipient)
    ) {
      return false;
    }
    if (
      recipient.type() === PlayerType.Human &&
      this.mg.config().donateGold() === false
    ) {
      return false;
    }
    for (const donation of this.sentDonations) {
      if (donation.recipient === recipient) {
        if (
          this.mg.ticks() - donation.tick <
          this.mg.config().donateCooldown()
        ) {
          return false;
        }
      }
    }
    return true;
  }

  canDonateTroops(recipient: Player): boolean {
    if (
      !this.isAlive() ||
      !recipient.isAlive() ||
      !this.isFriendly(recipient)
    ) {
      return false;
    }
    if (
      recipient.type() === PlayerType.Human &&
      this.mg.config().donateTroops() === false
    ) {
      return false;
    }
    for (const donation of this.sentDonations) {
      if (donation.recipient === recipient) {
        if (
          this.mg.ticks() - donation.tick <
          this.mg.config().donateCooldown()
        ) {
          return false;
        }
      }
    }
    return true;
  }

  donateTroops(recipient: Player, troops: number): boolean {
    if (troops <= 0) return false;
    const removed = this.removeTroops(troops);
    if (removed === 0) return false;
    recipient.addTroops(removed);

    this.sentDonations.push(new Donation(recipient, this.mg.ticks()));
    this.mg.displayMessage(
      `Sent ${renderTroops(troops)} troops to ${recipient.name()}`,
      MessageType.SENT_TROOPS_TO_PLAYER,
      this.id(),
    );
    this.mg.displayMessage(
      `Received ${renderTroops(troops)} troops from ${this.name()}`,
      MessageType.RECEIVED_TROOPS_FROM_PLAYER,
      recipient.id(),
    );
    return true;
  }

  donateGold(recipient: Player, gold: Gold): boolean {
    if (gold <= 0n) return false;
    const removed = this.removeGold(gold);
    if (removed === 0n) return false;
    recipient.addGold(removed);

    this.sentDonations.push(new Donation(recipient, this.mg.ticks()));
    this.mg.displayMessage(
      `Sent ${renderNumber(gold)} gold to ${recipient.name()}`,
      MessageType.SENT_GOLD_TO_PLAYER,
      this.id(),
    );
    this.mg.displayMessage(
      `Received ${renderNumber(gold)} gold from ${this.name()}`,
      MessageType.RECEIVED_GOLD_FROM_PLAYER,
      recipient.id(),
      gold,
    );
    return true;
  }

  canDeleteUnit(): boolean {
    return (
      this.mg.ticks() - this.lastDeleteUnitTick >=
      this.mg.config().deleteUnitCooldown()
    );
  }

  recordDeleteUnit(): void {
    this.lastDeleteUnitTick = this.mg.ticks();
  }

  canEmbargoAll(): boolean {
    // Cooldown gate
    if (
      this.mg.ticks() - this.lastEmbargoAllTick <
      this.mg.config().embargoAllCooldown()
    ) {
      return false;
    }
    // At least one eligible player exists
    for (const p of this.mg.players()) {
      if (p.id() === this.id()) continue;
      if (p.type() === PlayerType.Bot) continue;
      if (this.isOnSameTeam(p)) continue;
      return true;
    }
    return false;
  }

  recordEmbargoAll(): void {
    this.lastEmbargoAllTick = this.mg.ticks();
  }

  hasEmbargoAgainst(other: Player): boolean {
    return this.embargoes.has(other.id());
  }

  canTrade(other: Player): boolean {
    const embargo =
      other.hasEmbargoAgainst(this) || this.hasEmbargoAgainst(other);
    return !embargo && other.id() !== this.id();
  }

  getEmbargoes(): Embargo[] {
    return [...this.embargoes.values()];
  }

  addEmbargo(other: Player, isTemporary: boolean): void {
    const embargo = this.embargoes.get(other.id());
    if (embargo !== undefined && !embargo.isTemporary) return;

    this.mg.addUpdate({
      type: GameUpdateType.EmbargoEvent,
      event: "start",
      playerID: this.smallID(),
      embargoedID: other.smallID(),
    });

    this.embargoes.set(other.id(), {
      createdAt: this.mg.ticks(),
      isTemporary: isTemporary,
      target: other.id(),
    });
  }

  stopEmbargo(other: Player): void {
    this.embargoes.delete(other.id());
    this.mg.addUpdate({
      type: GameUpdateType.EmbargoEvent,
      event: "stop",
      playerID: this.smallID(),
      embargoedID: other.smallID(),
    });
  }

  endTemporaryEmbargo(other: Player): void {
    const embargo = this.embargoes.get(other.id());
    if (embargo !== undefined && !embargo.isTemporary) return;

    this.stopEmbargo(other);
  }

  tradingPartners(): Player[] {
    return this.mg
      .players()
      .filter((other) => other !== this && this.canTrade(other));
  }

  team(): Team | null {
    return this._team;
  }

  isOnSameTeam(other: Player): boolean {
    if (other === this) {
      return false;
    }
    if (this.team() === null || other.team() === null) {
      return false;
    }
    if (this.team() === ColoredTeams.Bot || other.team() === ColoredTeams.Bot) {
      return false;
    }
    return this._team === other.team();
  }

  isFriendly(other: Player): boolean {
    if (other.isDisconnected()) {
      return false;
    }

    // In FFA mode, allow alliances between any players
    // Only check team relationship in Team mode
    if (this.mg.config().gameConfig().gameMode === GameMode.Team) {
      return this.isOnSameTeam(other) || this.isAlliedWith(other);
    }

    // In FFA mode, only existing alliances make players friendly
    return this.isAlliedWith(other);
  }

  gold(): Gold {
    return this._gold;
  }

  setGold(gold: Gold): void {
    this._gold = gold;
  }

  /**
   * 获取有效的金币生产速率（基于国策和科技效果）
   */
  getEffectiveGoldProductionRate(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateGoldProductionMultiplier(
      researchedTechs,
      activePolicies,
    );
  }

  /**
   * 获取有效的军队训练速率（基于国策和科技效果）
   */
  getEffectiveTroopTrainingRate(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateTroopTrainingMultiplier(
      researchedTechs,
      activePolicies,
    );
  }

  /**
   * 获取单位成本降低百分比
   */
  getUnitCostReduction(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateUnitCostReduction(
      researchedTechs,
      activePolicies,
    );
  }

  /**
   * 获取已解锁的单位列表
   */
  getUnlockedUnits(): UnitType[] {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    return PolicyTechManager.getUnlockedUnits(researchedTechs);
  }

  /**
   * 获取防御加成百分比
   */
  getDefenseBonus(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateDefenseBonus(
      researchedTechs,
      activePolicies,
    );
  }

  /**
   * 获取攻击加成百分比
   */
  getAttackBonus(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateAttackBonus(
      researchedTechs,
      activePolicies,
    );
  }

  /**
   * 获取外交加成百分比
   */
  getDiplomacyBonus(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );
    return PolicyTechManager.calculateDiplomacyBonus(
      researchedTechs,
      activePolicies,
    );
  }

  // === 基础状态和方法 ===
  isAlive(): boolean {
    return !this._isDead;
  }

  isTraitor(): boolean {
    return this._isTraitor;
  }

  markTraitor(): void {
    this._isTraitor = true;
  }

  isDisconnected(): boolean {
    return this._isDisconnected;
  }

  markDisconnected(isDisconnected: boolean): void {
    this._isDisconnected = isDisconnected;
  }

  hasSpawned(): boolean {
    return this._hasSpawned;
  }

  setHasSpawned(hasSpawned: boolean): void {
    this._hasSpawned = hasSpawned;
  }

  largestClusterBoundingBox(): { min: Cell; max: Cell } | null {
    // 简化实现 - 返回所有瓦片的边界框
    const tiles = Array.from(this._tiles);
    if (tiles.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const tileRef of tiles) {
      const cell = tileRef.toCell(this.mg);
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x);
      maxY = Math.max(maxY, cell.y);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    };
  }

  lastTileChange(): Tick {
    return this._lastTileChange;
  }

  borderTiles(): ReadonlySet<TileRef> {
    const borderTiles = new Set<TileRef>();

    for (const tileRef of this._tiles) {
      const neighbors = this.mg.map().neighbors(tileRef);
      for (const neighbor of neighbors) {
        const owner = this.mg.owner(neighbor);
        if (owner !== this) {
          borderTiles.add(tileRef);
          break;
        }
      }
    }

    return borderTiles;
  }

  // === 科技和研究相关方法 ===
  availableTechs(): Tech[] {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    return PREDEFINED_TECHNOLOGIES.filter((tech) =>
      PolicyTechManager.canResearchTech(tech.id, researchedTechs),
    );
  }

  startResearch(techType: TechType): boolean {
    const tech = PREDEFINED_TECHNOLOGIES.find((t) => t.id === techType);
    if (!tech) return false;

    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    if (!PolicyTechManager.canResearchTech(techType, researchedTechs)) {
      return false;
    }

    // 检查是否已经在研究
    const currentTech = this.currentResearchingTech();
    if (currentTech && currentTech.tech.id === techType) {
      return false;
    }

    // 开始研究
    this.techTreeManager.startResearch(techType);
    return true;
  }

  cancelResearch(): boolean {
    const currentTech = this.currentResearchingTech();
    if (!currentTech) return false;

    this.techTreeManager.cancelResearch();
    return true;
  }

  researchProgress(techType: TechType): number | null {
    return this.techTreeManager.getTechResearchProgress(techType);
  }

  private currentResearchingTech(): {
    tech: Tech;
    progress: number;
    remainingTime: number;
  } | null {
    const researchingTech = this.techTreeManager.getResearchingTech();
    if (!researchingTech) return null;

    const progress = this.techTreeManager.getTechResearchProgress(
      researchingTech.id,
    );
    const progressRatio = Math.max(0, Math.min(1, progress / 100));
    const remainingTime = Math.ceil(
      researchingTech.researchTime * (1 - progressRatio),
    );

    return {
      tech: researchingTech,
      progress: progress,
      remainingTime: remainingTime,
    };
  }

  currentResearch(): {
    tech: Tech;
    progress: number;
    remainingTime: number;
  } | null {
    return this.currentResearchingTech();
  }

  /**
   * 获取已解锁的政策列表
   */
  getUnlockedPolicies(): PolicyType[] {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    return PolicyTechManager.getUnlockedPolicies(researchedTechs);
  }

  /**
   * 获取研究速度加成
   */
  getResearchSpeedMultiplier(): number {
    const researchedTechs = this.techTreeManager.getResearchedTechnologies();
    const activePolicies = new Set(
      this.policyManager.getActivePolicies().map((p) => p.id),
    );

    let multiplier = 1.0;

    // 科技加成
    researchedTechs.forEach((techType) => {
      const tech = PREDEFINED_TECHNOLOGIES.find((t) => t.id === techType);
      if (tech && tech.researchSpeedMultiplier) {
        multiplier *= tech.researchSpeedMultiplier;
      }
    });

    // 政策加成
    activePolicies.forEach((policyType) => {
      const policy = PREDEFINED_POLICIES.find((p) => p.id === policyType);
      if (policy && policy.researchSpeedMultiplier) {
        multiplier *= policy.researchSpeedMultiplier;
      }
    });

    return multiplier;
  }

  // 辅助方法：检查是否可以实施政策
  private canImplementPolicy(policyId: string): boolean {
    const policy = PolicyTechManager.getPolicy(policyId);
    if (!policy) return false;

    // 检查是否已经激活
    const activePolicies = this.policyManager.getActivePolicies();
    if (activePolicies.some((p) => p.id === policyId)) return false;

    // 检查前置条件
    if (policy.prerequisites) {
      for (const prereq of policy.prerequisites) {
        if (!this.isTechResearched(prereq)) {
          return false;
        }
      }
    }

    // 检查资金
    return this.gold() >= policy.cost;
  }

  addGold(toAdd: Gold, tile?: TileRef): void {
    // 确保转换为bigint类型
    const goldToAdd =
      typeof toAdd === "number" ? BigInt(Math.floor(toAdd)) : toAdd;
    this._gold += goldToAdd;
    if (tile) {
      this.mg.addUpdate({
        type: GameUpdateType.BonusEvent,
        player: this.id(),
        tile,
        gold: Number(goldToAdd),
        troops: 0,
      });
    }
  }

  removeGold(toRemove: Gold): Gold {
    if (toRemove <= 0n) {
      return 0n;
    }
    const actualRemoved = minInt(this._gold, toRemove);
    this._gold -= actualRemoved;
    return actualRemoved;
  }

  troops(): number {
    return Number(this._troops);
  }

  addTroops(troops: number): void {
    if (troops < 0) {
      this.removeTroops(-1 * troops);
      return;
    }
    this._troops += toInt(troops);
  }
  removeTroops(troops: number): number {
    if (troops <= 0) {
      return 0;
    }
    const toRemove = minInt(this._troops, toInt(troops));
    this._troops -= toRemove;
    return Number(toRemove);
  }

  captureUnit(unit: Unit): void {
    if (unit.owner() === this) {
      throw new Error(`Cannot capture unit, ${this} already owns ${unit}`);
    }
    unit.setOwner(this);
  }

  buildUnit<T extends UnitType>(
    type: T,
    spawnTile: TileRef,
    params: UnitParams<T>,
  ): Unit {
    if (this.mg.config().isUnitDisabled(type)) {
      throw new Error(
        `Attempted to build disabled unit ${type} at tile ${spawnTile} by player ${this.name()}`,
      );
    }

    // 计算原始成本并应用成本降低效果
    const cost = this.mg.unitInfo(type).cost(this);
    const reducedCost = Math.max(
      1,
      Math.floor(cost * (1 - this.unitCostReduction)),
    );

    const b = new UnitImpl(
      type,
      this.mg,
      spawnTile,
      this.mg.nextUnitID(),
      this,
      params,
    );
    this._units.push(b);
    this.recordUnitConstructed(type);
    this.removeGold(reducedCost);
    this.removeTroops("troops" in params ? (params.troops ?? 0) : 0);
    this.mg.addUpdate(b.toUpdate());
    this.mg.addUnit(b);

    return b;
  }

  public findUnitToUpgrade(type: UnitType, targetTile: TileRef): Unit | false {
    const range = this.mg.config().structureMinDist();
    const existing = this.mg
      .nearbyUnits(targetTile, range, type)
      .sort((a, b) => a.distSquared - b.distSquared);
    if (existing.length === 0) {
      return false;
    }
    const unit = existing[0].unit;
    if (!this.canUpgradeUnit(unit)) {
      return false;
    }
    return unit;
  }

  public canUpgradeUnit(unit: Unit): boolean {
    if (unit.isMarkedForDeletion()) {
      return false;
    }
    if (!this.mg.config().unitInfo(unit.type()).upgradable) {
      return false;
    }
    if (this.mg.config().isUnitDisabled(unit.type())) {
      return false;
    }
    // 计算考虑成本降低效果后的价格
    const cost = this.mg.config().unitInfo(unit.type()).cost(this);
    const reducedCost = Math.max(
      1,
      Math.floor(cost * (1 - this.unitCostReduction)),
    );
    if (this._gold < reducedCost) {
      return false;
    }
    return true;
  }

  upgradeUnit(unit: Unit) {
    const cost = this.mg.unitInfo(unit.type()).cost(this);
    this.removeGold(cost);
    unit.increaseLevel();
    this.recordUnitConstructed(unit.type());
  }

  public buildableUnits(tile: TileRef | null): BuildableUnit[] {
    const validTiles = tile !== null ? this.validStructureSpawnTiles(tile) : [];

    // 获取所有单位类型，然后根据unlockedUnits过滤
    let unitTypes = Object.values(UnitType);
    if (this.unlockedUnits !== null) {
      unitTypes = unitTypes.filter((u) => this.unlockedUnits!.has(u));
    }

    return unitTypes.map((u) => {
      let canUpgrade: number | false = false;
      if (!this.mg.inSpawnPhase()) {
        const existingUnit = tile !== null && this.findUnitToUpgrade(u, tile);
        if (existingUnit !== false) {
          canUpgrade = existingUnit.id();
        }
      }

      // 计算考虑成本降低效果后的价格
      const baseCost = this.mg.config().unitInfo(u).cost(this);
      const reducedCost = Math.max(
        1,
        Math.floor(baseCost * (1 - this.unitCostReduction)),
      );

      return {
        type: u,
        canBuild:
          this.mg.inSpawnPhase() || tile === null
            ? false
            : this.canBuild(u, tile, validTiles),
        canUpgrade: canUpgrade,
        cost: reducedCost,
      } as BuildableUnit;
    });
  }

  canBuild(
    unitType: UnitType,
    targetTile: TileRef,
    validTiles: TileRef[] | null = null,
  ): TileRef | false {
    if (this.mg.config().isUnitDisabled(unitType)) {
      return false;
    }

    const cost = this.mg.unitInfo(unitType).cost(this);
    if (!this.isAlive() || this.gold() < cost) {
      return false;
    }
    switch (unitType) {
      case UnitType.MIRV:
        if (!this.mg.hasOwner(targetTile)) {
          return false;
        }
        return this.nukeSpawn(targetTile);
      case UnitType.AtomBomb:
      case UnitType.HydrogenBomb:
        return this.nukeSpawn(targetTile);
      case UnitType.MIRVWarhead:
        return targetTile;
      case UnitType.Port:
        return this.portSpawn(targetTile, validTiles);
      case UnitType.Warship:
        return this.warshipSpawn(targetTile);
      case UnitType.Shell:
      case UnitType.SAMMissile:
        return targetTile;
      case UnitType.TransportShip:
        return canBuildTransportShip(this.mg, this, targetTile);
      case UnitType.TradeShip:
        return this.tradeShipSpawn(targetTile);
      case UnitType.Train:
        return this.landBasedUnitSpawn(targetTile);
      case UnitType.MissileSilo:
      case UnitType.DefensePost:
      case UnitType.SAMLauncher:
      case UnitType.City:
      case UnitType.Factory:
      case UnitType.Construction:
        return this.landBasedStructureSpawn(targetTile, validTiles);
      default:
        assertNever(unitType);
    }
  }

  nukeSpawn(tile: TileRef): TileRef | false {
    const owner = this.mg.owner(tile);
    if (owner.isPlayer()) {
      if (this.isOnSameTeam(owner)) {
        return false;
      }
    }
    // only get missilesilos that are not on cooldown
    const spawns = this.units(UnitType.MissileSilo)
      .filter((silo) => {
        return !silo.isInCooldown();
      })
      .sort(distSortUnit(this.mg, tile));
    if (spawns.length === 0) {
      return false;
    }
    return spawns[0].tile();
  }

  portSpawn(tile: TileRef, validTiles: TileRef[] | null): TileRef | false {
    const spawns = Array.from(
      this.mg.bfs(
        tile,
        manhattanDistFN(tile, this.mg.config().radiusPortSpawn()),
      ),
    )
      .filter((t) => this.mg.owner(t) === this && this.mg.isOceanShore(t))
      .sort(
        (a, b) =>
          this.mg.manhattanDist(a, tile) - this.mg.manhattanDist(b, tile),
      );
    const validTileSet = new Set(
      validTiles ?? this.validStructureSpawnTiles(tile),
    );
    for (const t of spawns) {
      if (validTileSet.has(t)) {
        return t;
      }
    }
    return false;
  }

  warshipSpawn(tile: TileRef): TileRef | false {
    if (!this.mg.isOcean(tile)) {
      return false;
    }
    const spawns = this.units(UnitType.Port).sort(
      (a, b) =>
        this.mg.manhattanDist(a.tile(), tile) -
        this.mg.manhattanDist(b.tile(), tile),
    );
    if (spawns.length === 0) {
      return false;
    }
    return spawns[0].tile();
  }

  landBasedUnitSpawn(tile: TileRef): TileRef | false {
    return this.mg.isLand(tile) ? tile : false;
  }

  landBasedStructureSpawn(
    tile: TileRef,
    validTiles: TileRef[] | null = null,
  ): TileRef | false {
    const tiles = validTiles ?? this.validStructureSpawnTiles(tile);
    if (tiles.length === 0) {
      return false;
    }
    return tiles[0];
  }

  private validStructureSpawnTiles(tile: TileRef): TileRef[] {
    if (this.mg.owner(tile) !== this) {
      return [];
    }
    const searchRadius = 15;
    const searchRadiusSquared = searchRadius ** 2;
    const types = Object.values(UnitType).filter((unitTypeValue) => {
      return this.mg.config().unitInfo(unitTypeValue).territoryBound;
    });

    const nearbyUnits = this.mg.nearbyUnits(tile, searchRadius * 2, types);
    const nearbyTiles = this.mg.bfs(tile, (gm, t) => {
      return (
        this.mg.euclideanDistSquared(tile, t) < searchRadiusSquared &&
        gm.ownerID(t) === this.smallID()
      );
    });
    const validSet: Set<TileRef> = new Set(nearbyTiles);

    const minDistSquared = this.mg.config().structureMinDist() ** 2;
    for (const t of nearbyTiles) {
      for (const { unit } of nearbyUnits) {
        if (this.mg.euclideanDistSquared(unit.tile(), t) < minDistSquared) {
          validSet.delete(t);
          break;
        }
      }
    }
    const valid = Array.from(validSet);
    valid.sort(
      (a, b) =>
        this.mg.euclideanDistSquared(a, tile) -
        this.mg.euclideanDistSquared(b, tile),
    );
    return valid;
  }

  tradeShipSpawn(targetTile: TileRef): TileRef | false {
    const spawns = this.units(UnitType.Port).filter(
      (u) => u.tile() === targetTile,
    );
    if (spawns.length === 0) {
      return false;
    }
    return spawns[0].tile();
  }
  lastTileChange(): Tick {
    return this._lastTileChange;
  }

  isDisconnected(): boolean {
    return this._isDisconnected;
  }

  markDisconnected(isDisconnected: boolean): void {
    this._isDisconnected = isDisconnected;
  }

  hash(): number {
    return (
      simpleHash(this.id()) * (this.troops() + this.numTilesOwned()) +
      this._units.reduce((acc, unit) => acc + unit.hash(), 0)
    );
  }
  toString(): string {
    return `Player:{name:${this.info().name},clientID:${
      this.info().clientID
    },isAlive:${this.isAlive()},troops:${
      this._troops
    },numTileOwned:${this.numTilesOwned()}}]`;
  }

  // 发送消息给玩家
  sendMessage(message: Message): void {
    // 将消息添加到更新中，以便发送给客户端
    this.mg.addUpdate({
      type: GameUpdateType.DisplayEvent,
      messageType: message.type,
      message: JSON.stringify(message.data),
      playerID: this.smallID(),
      params: message.data,
    });
  }

  public playerProfile(): PlayerProfile {
    const rel = {
      relations: Object.fromEntries(
        this.allRelationsSorted().map(({ player, relation }) => [
          player.smallID(),
          relation,
        ]),
      ),
      alliances: this.alliances().map((a) => a.other(this).smallID()),
    };
    return rel;
  }

  createAttack(
    target: Player | TerraNullius,
    troops: number,
    sourceTile: TileRef | null,
    border: Set<number>,
  ): Attack {
    const attack = new AttackImpl(
      this._pseudo_random.nextID(),
      target,
      this,
      troops,
      sourceTile,
      border,
      this.mg,
    );
    this._outgoingAttacks.push(attack);
    if (target.isPlayer()) {
      (target as PlayerImpl)._incomingAttacks.push(attack);
    }
    return attack;
  }
  outgoingAttacks(): Attack[] {
    return this._outgoingAttacks;
  }
  incomingAttacks(): Attack[] {
    return this._incomingAttacks;
  }

  public canAttack(tile: TileRef): boolean {
    if (
      this.mg.hasOwner(tile) &&
      this.mg.config().numSpawnPhaseTurns() +
        this.mg.config().spawnImmunityDuration() >
        this.mg.ticks()
    ) {
      return false;
    }

    if (this.mg.owner(tile) === this) {
      return false;
    }
    const other = this.mg.owner(tile);
    if (other.isPlayer()) {
      if (this.isFriendly(other)) {
        return false;
      }
    }

    if (!this.mg.isLand(tile)) {
      return false;
    }
    if (this.mg.hasOwner(tile)) {
      return this.sharesBorderWith(other);
    } else {
      for (const t of this.mg.bfs(
        tile,
        andFN(
          (gm, t) => !gm.hasOwner(t) && gm.isLand(t),
          manhattanDistFN(tile, 200),
        ),
      )) {
        for (const n of this.mg.neighbors(t)) {
          if (this.mg.owner(n) === this) {
            return true;
          }
        }
      }
      return false;
    }
  }

  bestTransportShipSpawn(targetTile: TileRef): TileRef | false {
    return bestShoreDeploymentSource(this.mg, this, targetTile);
  }

  // ==================== 外交和联盟相关方法 ====================

  neighbors(): (Player | TerraNullius)[] {
    return this.mg.players().filter((p) => this.sharesBorderWith(p));
  }

  sharesBorderWith(other: Player | TerraNullius): boolean {
    if (other.isPlayer()) {
      for (const tile of this._borderTiles) {
        for (const neighbor of this.mg.neighbors(tile)) {
          if (this.mg.owner(neighbor) === other) {
            return true;
          }
        }
      }
    }
    return false;
  }

  relation(other: Player): Relation {
    if (other === this) return 100;
    return this.relations.get(other) ?? 50;
  }

  allRelationsSorted(): { player: Player; relation: Relation }[] {
    const result: { player: Player; relation: Relation }[] = [];
    for (const player of this.mg.players()) {
      if (player !== this) {
        result.push({
          player,
          relation: this.relation(player),
        });
      }
    }
    return result.sort((a, b) => b.relation - a.relation);
  }

  updateRelation(other: Player, delta: number): void {
    const current = this.relation(other);
    const newRelation = Math.max(0, Math.min(100, current + delta));
    this.relations.set(other, newRelation);
  }

  decayRelations(): void {
    for (const [player, relation] of this.relations.entries()) {
      if (relation > 50) {
        this.relations.set(player, Math.max(50, relation - 1));
      }
    }
  }

  isOnSameTeam(other: Player): boolean {
    return this.team() !== null && this.team() === other.team();
  }

  team(): Team | null {
    return this._team;
  }

  alliances(): MutableAlliance[] {
    return this.mg
      .alliances()
      .filter(
        (a) =>
          (a.requestor() === this || a.recipient() === this) &&
          a.expiresAt() > this.mg.ticks(),
      );
  }

  expiredAlliances(): Alliance[] {
    return this._expiredAlliances.filter(
      (a) => a.requester() === this || a.recipient() === this,
    );
  }

  allies(): Player[] {
    return this.alliances().map((a) => a.other(this));
  }

  isAlliedWith(other: Player): boolean {
    return this.alliances().some((a) => a.other(this) === other);
  }

  allianceWith(other: Player): MutableAlliance | null {
    const alliance = this.alliances().find((a) => a.other(this) === other);
    return alliance ?? null;
  }

  breakAlliance(alliance: Alliance): void {
    this.mg.expireAlliance(alliance);
  }

  // ==================== 目标相关方法 ====================

  canTarget(other: Player): boolean {
    if (this === other) return false;
    if (this.isFriendly(other)) return false;
    return true;
  }

  target(other: Player): void {
    if (this.canTarget(other)) {
      this.targets_.push({
        tick: this.mg.ticks(),
        target: other,
      });
    }
  }

  targets(): Player[] {
    return this.targets_.map((t) => t.target);
  }

  transitiveTargets(): Player[] {
    const result = new Set(this.targets_.map((t) => t.target));

    // 添加目标的目标（传递性）
    for (const target of this.targets_) {
      for (const targetOfTarget of target.target.targets()) {
        result.add(targetOfTarget);
      }
    }

    return Array.from(result);
  }

  // ==================== 通信相关方法 ====================

  canSendEmoji(recipient: Player | typeof AllPlayers): boolean {
    // 可以向所有人或友好玩家发送表情
    if (recipient === AllPlayers) return true;
    if (recipient.isPlayer() && this.isFriendly(recipient as Player))
      return true;
    return false;
  }

  outgoingEmojis(): EmojiMessage[] {
    return this.outgoingEmojis_;
  }

  sendEmoji(recipient: Player | typeof AllPlayers, emoji: string): void {
    if (!this.canSendEmoji(recipient)) return;

    const emojiMessage: EmojiMessage = {
      id: this._pseudo_random.nextID().toString(),
      emoji,
      from: this.smallID(),
      to: recipient === AllPlayers ? -1 : (recipient as Player).smallID(),
      timestamp: this.mg.ticks(),
    };

    this.outgoingEmojis_.push(emojiMessage);
    this.mg.addUpdate({
      type: GameUpdateType.Emoji,
      emoji: emojiMessage,
    });
  }

  // ==================== 捐赠相关方法 ====================

  canDonateGold(recipient: Player): boolean {
    if (this === recipient) return false;
    if (!this.isFriendly(recipient)) return false;
    return this.gold() > 1000n; // 至少保留1000金币
  }

  canDonateTroops(recipient: Player): boolean {
    if (this === recipient) return false;
    if (!this.isFriendly(recipient)) return false;
    return this.troops() > 100; // 至少保留100军队
  }

  donateTroops(recipient: Player, troops: number): boolean {
    if (!this.canDonateTroops(recipient)) return false;
    if (troops <= 0) return false;

    const actualTroops = Math.min(troops, this.troops() - 100);
    this.removeTroops(actualTroops);
    recipient.addTroops(actualTroops);

    this.sentDonations.push(new Donation(recipient, this.mg.ticks()));

    this.mg.addUpdate({
      type: GameUpdateType.DisplayEvent,
      messageType: "donation",
      playerID: recipient.smallID(),
      params: {
        donor: this.smallID(),
        troops: actualTroops,
      },
    });

    return true;
  }

  donateGold(recipient: Player, gold: Gold): boolean {
    if (!this.canDonateGold(recipient)) return false;
    if (gold <= 0n) return false;

    const actualGold = gold > this.gold() - 1000n ? this.gold() - 1000n : gold;
    if (actualGold <= 0n) return false;

    this.removeGold(actualGold);
    recipient.addGold(actualGold);

    this.sentDonations.push(new Donation(recipient, this.mg.ticks()));

    this.mg.addUpdate({
      type: GameUpdateType.DisplayEvent,
      messageType: "donation",
      playerID: recipient.smallID(),
      params: {
        donor: this.smallID(),
        gold: actualGold.toString(),
      },
    });

    return true;
  }

  // ==================== 禁运相关方法 ====================

  hasEmbargoAgainst(other: Player): boolean {
    return this.embargoes.has(other.id());
  }

  tradingPartners(): Player[] {
    return this.mg
      .players()
      .filter(
        (p) =>
          p !== this &&
          !this.hasEmbargoAgainst(p) &&
          !p.hasEmbargoAgainst(this) &&
          this.canTrade(p),
      );
  }

  addEmbargo(other: Player, isTemporary: boolean): void {
    const embargo = new Embargo(other.id(), this.mg.ticks(), isTemporary);
    this.embargoes.set(other.id(), embargo);
  }

  getEmbargoes(): Embargo[] {
    return Array.from(this.embargoes.values());
  }

  stopEmbargo(other: Player): void {
    this.embargoes.delete(other.id());
  }

  endTemporaryEmbargo(other: Player): void {
    const embargo = this.embargoes.get(other.id());
    if (embargo && embargo.isTemporary) {
      this.embargoes.delete(other.id());
    }
  }

  canTrade(other: Player): boolean {
    if (this.hasEmbargoAgainst(other)) return false;
    if (other.hasEmbargoAgainst(this)) return false;
    return true;
  }

  canDeleteUnit(): boolean {
    const currentTick = this.mg.ticks();
    return currentTick - this.lastDeleteUnitTick >= 50; // 50 tick冷却时间
  }

  recordDeleteUnit(): void {
    this.lastDeleteUnitTick = this.mg.ticks();
  }

  canEmbargoAll(): boolean {
    const currentTick = this.mg.ticks();
    return currentTick - this.lastEmbargoAllTick >= 100; // 100 tick冷却时间
  }

  recordEmbargoAll(): void {
    this.lastEmbargoAllTick = this.mg.ticks();
  }
}
