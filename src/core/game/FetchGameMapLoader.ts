import { GameMapType } from "./Game";
import { GameMapLoader, MapData } from "./GameMapLoader";

export class FetchGameMapLoader implements GameMapLoader {
  private maps: Map<GameMapType, MapData>;

  public constructor(
    private readonly prefix: string,
    private readonly cacheBuster?: string,
  ) {
    this.maps = new Map<GameMapType, MapData>();
  }

  public getMapData(map: GameMapType): MapData {
    const cachedMap = this.maps.get(map);
    if (cachedMap) {
      return cachedMap;
    }

    const key = Object.keys(GameMapType).find(
      (k) => GameMapType[k as keyof typeof GameMapType] === map,
    );
    const fileName = key?.toLowerCase();

    if (!fileName) {
      throw new Error(`Unknown map: ${map}`);
    }

    const mapData = {
      mapBin: () => this.loadBinaryWithFallback(this.url(fileName, "map.bin")),
      map4xBin: () =>
        this.loadBinaryWithFallback(this.url(fileName, "map4x.bin")),
      map16xBin: () =>
        this.loadBinaryWithFallback(this.url(fileName, "map16x.bin")),
      manifest: () =>
        this.loadJsonWithFallback(this.url(fileName, "manifest.json")),
      webpPath: async () => this.url(fileName, "thumbnail.webp"),
    } satisfies MapData;

    this.maps.set(map, mapData);
    return mapData;
  }

  private url(map: string, path: string) {
    let url = `${this.prefix}/${map}/${path}`;

    if (this.cacheBuster) {
      url += `${url.includes("?") ? "&" : "?"}v=${this.cacheBuster}`;
    }

    return url;
  }

  // 离线模式支持：加载二进制数据，失败时返回默认数据
  private async loadBinaryWithFallback(url: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `Failed to load ${url}: ${response.statusText}, using fallback data for offline mode`,
        );
        // 从URL中提取地图名称
        const mapName = url.split("/").pop()?.split(".")[0] ?? "map";
        return this.getFallbackBinaryData(mapName);
      }

      const data = await response.arrayBuffer();
      return new Uint8Array(data);
    } catch (error) {
      console.warn(
        `Error loading ${url}, using fallback data for offline mode:`,
        error,
      );
      // 从URL中提取地图名称
      const mapName = url.split("/").pop()?.split(".")[0] ?? "map";
      return this.getFallbackBinaryData(mapName);
    }
  }

  // 离线模式支持：加载JSON数据，失败时返回默认manifest
  private async loadJsonWithFallback(url: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `Failed to load ${url}: ${response.statusText}, using fallback manifest for offline mode`,
        );
        return this.getFallbackManifest();
      }

      return response.json();
    } catch (error) {
      console.warn(
        `Error loading ${url}, using fallback manifest for offline mode:`,
        error,
      );
      return this.getFallbackManifest();
    }
  }

  // 返回一个最小的默认二进制数据，与manifest中定义的尺寸相匹配
  private getFallbackBinaryData(mapName: string): Uint8Array {
    // 根据地图名称返回正确大小的数据
    const manifest = this.getFallbackManifest();
    const mapData = manifest[mapName] ?? manifest.map;
    const size = mapData.width * mapData.height;
    return new Uint8Array(size).fill(0); // 返回与地图尺寸匹配的数据
  }

  // 返回默认的manifest数据
  private getFallbackManifest(): any {
    return {
      map: {
        height: 10,
        num_land_tiles: 100,
        width: 10,
      },
      map4x: {
        height: 5,
        num_land_tiles: 25,
        width: 5,
      },
      map16x: {
        height: 3,
        num_land_tiles: 9,
        width: 3,
      },
      name: "Offline Map",
    };
  }
}
