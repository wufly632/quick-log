# 日志检索平台 - Web UI

基于 React + Vite + Ant Design 构建的日志检索前端界面。

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **Ant Design 5** - UI 组件库
- **Axios** - HTTP 客户端
- **Day.js** - 时间处理

## 核心功能

- 🔍 **全文搜索** - 支持 Lucene 查询语法
- ⏰ **时间范围选择** - 快捷时间范围 + 自定义范围
- 🎛️ **高级过滤** - 按级别、服务、环境过滤
- 📊 **结果展示** - 表格展示 + 分页 + 排序
- 📋 **便捷操作** - 复制消息、展开/折叠、Trace ID 跳转
- 📈 **统计信息** - 结果数量 + 查询耗时

## 项目结构

```
web-ui/
├── src/
│   ├── api/              # API 调用
│   │   └── search.js     # 搜索 API
│   ├── components/       # 组件
│   │   ├── SearchBar/    # 搜索栏
│   │   ├── FilterPanel/  # 过滤面板
│   │   └── LogTable/     # 日志表格
│   ├── pages/
│   │   └── Search/       # 搜索页面
│   ├── styles/
│   │   └── index.css     # 全局样式
│   ├── App.jsx           # 主组件
│   └── main.jsx          # 入口文件
├── index.html
├── vite.config.js
├── package.json
├── Dockerfile
└── nginx.conf
```

## 开发

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
cd web-ui
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## Docker 部署

### 构建镜像

```bash
docker build -t log-query-ui .
```

### 运行容器

```bash
docker run -p 3000:80 log-query-ui
```

访问 http://localhost:3000

## 环境变量

创建 `.env` 文件：

```bash
# API 基础路径
VITE_API_BASE_URL=/api/v1
```

## 组件说明

### SearchBar

搜索栏组件，包含：
- 搜索输入框（支持 Lucene 语法）
- 时间范围选择器
- 快捷时间范围

**Props**:
- `onSearch` - 搜索回调函数
- `loading` - 加载状态

### FilterPanel

高级过滤面板，支持：
- 日志级别过滤
- 服务名称过滤
- 环境过滤

**Props**:
- `onFilterChange` - 过滤条件变化回调
- `onReset` - 重置回调

### LogTable

日志表格组件，包含：
- 时间、级别、服务、主机、环境、消息、Trace ID
- 分页、排序、过滤
- 消息复制、展开/折叠

**Props**:
- `data` - 日志数据
- `loading` - 加载状态
- `pagination` - 分页配置
- `onChange` - 表格变化回调

## API 接口

### POST /api/v1/search

搜索日志。

**请求**:
```javascript
{
  query: "ERROR",
  start_time: "2024-01-01T00:00:00Z",
  end_time: "2024-12-31T23:59:59Z",
  filters: {
    level: "ERROR",
    service: "api-gateway"
  },
  page: 1,
  page_size: 50,
  sort_by: "timestamp",
  sort_desc: true
}
```

**响应**:
```javascript
{
  total: 12345,
  hits: [...],
  page: 1,
  page_size: 50,
  took_ms: 123
}
```

### GET /api/v1/fields

获取可用字段列表。

**响应**:
```javascript
{
  fields: ["timestamp", "message", "level", ...]
}
```

## Lucene 查询语法

- `ERROR` - 搜索包含 ERROR 的日志
- `"database error"` - 精确匹配短语
- `ERROR AND timeout` - 同时包含两个词
- `ERROR OR WARN` - 包含任意一个词
- `NOT ERROR` - 排除包含 ERROR 的日志
- `level:ERROR` - 搜索特定字段
- `message:数据库` - 中文搜索

## 样式定制

修改 `src/styles/index.css` 自定义样式。

日志级别颜色：
```css
.log-level-ERROR { color: #cf1322; }
.log-level-WARN  { color: #d46b08; }
.log-level-INFO  { color: #096dd9; }
.log-level-DEBUG { color: #8c8c8c; }
```

## 常见问题

### 1. API 请求 404

检查 `nginx.conf` 中的代理配置：

```nginx
location /api/ {
    proxy_pass http://query-service:8080;
}
```

### 2. 开发模式下 API 跨域

`vite.config.js` 已配置代理：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  }
}
```

### 3. 时间范围选择器显示异常

确保已导入 Day.js 中文语言包：

```javascript
import 'dayjs/locale/zh-cn'
```

## 性能优化

- ✅ Gzip 压缩（Nginx）
- ✅ 静态资源缓存（1 年）
- ✅ 按需加载（Vite 代码分割）
- ✅ 生产构建优化

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT
