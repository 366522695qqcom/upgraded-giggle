import { Player, Policy, PolicyType, Tech, TechType, UnitType } from "./Game";

// 国策实现
export const Policies: Record<PolicyType, Policy> = {
  [PolicyType.ECONOMIC_STIMULUS]: {
    type: PolicyType.ECONOMIC_STIMULUS,
    name: "经济刺激",
    description: "短期内提高金币产量25%，促进经济发展",
    category: "economic",
    cost: 500n,
    duration: 20,
    effects: {
      goldProductionMultiplier: 1.25,
    },
  },
  [PolicyType.INDUSTRIALIZATION]: {
    type: PolicyType.INDUSTRIALIZATION,
    name: "工业化",
    description: "降低单位生产成本15%，加速工业化进程",
    category: "economic",
    cost: 1000n,
    duration: 30,
    effects: {
      unitCostReduction: 0.15,
    },
  },
  [PolicyType.FREE_TRADE]: {
    type: PolicyType.FREE_TRADE,
    name: "自由贸易",
    description: "提高金币产量20%，但使军队训练速度降低10%",
    category: "economic",
    cost: 800n,
    duration: 25,
    effects: {
      goldProductionMultiplier: 1.2,
      troopTrainingMultiplier: 0.9,
    },
  },
  [PolicyType.PROTECTIONISM]: {
    type: PolicyType.PROTECTIONISM,
    name: "保护主义",
    description: "提高防御加成15%，但降低金币产量10%",
    category: "economic",
    cost: 600n,
    duration: 20,
    effects: {
      defenseBonus: 0.15,
      goldProductionMultiplier: 0.9,
    },
  },
  [PolicyType.TAX_REFORM]: {
    type: PolicyType.TAX_REFORM,
    name: "税收改革",
    description: "提高金币产量15%，持续较长时间",
    category: "economic",
    cost: 700n,
    duration: 40,
    effects: {
      goldProductionMultiplier: 1.15,
    },
  },
  [PolicyType.MILITARY_TRAINING]: {
    type: PolicyType.MILITARY_TRAINING,
    name: "军事训练",
    description: "提高军队训练速度20%，增强军事实力",
    category: "military",
    cost: 800n,
    duration: 25,
    effects: {
      troopTrainingMultiplier: 1.2,
    },
  },
  [PolicyType.DEFENSIVE_DOCTRINE]: {
    type: PolicyType.DEFENSIVE_DOCTRINE,
    name: "防御学说",
    description: "提高防御加成20%，适合防御型战略",
    category: "military",
    cost: 900n,
    duration: 30,
    effects: {
      defenseBonus: 0.2,
    },
  },
  [PolicyType.OFFENSIVE_DOCTRINE]: {
    type: PolicyType.OFFENSIVE_DOCTRINE,
    name: "进攻学说",
    description: "提高攻击加成15%，适合侵略性战略",
    category: "military",
    cost: 1000n,
    duration: 25,
    effects: {
      attackBonus: 0.15,
    },
  },
  [PolicyType.SIEGE_EXPERTISE]: {
    type: PolicyType.SIEGE_EXPERTISE,
    name: "攻城专精",
    description: "提高对城市和防御工事的攻击力25%",
    category: "military",
    cost: 1200n,
    duration: 30,
    effects: {
      attackBonus: 0.25,
    },
    prerequisites: [TechType.MILITARY_ENGINEERING],
  },
  [PolicyType.NAVAL_SUPREMACY]: {
    type: PolicyType.NAVAL_SUPREMACY,
    name: "海上霸权",
    description: "降低海军单位生产成本20%，增强海上力量",
    category: "military",
    cost: 1500n,
    duration: 35,
    effects: {
      unitCostReduction: 0.2,
    },
    prerequisites: [TechType.NAVAL_TECHNOLOGY],
  },
  [PolicyType.CULTURAL_EXPANSION]: {
    type: PolicyType.CULTURAL_EXPANSION,
    name: "文化扩张",
    description: "提高外交关系改善速度15%，促进文化交流",
    category: "cultural",
    cost: 600n,
    duration: 25,
    effects: {
      diplomacyBonus: 0.15,
    },
  },
  [PolicyType.EDUCATIONAL_REFORM]: {
    type: PolicyType.EDUCATIONAL_REFORM,
    name: "教育改革",
    description: "提高科技研发速度20%，培养高素质人才",
    category: "cultural",
    cost: 1200n,
    duration: 30,
    effects: {
      researchSpeedMultiplier: 1.2,
    },
  },
  [PolicyType.RELIGIOUS_UNITY]: {
    type: PolicyType.RELIGIOUS_UNITY,
    name: "宗教统一",
    description: "提高国内稳定度，增加防御加成10%",
    category: "cultural",
    cost: 500n,
    duration: 20,
    effects: {
      defenseBonus: 0.1,
    },
  },
  [PolicyType.DIPLOMATIC_FINESSE]: {
    type: PolicyType.DIPLOMATIC_FINESSE,
    name: "外交技巧",
    description: "大幅提高外交关系改善速度30%，善于外交手腕",
    category: "cultural",
    cost: 1000n,
    duration: 30,
    effects: {
      diplomacyBonus: 0.3,
    },
    prerequisites: [TechType.WRITING],
  },
  [PolicyType.PROPAGANDA]: {
    type: PolicyType.PROPAGANDA,
    name: "宣传政策",
    description: "提高军队士气，增强攻击和防御加成10%",
    category: "cultural",
    cost: 800n,
    duration: 25,
    effects: {
      attackBonus: 0.1,
      defenseBonus: 0.1,
    },
  },
};

// 科技实现
export const Techs: Record<TechType, Tech> = {
  [TechType.AGRICULTURAL_REVOLUTION]: {
    type: TechType.AGRICULTURAL_REVOLUTION,
    name: "农业革命",
    description: "提高基础粮食产量，增加金币收入10%",
    category: "basic",
    cost: 300n,
    researchTime: 10,
    effects: {
      goldProductionMultiplier: 1.1,
    },
  },
  [TechType.IRON_WORKING]: {
    type: TechType.IRON_WORKING,
    name: "铁器制造",
    description: "解锁铁器武器，提高军队战斗力",
    category: "basic",
    cost: 400n,
    researchTime: 15,
    effects: {
      attackBonus: 0.1,
      unlockedUnits: [],
    },
  },
  [TechType.WRITING]: {
    type: TechType.WRITING,
    name: "文字书写",
    description: "发展文字系统，促进知识传播，加快科技研发速度",
    category: "basic",
    cost: 350n,
    researchTime: 12,
    effects: {
      researchSpeedMultiplier: 1.1,
    },
  },
  [TechType.BANKING]: {
    type: TechType.BANKING,
    name: "银行业",
    description: "建立银行系统，大幅提高金币产量15%",
    category: "economic",
    cost: 800n,
    researchTime: 20,
    effects: {
      goldProductionMultiplier: 1.15,
    },
    prerequisites: [TechType.WRITING],
  },
  [TechType.INDUSTRIAL_REVOLUTION]: {
    type: TechType.INDUSTRIAL_REVOLUTION,
    name: "工业革命",
    description: "引发工业革命，降低单位生产成本20%，提高生产力",
    category: "economic",
    cost: 2000n,
    researchTime: 40,
    effects: {
      unitCostReduction: 0.2,
      goldProductionMultiplier: 1.2,
    },
    prerequisites: [TechType.BANKING],
  },
  [TechType.TRADE_NETWORKS]: {
    type: TechType.TRADE_NETWORKS,
    name: "贸易网络",
    description: "建立全球贸易网络，显著提高金币产量20%",
    category: "economic",
    cost: 1500n,
    researchTime: 30,
    effects: {
      goldProductionMultiplier: 1.2,
    },
    prerequisites: [TechType.BANKING],
  },
  [TechType.MILITARY_ENGINEERING]: {
    type: TechType.MILITARY_ENGINEERING,
    name: "军事工程",
    description: "发展军事工程技术，提高攻击加成15%，改善攻城能力",
    category: "military",
    cost: 1200n,
    researchTime: 25,
    effects: {
      attackBonus: 0.15,
    },
    prerequisites: [TechType.IRON_WORKING],
  },
  [TechType.GUNPOWDER]: {
    type: TechType.GUNPOWDER,
    name: "火药技术",
    description: "发明火药，解锁先进火器，大幅提高攻击力20%",
    category: "military",
    cost: 1800n,
    researchTime: 35,
    effects: {
      attackBonus: 0.2,
    },
    prerequisites: [TechType.MILITARY_ENGINEERING],
  },
  [TechType.NAVAL_TECHNOLOGY]: {
    type: TechType.NAVAL_TECHNOLOGY,
    name: "航海技术",
    description: "发展航海技术，提高海军作战能力，降低海军单位成本15%",
    category: "military",
    cost: 1400n,
    researchTime: 30,
    effects: {
      unitCostReduction: 0.15,
    },
    prerequisites: [TechType.IRON_WORKING],
  },
  [TechType.COMPUTERS]: {
    type: TechType.COMPUTERS,
    name: "计算机技术",
    description: "发展计算机技术，显著提升科技研发速度30%，增强信息处理能力",
    category: "advanced",
    cost: 3000n,
    researchTime: 50,
    effects: {
      researchSpeedMultiplier: 1.3,
    },
    prerequisites: [TechType.INDUSTRIAL_REVOLUTION],
  },
  [TechType.NUCLEAR_FISSION]: {
    type: TechType.NUCLEAR_FISSION,
    name: "核裂变",
    description: "掌握核裂变技术，解锁核武器，改变战争格局",
    category: "advanced",
    cost: 5000n,
    researchTime: 80,
    effects: {
      unlockedUnits: [UnitType.AtomBomb, UnitType.HydrogenBomb, UnitType.MIRV],
    },
    prerequisites: [TechType.COMPUTERS],
  },
  [TechType.SPACE_EXPLORATION]: {
    type: TechType.SPACE_EXPLORATION,
    name: "太空探索",
    description: "开启太空时代，全面提升各项能力，科技研发速度提高50%",
    category: "advanced",
    cost: 8000n,
    researchTime: 100,
    effects: {
      researchSpeedMultiplier: 1.5,
      goldProductionMultiplier: 1.25,
      troopTrainingMultiplier: 1.1,
    },
    prerequisites: [TechType.NUCLEAR_FISSION],
  },
};

