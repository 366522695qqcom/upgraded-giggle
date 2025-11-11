import React, { useState, useEffect } from 'react';
import { PolicyType, Policy } from '../../../core/game/Game';
import { PolicyPanel } from './PolicyPanel';
import { PolicyTechManager } from '../../../core/game/PolicyTechManager';
import { usePlayerContext } from '../PlayerContext';
import { useGameContext } from '../GameContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { TechTree } from '../tech-tree/TechTree';

// 国策系统UI主组件
export const PolicySystemUI: React.FC = () => {
  const { player, sendMessage } = usePlayerContext();
  const { game } = useGameContext();
  
  // 状态管理
  const [selectedTab, setSelectedTab] = useState<string>('policies');
  const [unlockedPolicies, setUnlockedPolicies] = useState<PolicyType[]>([]);
  const [activePolicies, setActivePolicies] = useState<PolicyType[]>([]);
  const [researchedTechs, setResearchedTechs] = useState<Set<TechType>>(new Set());
  
  // 更新已解锁的国策和科技
  useEffect(() => {
    if (!player) return;
    
    // 获取已研究的科技
    const techs = new Set<TechType>();
    const researched = player.getResearchedTechnologies();
    researched.forEach(tech => {
      if ('type' in tech) {
        techs.add(tech.type);
      }
    });
    setResearchedTechs(techs);
    
    // 获取已解锁的国策
    const unlocked = PolicyTechManager.getUnlockedPolicies(techs);
    setUnlockedPolicies(unlocked);
    
    // 获取活跃的国策
    const active = player.getActivePolicies().filter(policy => 'type' in policy).map(policy => policy.type);
    setActivePolicies(active);
  }, [player]);
  
  // 处理国策实施
  const handleEnactPolicy = (policyType: PolicyType) => {
    if (!sendMessage) return;
    
    // 发送消息到后端
    sendMessage({
      type: 'ENACT_POLICY',
      data: {
        policyType: policyType
      }
    });
    
    // 本地更新活跃国策状态
    setActivePolicies(prev => [...prev, policyType]);
  };
  
  // 检查是否可以实施国策
  const canEnactPolicy = (policyType: PolicyType): boolean => {
    if (!player) return false;
    
    // 检查前置科技要求
    if (!PolicyTechManager.canEnactPolicy(policyType, researchedTechs)) {
      return false;
    }
    
    // 检查是否已经激活
    if (activePolicies.includes(policyType)) {
      return false;
    }
    
    // 检查金币是否足够
    const policy = PolicyTechManager.getPolicy(policyType);
    if (!policy) return false;
    
    return player.gold() >= policy.cost;
  };
  
  // 检查国策是否激活
  const isPolicyActive = (policyType: PolicyType): boolean => {
    return activePolicies.includes(policyType);
  };
  
  // 处理科技研究开始
  const handleStartResearch = (techType: TechType) => {
    if (!sendMessage) return;
    
    sendMessage({
      type: 'START_RESEARCH',
      data: {
        techType: techType
      }
    });
  };
  
  // 检查是否可以研究科技
  const canResearchTech = (techType: TechType): boolean => {
    if (!player) return false;
    
    // 检查前置科技要求
    if (!PolicyTechManager.canResearchTech(techType, researchedTechs)) {
      return false;
    }
    
    // 检查是否已经研究过
    if (researchedTechs.has(techType)) {
      return false;
    }
    
    // 检查金币是否足够
    const tech = PolicyTechManager.getTech(techType);
    if (!tech) return false;
    
    return player.gold() >= tech.cost;
  };
  
  // 检查科技是否已研究
  const isTechResearched = (techType: TechType): boolean => {
    return researchedTechs.has(techType);
  };
  
  // 获取科技研究进度
  const getTechResearchProgress = (techType: TechType): number => {
    if (!player) return 0;
    return player.getTechResearchProgress(techType);
  };
  
  // 获取当前研究
  const getCurrentResearch = () => {
    if (!player) return null;
    return player.getCurrentResearch();
  };
  
  if (!player || !game) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50">
        <Tabs 
          defaultValue="policies" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="h-full"
        >
          <div className="p-2">
            <TabsList className="w-full">
              <TabsTrigger 
                value="policies" 
                className="flex-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                国策管理
              </TabsTrigger>
              <TabsTrigger 
                value="tech-tree" 
                className="flex-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                科技树
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="policies" className="p-0 m-0 h-[calc(100%-64px)]">
            <PolicyPanel
              playerId={player.id()}
              onEnactPolicy={handleEnactPolicy}
              canEnactPolicy={canEnactPolicy}
              isPolicyActive={isPolicyActive}
              playerGold={player.gold()}
              unlockedPolicies={unlockedPolicies}
            />
          </TabsContent>
          
          <TabsContent value="tech-tree" className="p-0 m-0 h-[calc(100%-64px)]">
            <TechTree
              playerId={player.id()}
              onStartResearch={handleStartResearch}
              canResearchTech={canResearchTech}
              isTechResearched={isTechResearched}
              getTechResearchProgress={getTechResearchProgress}
              currentResearch={getCurrentResearch()}
              playerGold={player.gold()}
              researchedTechs={researchedTechs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
