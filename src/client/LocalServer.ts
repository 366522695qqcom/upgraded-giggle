import { z } from "zod";
import { EventBus } from "../core/EventBus";
import {
  AllPlayersStats,
  ClientMessage,
  ClientSendWinnerMessage,
  Intent,
  PartialGameRecordSchema,
  PlayerRecord,
  ServerMessage,
  ServerStartGameMessage,
  Turn,
} from "../core/Schemas";
import {
  createPartialGameRecord,
  decompressGameRecord,
  getClanTag,
  replacer,
} from "../core/Util";
import { LobbyConfig } from "./ClientGameRunner";
import { ReplaySpeedChangeEvent } from "./InputHandler";
import { getPersistentID } from "./Main";
import { defaultReplaySpeedMultiplier } from "./utilities/ReplaySpeedMultiplier";

export class LocalServer {
  // All turns from the game record on replay.
  private replayTurns: Turn[] = [];

  private turns: Turn[] = [];

  private intents: Intent[] = [];
  private startedAt: number;

  private paused = false;
  private replaySpeedMultiplier = defaultReplaySpeedMultiplier;

  private winner: ClientSendWinnerMessage | null = null;
  private allPlayersStats: AllPlayersStats = {};

  private turnsExecuted = 0;
  private turnStartTime = 0;

  private turnCheckInterval: NodeJS.Timeout;

  constructor(
    private lobbyConfig: LobbyConfig,
    private clientConnect: () => void,
    private clientMessage: (message: ServerMessage) => void,
    private isReplay: boolean,
    private eventBus: EventBus,
  ) {
    // 添加null检查，确保回调函数存在
    if (!clientMessage) {
      console.error("clientMessage callback is null or undefined");
      this.clientMessage = () => console.warn("clientMessage was null");
    }
    if (!clientConnect) {
      console.error("clientConnect callback is null or undefined");
      this.clientConnect = () => console.warn("clientConnect was null");
    }
  }

  start() {
    this.turnCheckInterval = setInterval(() => {
      const turnIntervalMs =
        this.lobbyConfig.serverConfig.turnIntervalMs() *
        this.replaySpeedMultiplier;

      if (
        this.turnsExecuted === this.turns.length &&
        Date.now() > this.turnStartTime + turnIntervalMs
      ) {
        this.turnStartTime = Date.now();
        // End turn on the server means the client will start processing the turn.
        this.endTurn();
      }
    }, 5);

    this.eventBus.on(ReplaySpeedChangeEvent, (event) => {
      this.replaySpeedMultiplier = event.replaySpeedMultiplier;
    });

    this.startedAt = Date.now();
    // 添加null检查，确保安全调用回调
    if (this.clientConnect) {
      this.clientConnect();
    }
    if (this.lobbyConfig.gameRecord) {
      this.replayTurns = decompressGameRecord(
        this.lobbyConfig.gameRecord,
      ).turns;
    }
    if (this.lobbyConfig.gameStartInfo === undefined) {
      throw new Error("missing gameStartInfo");
    }
    // 添加null检查，确保安全调用回调
    if (this.clientMessage) {
      try {
        this.clientMessage({
          type: "start",
          gameStartInfo: this.lobbyConfig.gameStartInfo,
          turns: [],
        } satisfies ServerStartGameMessage);
      } catch (error) {
        console.error("Error in clientMessage callback during start:", error);
      }
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  onMessage(clientMsg: ClientMessage) {
    if (clientMsg.type === "intent") {
      if (this.lobbyConfig.gameRecord) {
        // If we are replaying a game, we don't want to process intents
        return;
      }
      if (this.paused) {
        return;
      }
      this.intents.push(clientMsg.intent);
    }
    if (clientMsg.type === "hash") {
      if (!this.lobbyConfig.gameRecord) {
        if (clientMsg.turnNumber % 100 === 0) {
          // In singleplayer, only store hash every 100 turns to reduce size of game record.
          this.turns[clientMsg.turnNumber].hash = clientMsg.hash;
        }
        return;
      }
      // If we are replaying a game then verify hash.
      const archivedHash = this.replayTurns[clientMsg.turnNumber].hash;
      if (!archivedHash) {
        console.warn(
          `no archived hash found for turn ${clientMsg.turnNumber}, client hash: ${clientMsg.hash}`,
        );
        return;
      }
      if (archivedHash !== clientMsg.hash) {
        console.error(
          `desync detected on turn ${clientMsg.turnNumber}, client hash: ${clientMsg.hash}, server hash: ${archivedHash}`,
        );
        this.clientMessage({
          type: "desync",
          turn: clientMsg.turnNumber,
          correctHash: archivedHash,
          clientsWithCorrectHash: 0,
          totalActiveClients: 1,
          yourHash: clientMsg.hash,
        });
      } else {
        console.log(
          `hash verified on turn ${clientMsg.turnNumber}, client hash: ${clientMsg.hash}, server hash: ${archivedHash}`,
        );
      }
    }
    if (clientMsg.type === "winner") {
      this.winner = clientMsg;
      this.allPlayersStats = clientMsg.allPlayersStats;
    }
  }

  // This is so the client can tell us when it finished processing the turn.
  public turnComplete() {
    this.turnsExecuted++;
  }

  // endTurn in this context means the server has collected all the intents
  // and will send the turn to the client.
  private endTurn() {
    if (this.paused) {
      return;
    }
    if (this.replayTurns.length > 0) {
      if (this.turns.length >= this.replayTurns.length) {
        this.endGame();
        return;
      }
      this.intents = this.replayTurns[this.turns.length].intents;
    }
    const pastTurn: Turn = {
      turnNumber: this.turns.length,
      intents: this.intents,
    };
    this.turns.push(pastTurn);
    this.intents = [];
    this.clientMessage({
      type: "turn",
      turn: pastTurn,
    });
  }

  public endGame() {
    console.log("local server ending game");
    clearInterval(this.turnCheckInterval);
    if (this.isReplay) {
      return;
    }
    const players: PlayerRecord[] = [
      {
        persistentID: getPersistentID(),
        username: this.lobbyConfig.playerName,
        clientID: this.lobbyConfig.clientID,
        stats: this.allPlayersStats[this.lobbyConfig.clientID],
        cosmetics: this.lobbyConfig.gameStartInfo?.players[0].cosmetics,
        clanTag: getClanTag(this.lobbyConfig.playerName) ?? undefined,
      },
    ];
    if (this.lobbyConfig.gameStartInfo === undefined) {
      throw new Error("missing gameStartInfo");
    }
    const record = createPartialGameRecord(
      this.lobbyConfig.gameStartInfo.gameID,
      this.lobbyConfig.gameStartInfo.config,
      players,
      this.turns,
      this.startedAt,
      Date.now(),
      this.winner?.winner,
    );

    const result = PartialGameRecordSchema.safeParse(record);
    if (!result.success) {
      const error = z.prettifyError(result.error);
      console.error("Error parsing game record", error);
      return;
    }
    const jsonString = JSON.stringify(result.data, replacer);

    // 不使用gzip压缩直接发送JSON数据
    return fetch(`/api/archive_singleplayer_game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonString,
      keepalive: true, // Ensures request completes even if page unloads
    })
      .then((response) => {
        if (!response.ok) {
          console.error(
            `Failed to archive singleplayer game: HTTP ${response.status}`,
          );
          return response.text().then((text) => {
            console.error(`Response body: ${text}`);
          });
        }
        console.log("Successfully archived singleplayer game");
      })
      .catch((error) => {
        console.error("Failed to archive singleplayer game:", error);
      });
  }
}
