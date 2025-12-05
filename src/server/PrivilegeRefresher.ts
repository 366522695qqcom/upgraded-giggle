import { base64url } from "jose";
import { Logger } from "winston";
import {
  FailOpenPrivilegeChecker,
  PrivilegeChecker,
  PrivilegeCheckerImpl,
} from "./Privilege";

// Refreshes the privilege checker every 5 minutes.
// In offline mode, we'll use a fallback mechanism instead of failing
export class PrivilegeRefresher {
  private privilegeChecker: PrivilegeChecker | null = null;
  private failOpenPrivilegeChecker: PrivilegeChecker =
    new FailOpenPrivilegeChecker();

  private log: Logger;

  constructor(
    private endpoint: string,
    parentLog: Logger,
    private refreshInterval: number = 1000 * 60 * 3,
  ) {
    this.log = parentLog.child({ comp: "privilege-refresher" });
  }

  public async start() {
    this.log.info(
      `Starting privilege refresher with interval ${this.refreshInterval}`,
    );
    // Add some jitter to the initial load and the interval.
    setTimeout(() => this.loadPrivilegeChecker(), Math.random() * 1000);
    setInterval(
      () => this.loadPrivilegeChecker(),
      this.refreshInterval + Math.random() * 1000,
    );
  }

  public get(): PrivilegeChecker {
    return this.privilegeChecker ?? this.failOpenPrivilegeChecker;
  }

  private async loadPrivilegeChecker(): Promise<void> {
    this.log.info(`Loading privilege checker from ${this.endpoint}`);
    try {
      // 在离线模式下，直接使用回退机制而不尝试网络请求
      this.log.info("Offline mode: Using fallback privilege checker directly");
      this.useFallbackPrivilegeChecker();
      return;

      // 以下代码在离线模式下会被跳过
      /*
      // Try to fetch from endpoint first
      const response = await fetch(this.endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cosmeticsData = await response.json();
      const result = CosmeticsSchema.safeParse(cosmeticsData);

      if (!result.success) {
        throw new Error(`Invalid cosmetics data: ${result.error.message}`);
      }

      this.privilegeChecker = new PrivilegeCheckerImpl(
        result.data,
        base64url.decode,
      );
      this.log.info(`Privilege checker loaded successfully`);
      */
    } catch (error) {
      this.log.error(`Error in privilege checker loading:`, error);

      // 确保在任何错误情况下都使用回退机制
      try {
        this.useFallbackPrivilegeChecker();
      } catch (fallbackError) {
        this.log.error(
          `Failed to initialize fallback privilege checker:`,
          fallbackError,
        );
      }
    }
  }

  private useFallbackPrivilegeChecker(): void {
    // Create minimal cosmetics data for offline mode
    const fallbackCosmeticsData = {
      patterns: [],
      heads: [],
      flags: [],
      nameStyles: [],
    };

    // Create privilege checker with fallback data
    this.privilegeChecker = new PrivilegeCheckerImpl(
      fallbackCosmeticsData,
      base64url.decode,
    );

    this.log.info(
      `Fallback privilege checker initialized successfully for offline mode`,
    );
  }
}