// 国策和科技管理器类
export class PolicyTechManager {
  private player: Player | null = null;

  constructor(player?: Player) {
    this.player = player ?? null;
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  // 获取所有可用的国策
  static getAllPolicies(): Policy[] {
    return Object.values(Policies);
  }

  // 获取所有可用的科技
  static getAllTechs(): Tech[] {
    return Object.values(Techs);
  }

  // 获取特定国策
  static getPolicy(policyType: PolicyType): Policy | undefined {
    return Policies[policyType];
  }

  // 获取特定科技
  static getTech(techType: TechType): Tech | undefined {
    return Techs[techType];
  }

  // 检查科技是否满足前置条件
  static canResearchTech(
    techType: TechType,
    researchedTechs: Set<TechType>,
  ): boolean {
    const tech = Techs[techType];
    if (!tech || researchedTechs.has(techType)) return false;

    // 检查所有前置科技是否已研究
    if (tech.prerequisites) {
      return tech.prerequisites.every((prereq) => researchedTechs.has(prereq));
    }
    return true;
  }

  // 检查国策是否满足前置条件
  static canEnactPolicy(
    policyType: PolicyType,
    researchedTechs: Set<TechType>,
  ): boolean {
    const policy = Policies[policyType];
    if (!policy) return false;

    // 检查所有前置科技是否已研究
    if (policy.prerequisites) {
      return policy.prerequisites.every((prereq) =>
        researchedTechs.has(prereq),
      );
    }
    return true;
  }

  // 获取已解锁的所有单位
  static getUnlockedUnits(researchedTechs: Set<TechType>): UnitType[] {
    const unlockedUnits = new Set<UnitType>();

    // 默认解锁基础单位
    unlockedUnits.add(UnitType.Infantry);
    unlockedUnits.add(UnitType.Cavalry);
    unlockedUnits.add(UnitType.Archer);

    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.unlockedUnits) {
        tech.effects.unlockedUnits.forEach((unit) => {
          unlockedUnits.add(unit);
        });
      }
    });

    return Array.from(unlockedUnits);
  }

  // 获取已解锁的所有国策
  static getUnlockedPolicies(researchedTechs: Set<TechType>): PolicyType[] {
    return Object.values(Policies)
      .filter((policy) => {
        // 没有前置条件或者所有前置科技都已研究
        if (!policy.prerequisites) return true;
        return policy.prerequisites.every((prereq) =>
          researchedTechs.has(prereq),
        );
      })
      .map((policy) => policy.type);
  }

  // 计算研究速度倍率
  static calculateResearchSpeedMultiplier(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let multiplier = 1.0;

    // 添加科技带来的研究速度加成
    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.researchSpeedMultiplier) {
        multiplier *= tech.effects.researchSpeedMultiplier;
      }
    });

    // 添加国策带来的研究速度加成
    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.researchSpeedMultiplier) {
        multiplier *= policy.effects.researchSpeedMultiplier;
      }
    });

    return multiplier;
  }

  // 计算金币产出倍率
  static calculateGoldProductionMultiplier(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let multiplier = 1.0;

    // 添加科技带来的金币产出加成
    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.goldProductionMultiplier) {
        multiplier *= tech.effects.goldProductionMultiplier;
      }
    });

    // 添加国策带来的金币产出加成
    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.goldProductionMultiplier) {
        multiplier *= policy.effects.goldProductionMultiplier;
      }
    });

    return multiplier;
  }

  // 计算军队训练速度倍率
  static calculateTroopTrainingMultiplier(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let multiplier = 1.0;

    // 添加科技带来的训练速度加成
    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.troopTrainingMultiplier) {
        multiplier *= tech.effects.troopTrainingMultiplier;
      }
    });

    // 添加国策带来的训练速度加成
    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.troopTrainingMultiplier) {
        multiplier *= policy.effects.troopTrainingMultiplier;
      }
    });

    return multiplier;
  }

  // 计算单位成本降低
  static calculateUnitCostReduction(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let reduction = 0.0;

    // 添加科技带来的成本降低
    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.unitCostReduction) {
        reduction += tech.effects.unitCostReduction;
      }
    });

    // 添加国策带来的成本降低
    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.unitCostReduction) {
        reduction += policy.effects.unitCostReduction;
      }
    });

    // 确保降低不会超过100%
    return Math.min(reduction, 0.99);
  }

  // 计算攻击加成
  static calculateAttackBonus(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let bonus = 0.0;

    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.attackBonus) {
        bonus += tech.effects.attackBonus;
      }
    });

    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.attackBonus) {
        bonus += policy.effects.attackBonus;
      }
    });

    return bonus;
  }

  // 计算防御加成
  static calculateDefenseBonus(
    researchedTechs: Set<TechType>,
    activePolicies: Set<PolicyType>,
  ): number {
    let bonus = 0.0;

    researchedTechs.forEach((techType) => {
      const tech = Techs[techType];
      if (tech?.effects?.defenseBonus) {
        bonus += tech.effects.defenseBonus;
      }
    });

    activePolicies.forEach((policyType) => {
      const policy = Policies[policyType];
      if (policy?.effects?.defenseBonus) {
        bonus += policy.effects.defenseBonus;
      }
    });

    return bonus;
  }
}
