import { Gold, Player } from './Game';
import { PlayerImpl } from './PlayerImpl';
import {
  Policy,
  PolicyCategory,
  PolicyEffect,
  PolicyRequirement,
  Technology,
  TechCategory,
  TechEffect
} from './PolicyTechSystem';

// 国策要求实现类

// 要求玩家拥有特定数量的领土
export class TerritoryRequirement implements PolicyRequirement {
  constructor(private minTiles: number) {}

  check(player: Player): boolean {
    return player.numTilesOwned() >= this.minTiles;
  }

  getDescription(): string {
    return `需要拥有至少 ${this.minTiles} 个领土`;
  }
}

// 要求玩家拥有特定科技
export class TechRequirement implements PolicyRequirement {
  constructor(private techId: string, private techName: string) {}

  check(player: Player): boolean {
    const playerImpl = player as PlayerImpl;
    return playerImpl.techTreeManager?.isTechResearched(this.techId) || false;
  }

  getDescription(): string {
    return `需要研究科技: ${this.techName}`;
  }
}

// 国策效果实现类

// 增加金币产出
export class GoldProductionEffect implements PolicyEffect {
  private originalRate: number | null = null;

  constructor(private rateIncrease: number) {}

  apply(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 保存原始产出率
    if (this.originalRate === null) {
      this.originalRate = playerImpl.goldProductionRate;
    }
    // 应用增加
    playerImpl.goldProductionRate = this.originalRate + this.rateIncrease;
  }

  revert(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 恢复原始产出率
    if (this.originalRate !== null) {
      playerImpl.goldProductionRate = this.originalRate;
    }
  }

  getDescription(): string {
    return `金币产出率增加 ${this.rateIncrease}%`;
  }
}

// 增加军队训练速度
export class TroopTrainingEffect implements PolicyEffect {
  private originalRate: number | null = null;

  constructor(private rateIncrease: number) {}

  apply(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 保存原始训练率
    if (this.originalRate === null) {
      this.originalRate = playerImpl.troopTrainingRate;
    }
    // 应用增加
    playerImpl.troopTrainingRate = this.originalRate + this.rateIncrease;
  }

  revert(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 恢复原始训练率
    if (this.originalRate !== null) {
      playerImpl.troopTrainingRate = this.originalRate;
    }
  }

  getDescription(): string {
    return `军队训练速度增加 ${this.rateIncrease}%`;
  }
}

// 科技效果实现类

// 解锁新单位类型
export class UnlockUnitEffect implements TechEffect {
  constructor(private unitType: string) {}

  apply(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 标记单位类型为已解锁
    if (!playerImpl.unlockedUnits) {
      playerImpl.unlockedUnits = new Set();
    }
    playerImpl.unlockedUnits.add(this.unitType);
  }

  getDescription(): string {
    return `解锁单位: ${this.unitType}`;
  }
}

// 降低单位成本
export class UnitCostReductionEffect implements TechEffect {
  private originalReduction: number | null = null;

  constructor(private reductionAmount: number) {}

  apply(player: Player): void {
    const playerImpl = player as PlayerImpl;
    // 保存原始减少量
    if (this.originalReduction === null) {
      this.originalReduction = playerImpl.unitCostReduction || 0;
    }
    // 应用减少
    playerImpl.unitCostReduction = this.originalReduction + this.reductionAmount;
  }

  getDescription(): string {
    return `单位成本降低 ${this.reductionAmount}%`;
  }
}

// 预定义国策
export const PREDEFINED_POLICIES: Policy[] = [
  {
    id: 'economic_boom',
    name: '经济繁荣',
    description: '刺激经济发展，提高金币产出',
    category: PolicyCategory.ECONOMIC,
    requirements: [new TerritoryRequirement(10)],
    effects: [new GoldProductionEffect(20)],
    duration: 100,
    cost: 500n,
    isActive: false,
    activationTick: 0
  },
  {
    id: 'total_mobilization',
    name: '全面动员',
    description: '增加军队训练速度，为战争做准备',
    category: PolicyCategory.MILITARY,
    requirements: [new TerritoryRequirement(5)],
    effects: [new TroopTrainingEffect(30)],
    duration: 80,
    cost: 300n,
    isActive: false,
    activationTick: 0
  },
  {
    id: 'advanced_infrastructure',
    name: '先进基础设施',
    description: '建设现代化基础设施，提高整体效率',
    category: PolicyCategory.INFRASTRUCTURE,
    requiredTech: 'industrial_revolution',
    requirements: [new TerritoryRequirement(15), new TechRequirement('industrial_revolution', '工业革命')],
    effects: [new GoldProductionEffect(15), new TroopTrainingEffect(15)],
    duration: 150,
    cost: 1000n,
    isActive: false,
    activationTick: 0
  }
];

// 预定义科技
export const PREDEFINED_TECHNOLOGIES: Technology[] = [
  {
    id: 'basic_economics',
    name: '基础经济学',
    description: '了解基本的经济原理',
    category: TechCategory.ECONOMY,
    prerequisites: [],
    researchCost: 200n,
    researchTime: 30,
    effects: [new GoldProductionEffect(10)],
    isResearched: false,
    researchProgress: 0,
    unlocksPolicies: ['economic_boom']
  },
  {
    id: 'military_training',
    name: '军事训练',
    description: '提高军队训练效率',
    category: TechCategory.MILITARY,
    prerequisites: [],
    researchCost: 150n,
    researchTime: 25,
    effects: [new TroopTrainingEffect(10)],
    isResearched: false,
    researchProgress: 0,
    unlocksPolicies: ['total_mobilization']
  },
  {
    id: 'industrial_revolution',
    name: '工业革命',
    description: '引发工业革命，大幅提升生产能力',
    category: TechCategory.INFRASTRUCTURE,
    prerequisites: ['basic_economics'],
    researchCost: 800n,
    researchTime: 80,
    effects: [new GoldProductionEffect(25), new UnitCostReductionEffect(10)],
    isResearched: false,
    researchProgress: 0,
    unlocksPolicies: ['advanced_infrastructure']
  }
];
