# AI 错误分析功能使用说明

## 功能概述

AI 错误分析功能利用大语言模型（LLM）自动分析错误日志，帮助快速定位问题根因和提供解决方案。

## 使用方法

### 1. 搜索日志

在搜索页面输入查询条件搜索日志，系统会显示搜索结果。

### 2. 触发 AI 分析

在搜索结果统计区域，点击 **"AI 分析错误原因"** 按钮。

**前提条件**：
- 搜索结果中必须包含错误日志（level: ERROR）
- 日志必须包含 trace_id 字段
- 没有 trace_id 时，按钮将显示为"暂无可分析的错误"

### 3. 查看分析结果

点击按钮后，AI 分析模态框将显示：
- 分析进度（加载动画）
- 完整的错误分析报告，包括：
  - 问题诊断
  - 影响范围
  - 时间线分析
  - 错误根因
  - 解决建议
  - 预防措施

## 配置说明

### 后端配置

编辑 `query-service/config/config.yaml`：

```yaml
ai_analyzer:
  # AI 服务提供商
  base_url: "https://api.openai.com"  # OpenAI API
  # base_url: "https://api.anthropic.com"  # Anthropic API
  api_key: ""  # 从环境变量读取，或留空使用环境变量
  model: "gpt-4"  # 默认模型
```

### 环境变量

通过环境变量设置 API Key：

```bash
# OpenAI
export APP__AI_ANALYZER__API_KEY="your-openai-api-key"

# 或 Anthropic
export APP__AI_ANALYZER__API_KEY="your-anthropic-api-key"
```

## API 文档

### AI 分析接口

**端点**：`POST /api/v1/ai/analyze`

**请求体**：
```json
{
  "trace_id": "abc123"
}
```

**响应**：
```json
{
  "analysis": "AI 分析报告内容...",
  "trace_id": "abc123"
}
```

### 错误处理

- `trace_id is empty` - trace_id 不能为空
- `未找到该 trace_id 对应的错误日志` - 无错误日志可分析
- `AI API error` - AI 服务调用失败

## 实现原理

### 后端流程

1. 接收 trace_id 参数
2. 查询 Quickwit 中该 trace_id 的所有错误日志（最近24小时）
3. 格式化日志（时间、级别、服务、消息）
4. 构建提示词，调用 AI API
5. 返回分析结果

### 前端流程

1. 检查搜索结果是否包含 trace_id
2. 点击按钮调用 AI 分析接口
3. 显示加载状态
4. 展示 AI 分析结果

## 支持的 AI 服务商

### OpenAI
- **base_url**: `https://api.openai.com`
- **model**: `gpt-4`, `gpt-3.5-turbo`
- **API Key**: 环境变量 `APP__AI_ANALYZER__API_KEY`

### Anthropic
- **base_url**: `https://api.anthropic.com`
- **model**: `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- **API Key**: 环境变量 `APP__AI_ANALYZER__API_KEY`

## 注意事项

1. **成本控制**：AI 调用会产生费用，建议限制调用次数
2. **日志隐私**：发送给 AI 的日志可能包含敏感信息，确保 API Key 安全
3. **响应时间**：AI 分析通常需要 5-15 秒，请耐心等待
4. **网络依赖**：需要能访问 AI 服务提供商的网络
5. **并发限制**：AI 服务有并发限制，建议在生产环境中添加队列或限制

## 性能优化建议

1. **缓存**：可考虑缓存常用 trace_id 的分析结果
2. **异步处理**：对于大量日志，可考虑异步分析并通过 WebSocket 返回结果
3. **日志截断**：对于过长日志，可截断至关键部分以减少 token 消耗
4. **错误日志限制**：建议只分析最近的 100 条错误日志
