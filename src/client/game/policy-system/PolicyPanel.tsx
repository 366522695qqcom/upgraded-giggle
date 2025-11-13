import React, { useState } from "react";
import { Gold, Policy, PolicyType } from "../../../core/game/Game";
import { PolicyTechManager } from "../../../core/game/PolicyTechManager";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ScrollArea } from "../../ui/ScrollArea";
import { Separator } from "../../ui/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/Tabs";

interface PolicyPanelProps {
  playerId: string;
  onEnactPolicy: (policyType: PolicyType) => void;
  canEnactPolicy: (policyType: PolicyType) => boolean;
  isPolicyActive: (policyType: PolicyType) => boolean;
  playerGold: Gold;
  unlockedPolicies: PolicyType[];
}

export const PolicyPanel: React.FC<PolicyPanelProps> = ({
  playerId,
  onEnactPolicy,
  canEnactPolicy,
  isPolicyActive,
  playerGold,
  unlockedPolicies,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 分类国策
  const categorizedPolicies = PolicyTechManager.getAllPolicies().reduce(
    (acc, policy) => {
      const category = policy.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(policy);
      return acc;
    },
    {} as Record<string, Policy[]>,
  );

  // 获取所有政策分类
  const categories = Object.keys(categorizedPolicies);

  // 根据选中的分类过滤国策
  const filteredPolicies =
    selectedCategory === "all"
      ? PolicyTechManager.getAllPolicies()
      : categorizedPolicies[selectedCategory] || [];

  // 检查国策是否可用（已解锁且符合实施条件）
  const isPolicyAvailable = (policy: Policy): boolean => {
    return (
      unlockedPolicies.includes(policy.type) &&
      canEnactPolicy(policy.type) &&
      playerGold >= policy.cost &&
      !isPolicyActive(policy.type)
    );
  };

  // 国策卡片组件
  const PolicyCard: React.FC<{ policy: Policy }> = ({ policy }) => {
    const available = isPolicyAvailable(policy);
    const active = isPolicyActive(policy.type);
    const hasEnoughGold = playerGold >= policy.cost;
    const isUnlocked = unlockedPolicies.includes(policy.type);

    return (
      <Card
        className={`p-4 mb-4 border-2 transition-all duration-300 ${active ? "border-green-500 bg-green-50" : available ? "border-blue-500 hover:shadow-lg" : "border-gray-300 opacity-70"}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{policy.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{policy.category}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-yellow-600">💰 {policy.cost}</div>
            {policy.duration && (
              <div className="text-xs text-gray-500">
                持续 {policy.duration} 回合
              </div>
            )}
          </div>
        </div>

        <Separator className="my-3" />

        <p className="text-gray-600 mb-3">{policy.description}</p>

        {/* 显示效果描述 */}
        {policy.effects &&
          Object.entries(policy.effects).map(([key, value]) => {
            let effectDescription = "";
            let effectColor = "text-gray-700";

            switch (key) {
              case "goldProductionMultiplier":
                effectDescription = `金币产量 ${(Number(value) - 1) * 100}%`;
                effectColor =
                  Number(value) > 1 ? "text-green-600" : "text-red-600";
                break;
              case "troopTrainingMultiplier":
                effectDescription = `军队训练速度 ${(Number(value) - 1) * 100}%`;
                effectColor =
                  Number(value) > 1 ? "text-green-600" : "text-red-600";
                break;
              case "unitCostReduction":
                effectDescription = `单位成本降低 ${Number(value) * 100}%`;
                effectColor = "text-green-600";
                break;
              case "attackBonus":
                effectDescription = `攻击加成 +${Number(value) * 100}%`;
                effectColor = "text-green-600";
                break;
              case "defenseBonus":
                effectDescription = `防御加成 +${Number(value) * 100}%`;
                effectColor = "text-green-600";
                break;
              case "researchSpeedMultiplier":
                effectDescription = `研究速度 ${(Number(value) - 1) * 100}%`;
                effectColor =
                  Number(value) > 1 ? "text-green-600" : "text-red-600";
                break;
              default:
                effectDescription = `${key}: ${value}`;
            }

            return (
              <div
                key={key}
                className={`text-sm font-medium ${effectColor} mb-1`}
              >
                • {effectDescription}
              </div>
            );
          })}

        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {active && (
              <span className="text-green-600 font-medium">✓ 已激活</span>
            )}
            {!active && !isUnlocked && (
              <span className="text-red-500">🔒 需要更多科技</span>
            )}
            {!active && isUnlocked && !hasEnoughGold && (
              <span className="text-red-500">💰 资金不足</span>
            )}
            {!active &&
              isUnlocked &&
              hasEnoughGold &&
              !canEnactPolicy(policy.type) && (
                <span className="text-orange-500">❓ 未满足条件</span>
              )}
          </div>

          <Button
            onClick={() => available && onEnactPolicy(policy.type)}
            disabled={!available}
            className={`transition-all duration-300 ${available ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {active ? "已激活" : available ? "实施政策" : "无法实施"}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          国策管理
        </h2>
        <p className="text-center text-gray-500 mt-1">选择和实施国家政策</p>
      </div>

      <Tabs
        defaultValue="all"
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="flex-1 flex flex-col"
      >
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <TabsList className="w-full">
            <TabsTrigger
              value="all"
              className="flex-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
            >
              所有国策
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                {category === "economic"
                  ? "经济"
                  : category === "military"
                    ? "军事"
                    : category === "cultural"
                      ? "文化"
                      : category === "diplomatic"
                        ? "外交"
                        : category === "infrastructure"
                          ? "基建"
                          : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={selectedCategory} className="flex-1 p-0 m-0">
          <ScrollArea className="h-full p-4">
            {filteredPolicies.length === 0 ? (
              <div className="text-center p-8 text-gray-500">暂无可用国策</div>
            ) : (
              filteredPolicies.map((policy) => (
                <PolicyCard key={policy.type} policy={policy} />
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
