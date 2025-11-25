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
- 前端: HTML5 + CSS3 + JavaScript 
- 构建工具: Maven
- Java 版本: 17

## 快速开始

### 环境要求

- Java 17 或更高版本
- tModLoader 已安装
- tmux 已安装

### 安装步骤

#### 方法一：下载预编译的 JAR 包（推荐）

1. 从 [GitHub 发行版页面](https://github.com/lmzmm/tmodloader_board/releases/tag/1.2) 下载最新版本的 JAR 包

2. 运行应用:
   ```
   java -jar tmodloader_board-0.0.1-SNAPSHOT.jar
   ```

#### 方法二：从源码构建

1. 克隆仓库:
   ```
   git clone 
   cd tmodloader_board
   ```

2. 构建项目:
   ```
   mvn clean package
   ```

3. 运行应用:
   ```
   mvn spring-boot:run
   ```

4. 访问应用:
   打开浏览器并访问 `http://localhost:8088`

## 项目目录结构

```
tmodloader_board/
├── .mvn/wrapper/               # Maven Wrapper 相关文件
├── src/                        # 源代码目录
│   ├── main/
│   │   ├── java/
│   │   │   └── com/tModLoader_Board/
│   │   │       ├── Controller/     # REST 控制器
│   │   │       ├── DTO/            # 数据传输对象
│   │   │       ├── Service/        # 业务逻辑层
│   │   │       └── TmodloaderBoardApplication.java  # 应用入口
│   │   └── resources/
│   │       ├── static/             # 静态资源文件
│   │       │   ├── css/            # 样式文件
│   │       │   └── js/             # JavaScript 文件
│   │       └── application.yml     # 配置文件
│   └── test/                       # 测试代码
├── target/                         # 编译输出目录（构建后生成）
├── pom.xml                         # Maven 项目配置文件
├── mvnw/mvnw.cmd                   # Maven Wrapper 执行脚本
└── README.md                       # 项目说明文档
```

## 配置说明

### 应用配置
项目的主要配置位于 `src/main/resources/application.yml`:
- 默认端口: 8088

可以通过以下方式修改端口:
1. 运行时指定参数: `--server.port=端口号`
2. 设置环境变量: `SERVER_PORT=端口号`

### 目录
确保存在以下目录:

mod和存档目录:`~/.local/share/Terraria/tModLoader`（此目录为tmodloader默认目录，只要运行过就会自动创建）

tmodloader安装目录:`~/tmodloader`



如果您的 tModLoader 安装在其他位置，需要相应调整代码中的路径引用。

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
3. 选择世界大小(小、中、大)
4. 选择世界模式(普通、专家、大师、旅程)
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


欢迎提交 Issue 和 Pull Request 来改进这个项目。