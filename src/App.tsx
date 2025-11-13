import { useEffect, useState } from "react";
import { GameSetup } from "./components/GameSetup";
import { GameUI } from "./components/GameUI";
import { GameConfig, Resources } from "./types/game";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("玩家");
  const [initialResources, setInitialResources] = useState<Resources>({
    gold: 300,
    steel: 50,
    crystal: 20,
    rareEarth: 0,
  });

  // 从 Cookie 加载游戏状态
  useEffect(() => {
    const savedGame = document.cookie
      .split("; ")
      .find((row) => row.startsWith("szyy_game="));

    if (savedGame) {
      try {
        const data = JSON.parse(decodeURIComponent(savedGame.split("=")[1]));
        setGameStarted(data.gameStarted ?? false);
        setGameConfig(data.gameConfig ?? null);
        setPlayerName(data.playerName ?? "玩家");
        setInitialResources(data.resources ?? initialResources);
      } catch (e) {
        console.error("无法从Cookie加载游戏:", e);
      }
    }
  }, []);

  // 保存游戏状态到 Cookie
  const saveGameToCookie = (data: any) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30天过期
    document.cookie = `szyy_game=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/`;
  };

  const handleStartGame = (config: GameConfig) => {
    const name = `玩家_${Math.floor(Math.random() * 10000)}`;

    // 根据难度调整初始资源
    let resources = { gold: 300, steel: 50, crystal: 20, rareEarth: 0 };

    if (config.difficulty === "relaxed") {
      resources = { gold: 500, steel: 100, crystal: 50, rareEarth: 5 };
    } else if (config.difficulty === "impossible") {
      resources = { gold: 150, steel: 20, crystal: 10, rareEarth: 0 };
    }

    if (config.infiniteResources) {
      resources = {
        gold: 999999,
        steel: 999999,
        crystal: 999999,
        rareEarth: 999999,
      };
    }

    setPlayerName(name);
    setInitialResources(resources);
    setGameStarted(true);

    // 保存到 Cookie
    saveGameToCookie({
      gameStarted: true,
      gameConfig: config,
      playerName: name,
      resources: resources,
    });
  };

  if (!gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  return <GameUI playerName={playerName} initialResources={initialResources} />;
}

export default App;
