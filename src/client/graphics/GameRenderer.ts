import { EventBus } from "../../core/EventBus";
import { GameView } from "../../core/game/GameView";
import { UserSettings } from "../../core/game/UserSettings";
import { GameStartingModal } from "../GameStartingModal";
import { RefreshGraphicsEvent as RedrawGraphicsEvent } from "../InputHandler";
import { TransformHandler } from "./TransformHandler";
import { UIState } from "./UIState";
import { AdTimer } from "./layers/AdTimer";
import { AlertFrame } from "./layers/AlertFrame";
import { BuildMenu } from "./layers/BuildMenu";
import { ChatDisplay } from "./layers/ChatDisplay";
import { ChatModal } from "./layers/ChatModal";
import { ControlPanel } from "./layers/ControlPanel";
import { EmojiTable } from "./layers/EmojiTable";
import { EventsDisplay } from "./layers/EventsDisplay";
import { FxLayer } from "./layers/FxLayer";
import { GameLeftSidebar } from "./layers/GameLeftSidebar";
import { GameRightSidebar } from "./layers/GameRightSidebar";
import { HeadsUpMessage } from "./layers/HeadsUpMessage";
import { Layer } from "./layers/Layer";
import { Leaderboard } from "./layers/Leaderboard";
import { MainRadialMenu } from "./layers/MainRadialMenu";
import { MultiTabModal } from "./layers/MultiTabModal";
import { NameLayer } from "./layers/NameLayer";
import { PerformanceOverlay } from "./layers/PerformanceOverlay";
import { PlayerInfoOverlay } from "./layers/PlayerInfoOverlay";
import { PlayerPanel } from "./layers/PlayerPanel";
import { RailroadLayer } from "./layers/RailroadLayer";
import { ReplayPanel } from "./layers/ReplayPanel";
import { SettingsModal } from "./layers/SettingsModal";
import { SpawnTimer } from "./layers/SpawnTimer";
import { StructureIconsLayer } from "./layers/StructureIconsLayer";
import { StructureLayer } from "./layers/StructureLayer";
import { TeamStats } from "./layers/TeamStats";
import { TerrainLayer } from "./layers/TerrainLayer";
import { TerritoryLayer } from "./layers/TerritoryLayer";
import { UILayer } from "./layers/UILayer";
import { UnitDisplay } from "./layers/UnitDisplay";
import { UnitLayer } from "./layers/UnitLayer";
import { WinModal } from "./layers/WinModal";

