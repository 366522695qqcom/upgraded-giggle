import { UserSettings } from "../game/UserSettings";
import { GameConfig } from "../Schemas";
import { Config, GameEnv, ServerConfig } from "./Config";
import { DefaultConfig } from "./DefaultConfig";
import { DevConfig, DevServerConfig } from "./DevConfig";
import { preprodConfig } from "./PreprodConfig";
import { prodConfig } from "./ProdConfig";

export let cachedSC: ServerConfig | null = null;

export async function getConfig(
  gameConfig: GameConfig,
  userSettings: UserSettings | null,
  isReplay: boolean = false,
): Promise<Config> {
  const sc = await getServerConfigFromClient();
  switch (sc.env()) {
    case GameEnv.Dev:
      return new DevConfig(sc, gameConfig, userSettings, isReplay);
    case GameEnv.Preprod:
    case GameEnv.Prod:
      console.log("using prod config");
      return new DefaultConfig(sc, gameConfig, userSettings, isReplay);
    default:
      throw Error(`unsupported server configuration: ${process.env.GAME_ENV}`);
  }
}
export async function getServerConfigFromClient(): Promise<ServerConfig> {
  if (cachedSC) {
    return cachedSC;
  }

  try {
    // Try to fetch configuration from server
    const response = await fetch("/api/config");
    if (response.ok) {
      await response.json(); // Read and ignore response since we're using DevServerConfig
      console.log("Fetched server configuration successfully");

      // Create a server config instance
      cachedSC = new DevServerConfig();
      return cachedSC;
    }
    throw new Error(`Failed to fetch config: ${response.status}`);
  } catch (error) {
    console.log(
      "Failed to fetch server configuration, using offline mode",
      error,
    );
    // Fallback to offline mode if fetch fails
    cachedSC = new DevServerConfig();
    return cachedSC;
  }
}
export function getServerConfigFromServer(): ServerConfig {
  const gameEnv = process.env.GAME_ENV ?? "dev";
  return getServerConfig(gameEnv);
}
export function getServerConfig(gameEnv: string) {
  switch (gameEnv) {
    case "dev":
      console.log("using dev server config");
      return new DevServerConfig();
    case "staging":
      console.log("using preprod server config");
      return preprodConfig;
    case "prod":
      console.log("using prod server config");
      return prodConfig;
    default:
      throw Error(`unsupported server configuration: ${gameEnv}`);
  }
}
