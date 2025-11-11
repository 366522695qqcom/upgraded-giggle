import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from 'url';
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

// 在ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取git commit hash
let gitCommit = "dev";
try {
  gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  console.error("Failed to get git commit hash");
}

export default async (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/client/test-entry.js",
    output: {
      publicPath: "/",
      filename: "bundle.js",
      path: path.resolve(__dirname, "static"),
      clean: false,
    },
    module: {
      rules: []
    },
    resolve: {
      extensions: [".js"]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/client/index.html",
        filename: "index.html"
      })
    ],
    cache: false,
  };
};
