import { execSync } from "child_process";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";

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

export default (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: argv.mode ?? "development",
    entry: "./src/client/Main.ts",
    output: {
      publicPath: "/",
      filename: "bundle.js",
      path: path.resolve(__dirname, "static"),
      clean: true, // 确保每次构建都清理输出目录
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true, // 只进行转译，不进行类型检查
                compilerOptions: {
                  sourceMap: !isProduction,
                  noEmitOnError: false,
                },
              },
            },
          ],
          exclude: /node_modules/,
        },
        // 处理CSS和样式文件
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        // 处理图像和其他资源文件
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "assets/",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "pixi.js": "pixi.js",
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/client/index.html",
        filename: "index.html",
      }),
      // 定义环境变量
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(argv.mode ?? "development"),
          GIT_COMMIT: JSON.stringify(gitCommit),
        },
      }),
    ],
    devtool: isProduction ? false : "source-map",
    cache: { type: "filesystem" }, // 启用文件系统缓存以加快构建速度
  };
};