export function createRenderer(
  canvas: HTMLCanvasElement,
  game: GameView,
  eventBus: EventBus,
): GameRenderer {
  const transformHandler = new TransformHandler(game, eventBus, canvas);
  const userSettings = new UserSettings();

  const uiState = { attackRatio: 20, ghostStructure: null } as UIState;

  //hide when the game renders
  const startingModal = document.querySelector(
    "game-starting-modal",
  ) as GameStartingModal;
  if (startingModal && startingModal instanceof GameStartingModal) {
    startingModal.hide();
  } else {
    console.error("GameStartingModal element not found in the DOM");
  }

  // TODO maybe append this to document instead of querying for them?
  const emojiTable = document.querySelector("emoji-table") as EmojiTable;
  if (emojiTable && emojiTable instanceof EmojiTable) {
    emojiTable.transformHandler = transformHandler;
    emojiTable.game = game;
    emojiTable.initEventBus(eventBus);
  } else {
    console.error("EmojiTable element not found in the DOM");
  }

  const buildMenu = document.querySelector("build-menu") as BuildMenu;
  if (buildMenu && buildMenu instanceof BuildMenu) {
    buildMenu.game = game;
    buildMenu.eventBus = eventBus;
    buildMenu.transformHandler = transformHandler;
  } else {
    console.error("BuildMenu element not found in the DOM");
  }

  const leaderboard = document.querySelector("leader-board") as Leaderboard;
  if (leaderboard && leaderboard instanceof Leaderboard) {
    leaderboard.eventBus = eventBus;
    leaderboard.game = game;
  } else {
    console.error("LeaderBoard element not found in the DOM");
  }

  const gameLeftSidebar = document.querySelector(
    "game-left-sidebar",
  ) as GameLeftSidebar;
  if (gameLeftSidebar && gameLeftSidebar instanceof GameLeftSidebar) {
    gameLeftSidebar.game = game;
  } else {
    console.error("GameLeftSidebar element not found in the DOM");
  }

  const teamStats = document.querySelector("team-stats") as TeamStats;
  if (teamStats && teamStats instanceof TeamStats) {
    teamStats.eventBus = eventBus;
    teamStats.game = game;
  } else {
    console.error("TeamStats element not found in the DOM");
  }

  const controlPanel = document.querySelector("control-panel") as ControlPanel;
  if (controlPanel && controlPanel instanceof ControlPanel) {
    controlPanel.eventBus = eventBus;
    controlPanel.uiState = uiState;
    controlPanel.game = game;
  } else {
    console.error("ControlPanel element not found in the DOM");
  }

  const eventsDisplay = document.querySelector(
    "events-display",
  ) as EventsDisplay;
  if (eventsDisplay && eventsDisplay instanceof EventsDisplay) {
    eventsDisplay.eventBus = eventBus;
    eventsDisplay.game = game;
  } else {
    console.error("events display not found");
  }

  const chatDisplay = document.querySelector("chat-display") as ChatDisplay;
  if (chatDisplay && chatDisplay instanceof ChatDisplay) {
    chatDisplay.eventBus = eventBus;
    chatDisplay.game = game;
  } else {
    console.error("chat display not found");
  }

  const playerInfo = document.querySelector(
    "player-info-overlay",
  ) as PlayerInfoOverlay;
  if (playerInfo && playerInfo instanceof PlayerInfoOverlay) {
    playerInfo.eventBus = eventBus;
    playerInfo.transform = transformHandler;
    playerInfo.game = game;
  } else {
    console.error("player info overlay not found");
  }

  const winModal = document.querySelector("win-modal") as WinModal;
  if (winModal && winModal instanceof WinModal) {
    winModal.eventBus = eventBus;
    winModal.game = game;
  } else {
    console.error("win modal not found");
  }

  const replayPanel = document.querySelector("replay-panel") as ReplayPanel;
  if (replayPanel && replayPanel instanceof ReplayPanel) {
    replayPanel.eventBus = eventBus;
    replayPanel.game = game;
  } else {
    console.error("replay panel not found");
  }

  const gameRightSidebar = document.querySelector(
    "game-right-sidebar",
  ) as GameRightSidebar;
  if (gameRightSidebar && gameRightSidebar instanceof GameRightSidebar) {
    gameRightSidebar.game = game;
    gameRightSidebar.eventBus = eventBus;
  } else {
    console.error("Game Right bar not found");
  }

  const settingsModal = document.querySelector(
    "settings-modal",
  ) as SettingsModal;
  if (settingsModal && settingsModal instanceof SettingsModal) {
    settingsModal.userSettings = userSettings;
    settingsModal.eventBus = eventBus;
  } else {
    console.error("settings modal not found");
  }

  const unitDisplay = document.querySelector("unit-display") as UnitDisplay;
  if (unitDisplay && unitDisplay instanceof UnitDisplay) {
    unitDisplay.game = game;
    unitDisplay.eventBus = eventBus;
    unitDisplay.uiState = uiState;
  } else {
    console.error("unit display not found");
  }

  const playerPanel = document.querySelector("player-panel") as PlayerPanel;
  if (playerPanel && playerPanel instanceof PlayerPanel) {
    playerPanel.g = game;
    playerPanel.initEventBus(eventBus);
    playerPanel.emojiTable = emojiTable;
    playerPanel.uiState = uiState;
  } else {
    console.error("player panel not found");
  }

  const chatModal = document.querySelector("chat-modal") as ChatModal;
  if (chatModal && chatModal instanceof ChatModal) {
    chatModal.g = game;
    chatModal.initEventBus(eventBus);
  } else {
    console.error("chat modal not found");
  }

  const multiTabModal = document.querySelector(
    "multi-tab-modal",
  ) as MultiTabModal;
  if (multiTabModal && multiTabModal instanceof MultiTabModal) {
    multiTabModal.game = game;
  } else {
    console.error("multi-tab modal not found");
  }

  const headsUpMessage = document.querySelector(
    "heads-up-message",
  ) as HeadsUpMessage;
  if (headsUpMessage && headsUpMessage instanceof HeadsUpMessage) {
    headsUpMessage.game = game;
  } else {
    console.error("heads-up message not found");
  }

  const structureLayer = new StructureLayer(game, eventBus, transformHandler);

  const performanceOverlay = document.querySelector(
    "performance-overlay",
  ) as PerformanceOverlay;
  if (performanceOverlay && performanceOverlay instanceof PerformanceOverlay) {
    performanceOverlay.eventBus = eventBus;
    performanceOverlay.userSettings = userSettings;
  } else {
    console.error("performance overlay not found");
  }

  const alertFrame = document.querySelector("alert-frame") as AlertFrame;
  if (alertFrame && alertFrame instanceof AlertFrame) {
    alertFrame.game = game;
  } else {
    console.error("alert frame not found");
  }

  const spawnTimer = document.querySelector("spawn-timer") as SpawnTimer;
  if (spawnTimer && spawnTimer instanceof SpawnTimer) {
    spawnTimer.game = game;
    spawnTimer.transformHandler = transformHandler;
  } else {
    console.error("spawn timer not found");
  }

  // When updating these layers please be mindful of the order.
  // Try to group layers by the return value of shouldTransform.
  // Not grouping the layers may cause excessive calls to context.save() and context.restore().
  // Only add non-null layers to the array to avoid runtime errors.
  const layers: Layer[] = [
    new TerrainLayer(game, transformHandler),
    new TerritoryLayer(game, eventBus, transformHandler, userSettings),
    new RailroadLayer(game, transformHandler),
    structureLayer,
    new UnitLayer(game, eventBus, transformHandler),
    new FxLayer(game),
    new UILayer(game, eventBus, transformHandler),
    new StructureIconsLayer(game, eventBus, uiState, transformHandler),
    new NameLayer(game, transformHandler, eventBus),
    eventsDisplay, // This is checked above
    chatDisplay, // This is checked above
    buildMenu, // This is checked above
    new MainRadialMenu(
      eventBus,
      game,
      transformHandler,
      emojiTable as EmojiTable,
      buildMenu,
      uiState,
      playerPanel,
    ),
    spawnTimer, // This is checked above
    leaderboard, // This is checked above
    gameLeftSidebar, // This is checked above
    unitDisplay, // This is checked above
    gameRightSidebar, // This is checked above
    controlPanel, // This is checked above
    playerInfo, // This is checked above
    winModal, // This is checked above
    replayPanel, // This is checked above
    settingsModal, // This is checked above
    teamStats, // This is checked above
    playerPanel, // This is checked above
    headsUpMessage, // This is checked above
    multiTabModal, // This is checked above
    new AdTimer(game),
    alertFrame, // This is checked above
    performanceOverlay, // This is checked above
  ].filter((layer) => layer !== null) as Layer[];

  return new GameRenderer(
    game,
    eventBus,
    canvas,
    transformHandler,
    uiState,
    layers,
    performanceOverlay,
  );
}

