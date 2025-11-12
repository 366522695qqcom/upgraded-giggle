<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="resources/images/OpenFrontLogoDark.svg">
    <source media="(prefers-color-scheme: light)" srcset="resources/images/OpenFrontLogo.svg">
    <img src="resources/images/OpenFrontLogo.svg" alt="OpenFrontIO Logo" width="300">
  </picture>
</p>

[OpenFront.io](https://openfront.io/) is an online real-time strategy game focused on territorial control and alliance building. Players compete to expand their territory, build structures, and form strategic alliances in various maps based on real-world geography.

This is a fork/rewrite of WarFront.io. Credit to https://github.com/WarFrontIO.

![CI](https://github.com/openfrontio/OpenFrontIO/actions/workflows/ci.yml/badge.svg)
[![Crowdin](https://badges.crowdin.net/openfront-mls/localized.svg)](https://crowdin.com/project/openfront-mls)
[![CLA assistant](https://cla-assistant.io/readme/badge/openfrontio/OpenFrontIO)](https://cla-assistant.io/openfrontio/OpenFrontIO)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Assets: CC BY-SA 4.0](https://img.shields.io/badge/Assets-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

## 🌟 Features

- **Real-time Strategy Gameplay**: Expand your territory and engage in strategic battles
- **Alliance System**: Form alliances with other players for mutual defense
- **Multiple Maps**: Play across various geographical regions including Europe, Asia, Africa, and more
- **Resource Management**: Balance your expansion with defensive capabilities
- **Cross-platform**: Play in any modern web browser

## 📋 Prerequisites

- [npm](https://www.npmjs.com/) (v10.9.2 or higher)
- A modern web browser (Chrome, Firefox, Edge, etc.)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/openfrontio/OpenFrontIO.git
   cd OpenFrontIO
   ```

2. **Install dependencies**

   ```bash
   npm i
   ```

## 🎮 Running the Game

### Development Mode

Run both the client and server in development mode with live reloading:

```bash
npm run dev
```

This will:

- Start the webpack dev server for the client
- Launch the game server with development settings
- Open the game in your default browser

### Client Only

To run just the client with hot reloading:

```bash
npm run start:client
```

### Server Only

To run just the server with development settings:

```bash
npm run start:server-dev
```

### Connecting to staging or production backends

Sometimes it's useful to connect to production servers when replaying a game, testing user profiles, purchases, or login flow.

To connect to staging api servers:

```bash
npm run dev:staging
```

To connect to production api servers:

```bash
npm run dev:prod
```

## 🛠️ Development Tools

- **Format code**:

  ```bash
  npm run format
  ```

- **Lint code**:

  ```bash
  npm run lint
  ```

- **Lint and fix code**:

  ```bash
  npm run lint:fix
  ```

- **Testing**
  ```bash
  npm test
  ```

## 🏗️ Project Structure

- `/src/client` - Frontend game client
- `/src/core` - Shared game logic
- `/src/server` - Backend game server
- `/resources` - Static assets (images, maps, etc.)

## 📝 License

This project is licensed under the terms found in the [LICENSE](LICENSE) file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Request to join the development [Discord](https://discord.gg/K9zernJB5z).
1. Fork the repository
1. Create your feature branch (`git checkout -b amazing-feature`)
1. Commit your changes (`git commit -m 'Add some amazing feature'`)
1. Push to the branch (`git push origin amazing-feature`)
1. Open a Pull Request

## 🌐 Translation

Translators are welcome! Please feel free to help translate into your language.
How to help?

1. Request to join the dev [Discord](https://discord.gg/K9zernJB5z) (in the application form, say you want to help translate)
1. Go to the project's Crowdin translation page: [https://crowdin.com/project/openfront-mls](https://crowdin.com/project/openfront-mls)
1. Login if you already have an account/ Sign up if you don't have one
1. Select the language you want to translate in/ If your language isn't on the list, click the "Request New Language" button and enter the language you want added there.
1. Translate the strings

### Project Governance

- The project maintainer ([evan](https://github.com/evanpelle)) has final authority on all code changes and design decisions
- All pull requests require maintainer approval before merging
- The maintainer reserves the right to reject contributions that don't align with the project's vision or quality standards

### Contribution Path for New Contributors

To ensure code quality and project stability, we use a progressive contribution system:

1. **New Contributors**: Limited to UI improvements and small bug fixes only

   - This helps you become familiar with the codebase
   - UI changes are easier to review and less likely to break core functionality
   - Small, focused PRs have a higher chance of being accepted

2. **Established Contributors**: After several successful PRs and demonstrating understanding of the codebase, you may work on more complex features

3. **Core Contributors**: Only those with extensive experience with the project may modify critical game systems

### How to Contribute Successfully

1. **Before Starting Work**:

   - Open an issue describing what you want to contribute
   - Wait for maintainer feedback before investing significant time
   - Small improvements can proceed directly to PR stage

2. **Code Quality Requirements**:

   - All code must be well-commented and follow existing style patterns
   - New features should not break existing functionality
   - Code should be thoroughly tested before submission
   - All code changes in src/core _MUST_ be tested.

3. **Pull Request Process**:

   - Keep PRs focused on a single feature or bug fix
   - Include screenshots for UI changes
   - Describe what testing you've performed
   - Be responsive to feedback and requested changes

4. **Testing Requirements**:
   - Verify your changes work as expected
   - Test on multiple systems/browsers if applicable
   - Document your testing process in the PR

### Communication

- Be respectful and constructive in all project interactions
- Questions are welcome, but please search existing issues first
- For major changes, discuss in an issue before starting work

### Final Notes

Remember that maintaining this project requires significant effort. The maintainer appreciates your contributions but must prioritize long-term project health and stability. Not all contributions will be accepted, and that's okay.

Thank you for helping make OpenFront better!
=======
# 战争前线 - 中文界面版 (WarFront-Chinese)

这是一个中文界面的战争策略游戏，基于React开发。游戏包含资源管理、建筑建造、军事防御等核心策略玩法。

## 功能特点

- **纯中文界面**：所有游戏元素均已本地化，提供流畅的中文游戏体验
- **资源系统**：金币、钢铁、水晶、稀土四种资源
- **建筑系统**：资源建筑、防御设施、特殊功能建筑、军事设施
- **游戏难度**：支持多种难度设置，从轻松到不可能
- **游戏模式**：支持自由对战和团队模式
- **AI对手**：可配置的AI机器人
- **游戏状态保存**：使用Cookie保存游戏进度

## 开始游戏

1. 克隆仓库：
```bash
git clone https://github.com/366522695qqcom/WarFront-Chinese.git
cd WarFront-Chinese
```

2. 安装依赖：
```bash
npm install
```

3. 运行开发服务器：
```bash
npm start
```

4. 访问 http://localhost:3000 开始游戏

## 游戏操作

- **选择地图**：在游戏开始界面选择地图类型
- **设置难度**：根据个人喜好调整游戏难度
- **选择模式**：自由对战或团队模式
- **配置机器人**：设置AI对手数量
- **特殊选项**：开启/关闭即时建造和无限资源

## 建筑类型

1. **资源与经济类**：城市、工厂、港口、太阳能农场、贸易枢纽、资源仓库
2. **防御与反制类**：防御岗、防空导弹、等离子炮塔、地下掩体
3. **特殊功能类**：间谍卫星、联盟大使馆、基因实验室、量子传送门
4. **高级军事设施**：导弹发射井、原子弹、核反应堆

## 技术栈

- React 18
- TypeScript
- Tailwind CSS (推测)
- Radix UI 组件库
- Lucide React 图标库

## 注意事项

- 游戏使用Cookie保存进度，请确保浏览器Cookie功能正常
- 游戏处于开发阶段，部分功能可能尚未完全实现
- 图片资源来自Unsplash，仅用于演示目的
