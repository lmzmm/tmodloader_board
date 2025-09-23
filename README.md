# tModLoader 服务器管理面板

一个基于 Spring Boot 的 Web 应用，用于管理 tModLoader 服务器。该面板提供了一个直观的用户界面，可以轻松上传模组、创建世界和管理 Terraria 模组服务器。

## 功能特性

- **模组管理**: 通过 Web 界面上传和管理 tModLoader 模组
- **世界创建**: 图形化向导引导创建新的 Terraria 世界
- **服务器控制**: 启动、停止服务器，发送广播消息
- **玩家管理**: 查看在线玩家列表，踢出或封禁玩家
- **实时进度**: 世界创建过程中的实时进度更新

## 技术栈

- 后端: Java + Spring Boot 3.5.4
- 前端: HTML5 + CSS3 + JavaScript (原生)
- 构建工具: Maven
- Java 版本: 17

## 快速开始

### 环境要求

- Java 17 或更高版本
- Maven 3.6+ (用于构建项目)
- tModLoader 已安装

### 安装步骤

1. 克隆仓库:
   ```
   git clone <repository-url>
   cd tmodloader_board
   ```

2. 构建项目:
   ```
   mvn clean package
   ```

3. 运行应用:
   ```
   java -jar target/tmodloader_board-0.0.1-SNAPSHOT.jar
   ```

4. 访问应用:
   打开浏览器并访问 `http://localhost:8080`

## 使用指南

### 创建服务器

1. 点击左侧导航栏的"创建服务器"
2. 上传所需的模组文件(.tmod)
3. 选择或上传世界文件(.wld)
4. 配置服务器设置(最大玩家数、端口、密码等)
5. 启动服务器

### 创建新世界

1. 点击左侧导航栏的"创建世界"
2. 选择要启用的模组
3. 选择世界大小(小、中、大、超级大)
4. 选择世界模式(普通、专家、大师、旅途)
5. 选择腐化类型(腐化之地或猩红之地)
6. 输入世界名称
7. 确认设置并开始创建世界

### 管理服务器

1. 点击左侧导航栏的"服务器列表"
2. 查看运行中的服务器
3. 使用控制面板:
   - 停止服务器
   - 发送广播消息
   - 管理玩家(踢出/封禁)

## API 接口

### 服务器创建相关
- `POST /create/uploadmod` - 上传模组文件
- `POST /create/uploadworld` - 上传世界文件
- `POST /create/create` - 启动服务器
- `GET /create/modlist` - 获取模组列表
- `GET /create/worldlist` - 获取世界列表

### 世界创建相关
- `POST /create/startworldcreator` - 启动世界创建进程
- `GET /create/worldprogress-stream` - 获取世界创建进度(SSE)
- `POST /create/cancelworldcreation` - 取消世界创建
- `POST /create/worldconfig` - 发送世界配置选项

### 服务器管理相关
- `POST /manage/stop` - 停止服务器
- `POST /manage/broadcast` - 发送广播消息
- `POST /manage/kickOrban` - 踢出或封禁玩家
- `GET /manage/serverlist` - 获取服务器列表
- `GET /manage/playerlist` - 获取玩家列表

## 项目结构

```
src/
├── main/
│   ├── java/
│   │   └── com/tModLoader_Board/
│   │       ├── Controller/     # REST 控制器
│   │       ├── DTO/            # 数据传输对象
│   │       ├── Service/        # 业务逻辑层
│   │       └── TmodloaderBoardApplication.java  # 应用入口
│   └── resources/
│       ├── static/             # 静态资源文件
│       │   ├── css/            # 样式文件
│       │   └── js/             # JavaScript 文件
│       └── application.yml     # 配置文件
└── test/                       # 测试代码
```


## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。