export class GameRenderer {
  private context: CanvasRenderingContext2D;

  constructor(
    private game: GameView,
    private eventBus: EventBus,
    private canvas: HTMLCanvasElement,
    public transformHandler: TransformHandler,
    public uiState: UIState,
    private layers: Layer[],
    private performanceOverlay: PerformanceOverlay | null,
  ) {
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("2d context not supported");
    this.context = context;
  }

  initialize() {
    this.eventBus.on(RedrawGraphicsEvent, () => this.redraw());
    this.layers.forEach((l) => l.init?.());

    document.body.appendChild(this.canvas);
    window.addEventListener("resize", () => this.resizeCanvas());
    this.resizeCanvas();

    //show whole map on startup
    this.transformHandler.centerAll(0.9);

    let rafId = requestAnimationFrame(() => this.renderGame());
    this.canvas.addEventListener("contextlost", () => {
      cancelAnimationFrame(rafId);
    });
    this.canvas.addEventListener("contextrestored", () => {
      this.redraw();
      rafId = requestAnimationFrame(() => this.renderGame());
    });
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.transformHandler.updateCanvasBoundingRect();
    //this.redraw()
  }

  redraw() {
    this.layers.forEach((l) => {
      if (l.redraw) {
        l.redraw();
      }
    });
  }

  renderGame() {
    const start = performance.now();
    // Set background
    this.context.fillStyle = this.game
      .config()
      .theme()
      .backgroundColor()
      .toHex();
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const handleTransformState = (
      needsTransform: boolean,
      active: boolean,
    ): boolean => {
      if (needsTransform && !active) {
        this.context.save();
        this.transformHandler.handleTransform(this.context);
        return true;
      } else if (!needsTransform && active) {
        this.context.restore();
        return false;
      }
      return active;
    };

    let isTransformActive = false;

    for (const layer of this.layers) {
      const needsTransform = layer.shouldTransform?.() ?? false;
      isTransformActive = handleTransformState(
        needsTransform,
        isTransformActive,
      );
      layer.renderLayer?.(this.context);
    }
    handleTransformState(false, isTransformActive); // Ensure context is clean after rendering
    this.transformHandler.resetChanged();

    requestAnimationFrame(() => this.renderGame());
    const duration = performance.now() - start;

    // Only update performance metrics if performanceOverlay exists
    if (this.performanceOverlay) {
      this.performanceOverlay.updateFrameMetrics(duration);
    }

    if (duration > 50) {
      console.warn(
        `tick ${this.game.ticks()} took ${duration}ms to render frame`,
      );
    }
  }

  tick() {
    this.layers.forEach((l) => l.tick?.());
  }

  resize(width: number, height: number): void {
    this.canvas.width = Math.ceil(width / window.devicePixelRatio);
    this.canvas.height = Math.ceil(height / window.devicePixelRatio);
  }
}
