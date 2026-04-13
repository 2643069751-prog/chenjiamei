# 声优资料库 (Seiyuu Database)

> 面向游戏项目组的声优资料参考工具

## 快速开始

### 1. 启动本地服务器

因为浏览器安全策略（CORS），直接双击 `index.html` 无法加载 JSON 数据。需要一个本地 HTTP 服务器：

**方法一：Python（推荐）**
```bash
cd seiyu-database
python -m http.server 8080
```
然后访问 `http://localhost:8080`

**方法二：VS Code Live Server 插件**
1. 安装 Live Server 插件
2. 右键 `index.html` → Open with Live Server

**方法三：Node.js**
```bash
npx serve seiyu-database
```

### 2. 内网部署

将整个 `seiyu-database` 文件夹放到任何 Web 服务器上即可：

- **Nginx**: 复制到 `html/` 目录下
- **Apache**: 复制到 `htdocs/` 目录下
- **IIS**: 在 IIS 管理器中添加网站，指向该目录

团队成员通过 `http://服务器IP/seiyu-database/` 访问。

---

## 项目结构

```
seiyu-database/
├── index.html              # 主页面（SPA 单页应用）
├── css/
│   └── style.css           # 样式表
├── js/
│   └── app.js              # 前端逻辑
├── data/
│   └── seiyuu-data.json    # ★ 声份数据文件（核心）
├── assets/
│   ├── avatars/            # 声优头像图片
│   │   ├── bian-jiang.jpg  # 以声优id命名
│   │   └── ...
│   └── audio/              # 语音 Demo 文件
│       ├── bian-jiang-libai.mp3
│       └── ...
└── README.md               # 本文件
```

---

## 数据维护

### 编辑声优信息

**只需编辑一个文件：`data/seiyuu-data.json`**

修改后保存，刷新页面即可看到更新（无需重启服务器）。

### JSON 数据结构

```json
{
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2026-04-10",
    "description": "国内声优资料库数据文件"
  },
  "filters": {
    "gender": ["男", "女"],
    "voiceTypes": ["少年音", "青年音", "御姐音", ...],
    "tags": ["王者荣耀", "原神", "动画配音", ...]
  },
  "seiyuus": [
    {
      "id": "唯一英文ID（用于URL和文件命名）",
      "name": "声优姓名",
      "gender": "男 或 女",
      "avatar": "assets/avatars/xxx.jpg（可留空）",
      "studio": "所属工作室（可留空字符串）",
      "voiceTypes": ["声线类型1", "声线类型2"],
      "tags": ["标签1", "标签2"],
      "bio": "个人简介（一段话）",
      "works": [
        {
          "character": "角色名",
          "work": "作品名",
          "type": "类型：游戏/动画/电视剧/广播剧/电影"
        }
      ],
      "audioSamples": [
        {
          "title": "语音标题",
          "desc": "语音描述",
          "category": "声线分类（如：温柔/霸气/活泼）",
          "file": "assets/audio/xxx.mp3（音频文件路径）"
        }
      ]
    }
  ]
}
```

### 添加新声优

在 `seiyuus` 数组中添加一个新对象，确保：

1. **`id`** 唯一，建议用拼音（如 `zhang-san`）
2. **`voiceTypes`** 必须使用 `filters.voiceTypes` 中已有的值（或先在那里添加新值）
3. **`tags`** 必须使用 `filters.tags` 中已有的值（或先在那里添加新值）
4. **`avatar`** 可留空，会显示性别符号；填了路径则显示头像
5. **`audioSamples`** 可以为空数组 `[]`

### 添加新的声线类型或标签

在 `filters` 对象中添加新值即可，前端会自动渲染筛选按钮：

```json
"filters": {
  "voiceTypes": ["少年音", "青年音", "新声线类型"],
  "tags": ["王者荣耀", "新标签"]
}
```

### 音频文件管理

1. 将 MP3 文件放入 `assets/audio/` 目录
2. 文件名建议格式：`声优id-角色名.mp3`（如 `bian-jiang-libai.mp3`）
3. 建议单条音频控制在 **5MB 以内**
4. 使用 **MP3 格式**，兼容性最好
5. 建议采样率 44.1kHz，比特率 128-320kbps

> 音频采用 HTML5 Audio 流式加载（`preload="metadata"`），边下载边播放，不会一次性全部加载。

### 头像图片

1. 将图片放入 `assets/avatars/` 目录
2. 文件名建议与声优 `id` 对应（如 `bian-jiang.jpg`）
3. 支持 JPG / PNG / WebP 格式
4. 建议尺寸 **400×400px** 正方形，会自动裁剪为圆形

---

## 功能说明

| 功能 | 说明 |
|------|------|
| 分类筛选 | 按性别（单选）、声线类型（多选）、标签（多选）筛选 |
| 搜索 | 支持搜索姓名、角色名、作品名、声线、标签 |
| 详情页 | 展示声优完整信息：简介、代表作、语音试听 |
| 语音播放 | 底部全局播放器，支持进度条拖动、自动播放下一条 |
| 响应式 | 电脑和手机自适应显示 |
| 数据分离 | 编辑 JSON 即可更新，无需改代码 |

---

## 技术栈

- **纯前端**：HTML + CSS + JavaScript（无框架依赖）
- **数据格式**：JSON
- **音频**：HTML5 Audio API（流式加载）
- **字体**：Google Fonts - Noto Sans SC
- **兼容性**：现代浏览器（Chrome / Firefox / Safari / Edge）

---

## 常见问题

### Q: 页面空白/数据加载失败
A: 确保通过 HTTP 服务器访问（不是直接打开 HTML 文件），且 `data/seiyuu-data.json` 存在。

### Q: 音频播放失败
A: 检查 `audioSamples` 中的 `file` 路径是否正确，文件是否存在于 `assets/audio/` 目录。

### Q: 头像显示为符号
A: 图片路径错误或图片不存在。检查 `avatar` 字段路径和实际文件。

### Q: 筛选没有某个声线/标签
A: 在 `filters.voiceTypes` 或 `filters.tags` 中添加该值。

### Q: 如何备份/迁移数据
A: 只需备份 `data/seiyuu-data.json` 文件和 `assets/` 目录。
