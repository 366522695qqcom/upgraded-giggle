import { Game, PlayerInfo, PlayerType } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PseudoRandom } from "../PseudoRandom";
import { GameID } from "../Schemas";
import { simpleHash } from "../Util";
import { SpawnExecution } from "./SpawnExecution";
import { BOT_NAME_PREFIXES, BOT_NAME_SUFFIXES } from "./utils/BotNames";

export class BotSpawner {
  private random: PseudoRandom;
  private bots: SpawnExecution[] = [];
  private gridSize = 60; // Grid size should be larger than the minimum distance (30)
  private spatialGrid: Map<string, SpawnExecution[]> = new Map();

  constructor(
    private gs: Game,
    gameID: GameID,
  ) {
    this.random = new PseudoRandom(simpleHash(gameID));
  }

  spawnBots(numBots: number): SpawnExecution[] {
    let tries = 0;
    while (this.bots.length < numBots) {
      if (tries > 10000) {
        console.log("too many retries while spawning bots, giving up");
        return this.bots;
      }
      const botName = this.randomBotName();
      const spawn = this.spawnBot(botName);
      if (spawn !== null) {
        this.bots.push(spawn);
        this.addToSpatialGrid(spawn);
      } else {
        tries++;
      }
    }
    return this.bots;
  }

  private addToSpatialGrid(spawn: SpawnExecution): void {
    const x = this.gs.x(spawn.tile);
    const y = this.gs.y(spawn.tile);
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    const key = `${gridX},${gridY}`;

    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, []);
    }
    this.spatialGrid.get(key)!.push(spawn);
  }

  spawnBot(botName: string): SpawnExecution | null {
    const tile = this.randTile();
    if (!this.gs.isLand(tile)) {
      return null;
    }

    const x = this.gs.x(tile);
    const y = this.gs.y(tile);

    // Check nearby grid cells for bots that might be too close
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);

    // Check current grid cell and all adjacent grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const gridBots = this.spatialGrid.get(key);

        if (gridBots) {
          for (const spawn of gridBots) {
            const spawnX = this.gs.x(spawn.tile);
            const spawnY = this.gs.y(spawn.tile);

            // Calculate manhattan distance
            if (Math.abs(spawnX - x) + Math.abs(spawnY - y) < 30) {
              return null;
            }
          }
        }
      }
    }

    return new SpawnExecution(
      new PlayerInfo(botName, PlayerType.Bot, null, this.random.nextID()),
      tile,
    );
  }

  private randomBotName(): string {
    const prefixIndex = this.random.nextInt(0, BOT_NAME_PREFIXES.length);
    const suffixIndex = this.random.nextInt(0, BOT_NAME_SUFFIXES.length);
    return `${BOT_NAME_PREFIXES[prefixIndex]} ${BOT_NAME_SUFFIXES[suffixIndex]}`;
  }

  private randTile(): TileRef {
    return this.gs.ref(
      this.random.nextInt(0, this.gs.width()),
      this.random.nextInt(0, this.gs.height()),
    );
  }
}
