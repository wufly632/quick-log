use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct SearchRequest {
    /// 查询字符串（Lucene 语法）
    pub query: String,

    /// 字段过滤
    #[serde(default)]
    pub filters: HashMap<String, String>,

    /// 时间范围类型：relative 或 absolute
    #[serde(default = "default_time_range_type")]
    pub time_range_type: String,

    /// 相对时间 key（当 time_range_type 为 relative 时使用）
    #[serde(default)]
    pub relative_time_key: Option<String>,

    /// 绝对时间（当 time_range_type 为 absolute 时使用）
    #[serde(default)]
    pub start_time: Option<DateTime<Utc>>,

    #[serde(default)]
    pub end_time: Option<DateTime<Utc>>,

    /// 分页
    #[serde(default = "default_page")]
    pub page: usize,

    #[serde(default = "default_page_size")]
    pub page_size: usize,

    /// 排序
    #[serde(default = "default_sort_by")]
    pub sort_by: String,

    #[serde(default = "default_sort_desc")]
    pub sort_desc: bool,
}

fn default_time_range_type() -> String { "absolute".to_string() }

fn default_page() -> usize { 1 }
fn default_page_size() -> usize { 50 }
fn default_sort_by() -> String { "timestamp".to_string() }
fn default_sort_desc() -> bool { true }

impl SearchRequest {
    pub fn validate(&self) -> Result<(), String> {
        if self.page < 1 {
            return Err("page must be >= 1".to_string());
        }
        if self.page_size < 1 || self.page_size > 1000 {
            return Err("page_size must be between 1 and 1000".to_string());
        }

        // 验证时间范围
        match self.time_range_type.as_str() {
            "relative" => {
                if self.relative_time_key.is_none() || self.relative_time_key.as_ref().unwrap().is_empty() {
                    return Err("relative_time_key is required when time_range_type is 'relative'".to_string());
                }
                // 验证 relative_time_key 是否合法
                match self.relative_time_key.as_ref().unwrap().as_str() {
                    "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "7d" | "30d" => Ok(()),
                    _ => Err(format!("invalid relative_time_key: {}", self.relative_time_key.as_ref().unwrap())),
                }?;
            }
            "absolute" => {
                if self.start_time.is_none() || self.end_time.is_none() {
                    return Err("start_time and end_time are required when time_range_type is 'absolute'".to_string());
                }
                if self.start_time.unwrap() >= self.end_time.unwrap() {
                    return Err("start_time must be before end_time".to_string());
                }
            }
            _ => {
                return Err(format!("invalid time_range_type: {}", self.time_range_type));
            }
        }

        Ok(())
    }

    /// 计算实际的时间范围（将相对时间转换为绝对时间）
    pub fn compute_time_range(&self) -> Result<(DateTime<Utc>, DateTime<Utc>), String> {
        match self.time_range_type.as_str() {
            "relative" => {
                let key = self.relative_time_key.as_ref().ok_or("missing relative_time_key")?;
                let now = Utc::now();

                let start_time = match key.as_str() {
                    "1m" => now - chrono::Duration::minutes(1),
                    "5m" => now - chrono::Duration::minutes(5),
                    "15m" => now - chrono::Duration::minutes(15),
                    "1h" => now - chrono::Duration::hours(1),
                    "4h" => now - chrono::Duration::hours(4),
                    "1d" => now - chrono::Duration::days(1),
                    "7d" => now - chrono::Duration::days(7),
                    "30d" => now - chrono::Duration::days(30),
                    _ => return Err(format!("unknown relative_time_key: {}", key)),
                };

                Ok((start_time, now))
            }
            "absolute" => {
                let start = self.start_time.ok_or("missing start_time")?;
                let end = self.end_time.ok_or("missing end_time")?;
                Ok((start, end))
            }
            _ => Err(format!("unknown time_range_type: {}", self.time_range_type)),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub total: u64,
    pub hits: Vec<LogHit>,
    pub page: usize,
    pub page_size: usize,
    pub took_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogHit {
    pub timestamp: DateTime<Utc>,
    pub message: String,
    pub level: String,
    pub service: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,

    pub env: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trace_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub span_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_trace: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub labels: Option<serde_json::Value>,
}
