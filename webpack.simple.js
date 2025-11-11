import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

// 在ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/client/test-entry.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "static"),
    clean: false
  },
  // 简化配置，不使用TypeScript
  resolve: {
    extensions: [".js"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/client/index.html"
    })
  ],
  mode: "development"
};