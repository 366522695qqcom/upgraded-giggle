import React, { useState } from 'react';
import { TechType, Tech, Player } from '../../../core/game/Game';
import { Techs } from '../../../core/game/PolicyTechManager';
import './TechTree.css';

interface TechTreeProps {
  player: Player | null;
  onResearchStart: (techType: TechType) => void;
}

const TechTree: React.FC<TechTreeProps> = ({ player, onResearchStart }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [hoveredTech, setHoveredTech] = useState<TechType | null>(null);

  // 获取已研究的科技
  const researchedTechs = new Set(
    player?.researchedTechs().map(tech => tech.type) || []
  );

  // 获取当前正在研究的科技
  const currentResearch = player?.currentResearch();

  // 检查科技是否可以研究
  const canResearchTech = (tech: Tech): boolean => {
    if (!player || researchedTechs.has(tech.type)) return false;
    
    // 检查前置科技
    if (tech.prerequisites) {
      for (const prereq of tech.prerequisites) {
        if (!researchedTechs.has(prereq)) {
          return false;
        }
      }
    }
    
    // 检查金币是否足够
    return player.gold() >= tech.cost;
  };

  // 检查科技是否已解锁（前置条件满足）
  const isTechUnlocked = (tech: Tech): boolean => {
    if (!tech.prerequisites) return true;
    return tech.prerequisites.every(prereq => researchedTechs.has(prereq));
  };

  // 按类别筛选科技
  const filteredTechs = Object.values(Techs).filter(
    tech => tech.category === selectedCategory
  );

  return (
    <div className="tech-tree-container">
      <div className="tech-tree-header">
        <h2>科技树</h2>
        <div className="category-tabs">
          {['basic', 'economic', 'military', 'advanced'].map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'basic' && '基础科技'}
              {category === 'economic' && '经济科技'}
              {category === 'military' && '军事科技'}
              {category === 'advanced' && '高级科技'}
            </button>
          ))}
        </div>
      </div>

      {currentResearch && (
        <div className="current-research">
          <h3>当前研究</h3>
          <div className="research-progress">
            <div className="tech-name">{currentResearch.tech.name}</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentResearch.progress / currentResearch.tech.researchTime) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              剩余时间: {currentResearch.remainingTime} 回合
            </div>
          </div>
        </div>
      )}

      <div className="tech-grid">
        {filteredTechs.map(tech => {
          const isResearched = researchedTechs.has(tech.type);
          const canResearch = canResearchTech(tech);
          const isUnlocked = isTechUnlocked(tech);
          const isCurrentResearch = currentResearch?.tech.type === tech.type;

          return (
            <div
              key={tech.type}
              className={`tech-node ${
                isResearched ? 'researched' : 
                isCurrentResearch ? 'researching' : 
                isUnlocked ? 'unlocked' : 'locked'
              }`}
              onMouseEnter={() => setHoveredTech(tech.type)}
              onMouseLeave={() => setHoveredTech(null)}
              onClick={() => canResearch && onResearchStart(tech.type)}
            >
              <div className="tech-icon">
                {/* 这里可以放置科技图标 */}
                <span>{tech.name.charAt(0)}</span>
              </div>
              <div className="tech-name">{tech.name}</div>
              <div className="tech-cost">{tech.cost} 金币</div>
              {isCurrentResearch && (
                <div className="research-indicator">研究中...</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 科技详情悬浮框 */}
      {hoveredTech && (
        <div className="tech-tooltip">
          <h4>{Techs[hoveredTech].name}</h4>
          <p className="tech-description">{Techs[hoveredTech].description}</p>
          <div className="tech-details">
            <div>成本: {Techs[hoveredTech].cost} 金币</div>
            <div>研究时间: {Techs[hoveredTech].researchTime} 回合</div>
            {Techs[hoveredTech].prerequisites && Techs[hoveredTech].prerequisites.length > 0 && (
              <div className="prerequisites">
                <strong>前置科技:</strong>
                <ul>
                  {Techs[hoveredTech].prerequisites.map(prereq => (
                    <li key={prereq}>
                      {Techs[prereq].name} ({researchedTechs.has(prereq) ? '✓' : '✗'})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="effects">
              <strong>效果:</strong>
              <ul>
                {Techs[hoveredTech].effects.goldProductionMultiplier && (
                  <li>金币产量 +{((Techs[hoveredTech].effects.goldProductionMultiplier! - 1) * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.troopTrainingMultiplier && (
                  <li>军队训练速度 +{((Techs[hoveredTech].effects.troopTrainingMultiplier! - 1) * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.unitCostReduction && (
                  <li>单位成本 -{(Techs[hoveredTech].effects.unitCostReduction! * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.attackBonus && (
                  <li>攻击加成 +{(Techs[hoveredTech].effects.attackBonus! * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.defenseBonus && (
                  <li>防御加成 +{(Techs[hoveredTech].effects.defenseBonus! * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.researchSpeedMultiplier && (
                  <li>研究速度 +{((Techs[hoveredTech].effects.researchSpeedMultiplier! - 1) * 100).toFixed(0)}%</li>
                )}
                {Techs[hoveredTech].effects.unlockedUnits && Techs[hoveredTech].effects.unlockedUnits.length > 0 && (
                  <li>解锁单位: {Techs[hoveredTech].effects.unlockedUnits.join(', ')}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechTree;
