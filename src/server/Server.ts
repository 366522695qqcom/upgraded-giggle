import cluster from "cluster";
import * as dotenv from "dotenv";
import { GameEnv } from "../core/configuration/Config";
import { getServerConfigFromServer } from "../core/configuration/ConfigLoader";
import { Cloudflare, TunnelConfig } from "./Cloudflare";
import { startMaster } from "./Master";
import { startWorker } from "./Worker";

const config = getServerConfigFromServer();

dotenv.config();

// Main entry point of the application
async function main() {
  // Check if this is the primary (master) process
  if (cluster.isPrimary) {
    if (config.env() !== GameEnv.Dev) {
      await setupTunnels();
    }
    console.log("Starting master process...");
    await startMaster();
  } else {
    // This is a worker process
    console.log("Starting worker process...");
    await startWorker();
  }
}

// Start the application
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

async function setupTunnels() {
  // Check if tunnel creation should be skipped
  const cfAccountId = config.cloudflareAccountId();
  const cfApiToken = config.cloudflareApiToken();

  // Skip tunnel creation if either value is "skip-tunnel"
  if (cfAccountId === "skip-tunnel" || cfApiToken === "skip-tunnel") {
    console.log("Skipping Cloudflare tunnel creation as requested");
    console.log("Server will be available without Cloudflare tunnel");
    return;
  }

  const cloudflare = new Cloudflare(
    cfAccountId,
    cfApiToken,
    config.cloudflareConfigPath(),
    config.cloudflareCredsPath(),
  );

  const domainToService = new Map<string, string>().set(
    config.subdomain(),
    // TODO: change to 3000 when we have a proper tunnel setup.
    `http://localhost:80`,
  );

  for (let i = 0; i < config.numWorkers(); i++) {
    domainToService.set(
      `w${i}-${config.subdomain()}`,
      `http://localhost:${3000 + i + 1}`,
    );
  }

  if (!(await cloudflare.configAlreadyExists())) {
    await cloudflare.createTunnel({
      subdomain: config.subdomain(),
      domain: config.domain(),
      subdomainToService: domainToService,
    } as TunnelConfig);
  } else {
    console.log("Config already exists, skipping tunnel creation");
  }

  await cloudflare.startCloudflared();
}
