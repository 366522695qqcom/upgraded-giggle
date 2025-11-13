import { Gold, Player, Tick } from "./Game";

// 国策类别
export enum PolicyCategory {
  ECONOMIC = "Economic",
  MILITARY = "Military",
  CULTURAL = "Cultural",
  DIPLOMATIC = "Diplomatic",
  INFRASTRUCTURE = "Infrastructure",
}

// 国策接口
export interface Policy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  requiredTech?: string;
  requirements: PolicyRequirement[];
  effects: PolicyEffect[];
  duration: Tick;
  cost: Gold;
  isActive: boolean;
  activationTick: Tick;
}

// 国策要求接口
export interface PolicyRequirement {
  check(player: Player): boolean;
  getDescription(): string;
}

// 国策效果接口
export interface PolicyEffect {
  apply(player: Player): void;
  revert(player: Player): void;
  getDescription(): string;
}

// 科技类别
export enum TechCategory {
  MILITARY = "Military",
  ECONOMY = "Economy",
  SCIENCE = "Science",
  INFRASTRUCTURE = "Infrastructure",
  SPECIAL = "Special",
}

// 科技接口
export interface Technology {
  id: string;
  name: string;
  description: string;
  category: TechCategory;
  prerequisites: string[];
  researchCost: Gold;
  researchTime: Tick;
  effects: TechEffect[];
  isResearched: boolean;
  researchProgress: Tick;
  unlocksPolicies: string[];
}

// 科技效果接口
export interface TechEffect {
  apply(player: Player): void;
  getDescription(): string;
}

// 国策管理器类
export class PolicyManager {
  private activePolicies: Map<string, Policy> = new Map();
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  // 实施国策
  implementPolicy(policy: Policy): boolean {
    // 检查是否满足要求
    for (const req of policy.requirements) {
      if (!req.check(this.player)) {
        return false;
      }
    }

    // 检查成本
    const playerImpl = this.player as any;
    if (!playerImpl || playerImpl.gold() < policy.cost) {
      return false;
    }

    // 扣除成本
    playerImpl.setGold(playerImpl.gold() - policy.cost);

    // 激活国策
    policy.isActive = true;
    // 注意：不再直接访问mg，activationTick将在外部设置
    this.activePolicies.set(policy.id, policy);

    // 应用效果
    for (const effect of policy.effects) {
      effect.apply(this.player);
    }

    return true;
  }

  // 检查并应用国策持续时间效果
  update(): void {
    const playerImpl = this.player as any;
    const currentTick = playerImpl?._game?.ticks() ?? 0;
    const expiredPolicies: string[] = [];

    this.activePolicies.forEach((policy) => {
      if (
        policy.duration > 0 &&
        currentTick - policy.activationTick >= policy.duration
      ) {
        // 国策到期，恢复效果
        for (const effect of policy.effects) {
          effect.revert(this.player);
        }
        expiredPolicies.push(policy.id);
      }
    });

    // 移除过期国策
    for (const id of expiredPolicies) {
      this.activePolicies.delete(id);
    }
  }

  // 取消国策
  cancelPolicy(policyId: string): boolean {
    const policy = this.activePolicies.get(policyId);
    if (!policy) return false;

    // 撤销效果
    for (const effect of policy.effects) {
      effect.revert(this.player);
    }

    // 移除国策
    this.activePolicies.delete(policyId);

    return true;
  }

  // 获取指定的活跃国策
  getActivePolicy(policyId: string): Policy | undefined {
    return this.activePolicies.get(policyId);
  }

  // 检查是否可以实施国策
  canImplementPolicy(policy: Policy): boolean {
    // 检查是否已经激活
    if (this.activePolicies.has(policy.id)) {
      return false;
    }

    // 检查要求
    for (const req of policy.requirements) {
      if (!req.check(this.player)) {
        return false;
      }
    }

    // 检查成本
    const playerImpl = this.player as any;
    return playerImpl?.gold() >= policy.cost || false;
  }

  // 获取所有激活的国策
  getActivePolicies(): Policy[] {
    return Array.from(this.activePolicies.values());
  }

  // 检查国策是否激活
  isPolicyActive(policyId: string): boolean {
    return this.activePolicies.has(policyId);
  }
}

// 科技树管理器类
export class TechTreeManager {
  private technologies: Map<string, Technology> = new Map();
  private researchingTech: Technology | null = null;
  private researchStartTime: Tick = 0;
  private player: Player;

  constructor(player: Player, techs: Technology[]) {
    this.player = player;
    techs.forEach((tech) => {
      this.technologies.set(tech.id, tech);
    });
  }

  // 开始研究科技
  startResearch(techId: string): boolean {
    const tech = this.technologies.get(techId);
    if (!tech || tech.isResearched) {
      return false;
    }

    // 检查前置科技
    for (const prereqId of tech.prerequisites) {
      const prereq = this.technologies.get(prereqId);
      if (!prereq || !prereq.isResearched) {
        return false;
      }
    }

    // 检查研究成本
    const playerImpl = this.player as any;
    if (!playerImpl || playerImpl.gold() < tech.researchCost) {
      return false;
    }

    // 扣除研究成本
    playerImpl.setGold(playerImpl.gold() - tech.researchCost);

    // 开始研究
    tech.researchProgress = 1; // 初始进度
    // 注意：不再直接访问mg，研究时间将在外部管理
    this.researchingTech = tech;

    return true;
  }

  // 获取科技
  getTechnology(techId: string): Technology | undefined {
    return this.technologies.get(techId);
  }

  // 检查科技是否正在研究中
  isResearching(techId: string): boolean {
    return this.researchingTech?.id === techId;
  }

  // 更新研究进度
  update(): void {
    if (!this.researchingTech) return;

    // 注意：研究进度将在外部更新
    // 这里只保留研究完成的逻辑，进度计算由PlayerImpl管理
    const playerImpl = this.player as any;
    const researchProgress =
      playerImpl?.getTechResearchProgress?.(this.researchingTech.id) ?? 0;

    if (researchProgress >= 100) {
      this.completeResearch();
    }
  }

  // 完成研究
  private completeResearch(): void {
    if (!this.researchingTech) return;

    // 标记为已研究
    this.researchingTech.isResearched = true;

    // 应用科技效果
    for (const effect of this.researchingTech.effects) {
      effect.apply(this.player);
    }

    // 更新PlayerImpl中的已研究科技集合
    const playerImpl = this.player as any;
    if (
      playerImpl &&
      playerImpl.researchedTechs &&
      "add" in playerImpl.researchedTechs
    ) {
      playerImpl.researchedTechs.add(this.researchingTech.id);
    }

    // 清除当前研究
    this.researchingTech = null;
  }

  // 获取所有科技
  getAllTechnologies(): Technology[] {
    return Array.from(this.technologies.values());
  }

  // 获取已研究的科技
  getResearchedTechnologies(): Technology[] {
    return Array.from(this.technologies.values()).filter(
      (tech) => tech.isResearched,
    );
  }

  // 获取当前正在研究的科技
  getCurrentResearch(): Technology | null {
    return this.researchingTech;
  }

  // 检查科技是否已研究
  isTechResearched(techId: string): boolean {
    const tech = this.technologies.get(techId);
    return tech ? tech.isResearched : false;
  }

  // 获取科技的研究进度
  getTechResearchProgress(techId: string): number {
    const tech = this.technologies.get(techId);
    if (!tech || tech.isResearched) {
      return 0;
    }
    return tech.researchProgress / tech.researchTime;
  }
}
