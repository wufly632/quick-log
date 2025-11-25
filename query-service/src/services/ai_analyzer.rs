use crate::error::AppError;
use log::info;
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration as StdDuration;

#[derive(Clone)]
pub struct AiAnalyzerClient {
    /// AI API Base URL (e.g., OpenAI, Anthropic, or custom endpoint)
    base_url: String,
    /// API Key for authentication
    api_key: Option<String>,
    /// HTTP client
    client: Client,
    /// Model name to use
    model: String,
}

impl AiAnalyzerClient {
    pub fn new(base_url: String, api_key: Option<String>, model: String) -> Self {
        let client = Client::builder()
            .timeout(StdDuration::from_secs(180))  // 增加超时到 3 分钟
            .connect_timeout(StdDuration::from_secs(30))  // 连接超时 30 秒
            .build()
            .expect("Failed to build HTTP client");

        Self {
            base_url,
            api_key,
            client,
            model,
        }
    }

    pub async fn analyze_error_logs(
        &self,
        logs: Vec<String>,
        trace_id: &str,
    ) -> Result<String, AppError> {
        if logs.is_empty() {
            return Ok("没有找到相关的错误日志可以分析。".to_string());
        }

        // 限制日志数量，避免请求过大
        let max_logs = 50;
        let logs_to_analyze = if logs.len() > max_logs {
            info!("Found {} logs, truncating to {} for AI analysis", logs.len(), max_logs);
            logs[..max_logs].to_vec()
        } else {
            logs
        };

        info!("Starting AI analysis for trace_id: {}, logs count: {}", trace_id, logs_to_analyze.len());

        // 构建提示词
        let prompt = self.build_prompt(logs_to_analyze, trace_id);

        // 记录 prompt 大小
        info!("Prompt size: {} characters", prompt.len());

        // 调用AI API（超时时间已在 client 中设置为 180 秒）
        let response = self.call_ai_api(&prompt).await?;

        info!("AI analysis completed for trace_id: {}", trace_id);

        Ok(response)
    }

    fn build_prompt(&self, logs: Vec<String>, trace_id: &str) -> String {
        // 限制单个日志长度，避免 prompt 过长
        let max_log_length = 500;
        let truncated_logs: Vec<String> = logs
            .into_iter()
            .map(|log| {
                if log.len() > max_log_length {
                    format!("{}...(省略 {} 字符)", &log[..max_log_length], log.len() - max_log_length)
                } else {
                    log
                }
            })
            .collect();

        let logs_text = truncated_logs.join("\n\n---\n\n");

        // 限制总日志字符数
        let max_total_length = 15000;
        let final_logs_text = if logs_text.len() > max_total_length {
            format!("{}...(省略部分内容)", &logs_text[..max_total_length])
        } else {
            logs_text
        };

        format!(
            r#"你是一位资深的系统架构师和故障排查专家。请简洁分析以下错误日志。

Trace ID: {}

日志内容：
{}

要求：
1. 简洁说明主要错误（1-2句话）
2. 分析可能原因（2-3个关键点）
3. 提供解决建议（2-3条）
4. 控制在500字以内，使用中文"#,
            trace_id, final_logs_text
        )
    }

    async fn call_ai_api(&self, prompt: &str) -> Result<String, AppError> {
        // 这里以 OpenAI 格式为例，实际使用时可以根据需要调整为其他AI服务
        let request_body = json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一位专业的日志分析助手，擅长快速诊断系统错误和性能问题。回答简洁明了。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1500,  // 减少 token 数量，加快响应速度
            "top_p": 0.9
        });

        // 构建API URL，自动处理路径问题
        let url = if self.base_url.ends_with("/api/v1") {
            // OpenRouter 等服务 base_url 包含 /api/v1
            format!("{}/chat/completions", self.base_url.trim_end_matches('/'))
        } else if self.base_url.ends_with("/api") {
            // Anthropic 等服务 base_url 包含 /api
            format!("{}/v1/chat/completions", self.base_url.trim_end_matches('/'))
        } else if self.base_url.contains("openai.com") {
            // OpenAI 官方服务
            format!("{}/v1/chat/completions", self.base_url.trim_end_matches('/'))
        } else {
            // 通用情况，尝试添加 /v1/chat/completions
            let base = self.base_url.trim_end_matches('/');
            if base.ends_with("/v1") {
                format!("{}/chat/completions", base)
            } else {
                format!("{}/v1/chat/completions", base)
            }
        };

        log::debug!("Calling AI API at: {}", url);

        let mut request = self.client
            .post(&url)
            .json(&request_body);

        // 添加认证头
        if let Some(api_key) = &self.api_key {
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = request
            .send()
            .await
            .map_err(|e| AppError::QuickwitError(e.to_string()))?;

        let status = response.status();
        let response_text = response.text().await.unwrap_or_default();

        if !status.is_success() {
            log::error!("AI API error response: {}", response_text);
            return Err(AppError::QuickwitError(format!(
                "AI API error: {} - {}",
                status,
                response_text
            )));
        }

        let ai_response: Value = serde_json::from_str(&response_text)
            .map_err(|e| AppError::QuickwitError(format!("Failed to parse AI response: {}", e)))?;

        // 提取AI响应内容
        let content = ai_response
            .get("choices")
            .and_then(|choices| choices.as_array())
            .and_then(|choices| choices.first())
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(|content| content.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "无法解析AI响应".to_string());

        Ok(content)
    }
}
