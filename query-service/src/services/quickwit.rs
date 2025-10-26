use crate::error::AppError;
use crate::models::query::{LogHit, SearchRequest, SearchResponse};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use log::warn;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashSet;
use std::time::Duration as StdDuration;

#[derive(Clone)]
pub struct QuickwitClient {
    base_url: String,
    index_id: String,
    client: Client,
}

impl QuickwitClient {
    pub fn new(base_url: String, index_id: String) -> Self {
        let client = Client::builder()
            .timeout(StdDuration::from_secs(30))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            base_url,
            index_id,
            client,
        }
    }

    pub async fn list_services(&self) -> Result<Vec<String>, AppError> {
        let end_time = Utc::now();
        let start_time = end_time - ChronoDuration::days(1);

        let query = json!({
            "query": "*",
            "start_timestamp": start_time.timestamp(),
            "end_timestamp": end_time.timestamp(),
            "max_hits": 0,
            "aggs": {
                "services": {
                    "terms": {
                        "field": "service",
                        "size": 200
                    }
                }
            }
        });

        let url = format!("{}/api/v1/{}/search", self.base_url, self.index_id);
        let response = self
            .client
            .post(&url)
            .json(&query)
            .send()
            .await
            .map_err(|e| AppError::QuickwitError(e.to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::QuickwitError(error_text));
        }

        let qw_response: Value = response
            .json()
            .await
            .map_err(|e| AppError::QuickwitError(e.to_string()))?;

        if let Some(buckets) = extract_buckets(&qw_response) {
            let mut services: Vec<String> = buckets
                .iter()
                .filter_map(|bucket| bucket.get("key").and_then(|k| k.as_str()))
                .map(|key| key.to_string())
                .collect();
            services.sort();
            services.dedup();
            return Ok(services);
        }

        warn!("Quickwit response missing aggregations; falling back to scan");

        let mut services = HashSet::new();
        let page_size: usize = 500;
        let max_pages: usize = 10;
        let mut page: usize = 1;

        loop {
            let fallback_req = SearchRequest {
                query: "*".to_string(),
                filters: Default::default(),
                time_range_type: "absolute".to_string(),
                relative_time_key: None,
                start_time: Some(start_time),
                end_time: Some(end_time),
                page,
                page_size,
                sort_by: "timestamp".to_string(),
                sort_desc: true,
            };

            let response = self.search(&fallback_req, start_time, end_time).await?;
            if response.hits.is_empty() {
                break;
            }

            for hit in response.hits {
                services.insert(hit.service);
            }

            if page >= max_pages {
                break;
            }

            let fetched = page * page_size;
            if fetched >= response.total as usize {
                break;
            }

            page += 1;
        }

        let mut service_list: Vec<String> = services.into_iter().collect();
        service_list.sort();
        Ok(service_list)
    }

    pub async fn search(
        &self,
        req: &SearchRequest,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<SearchResponse, AppError> {
        // 构建查询
        let query = self.build_query(req, start_time, end_time);

        // 发送请求
        let url = format!("{}/api/v1/{}/search", self.base_url, self.index_id);
        let start = std::time::Instant::now();

        let response = self
            .client
            .post(&url)
            .json(&query)
            .send()
            .await
            .map_err(|e| AppError::QuickwitError(e.to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::QuickwitError(error_text));
        }

        let qw_response: Value = response
            .json()
            .await
            .map_err(|e| AppError::QuickwitError(e.to_string()))?;

        let took_ms = start.elapsed().as_millis() as u64;

        // 转换响应
        self.convert_response(qw_response, req, took_ms)
    }

    fn build_query(
        &self,
        req: &SearchRequest,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Value {
        // 构建查询字符串
        let mut query_parts = vec![req.query.clone()];

        // 添加过滤条件
        for (field, value) in &req.filters {
            query_parts.push(format!("{}:{}", field, value));
        }

        let query_string = if query_parts.iter().all(|s| s.is_empty()) {
            "*".to_string()
        } else {
            query_parts
                .into_iter()
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
                .join(" AND ")
        };

        // 分页
        let offset = (req.page - 1) * req.page_size;

        // 排序 - Quickwit的排序逻辑反了：
        // 不带 "-" (如 "timestamp") 返回的是倒序（最新优先）
        // 带 "-" (如 "-timestamp") 返回的是正序（最旧优先）
        // 所以如果API要求降序（sort_desc=true），我们发送不带 "-" 的字段
        // 如果API要求升序（sort_desc=false），我们发送带 "-" 的字段
        let sort_field = if req.sort_desc {
            req.sort_by.clone() // 不带 "-"，Quickwit会返回倒序
        } else {
            format!("-{}", req.sort_by) // 带 "-"，Quickwit会返回正序
        };

        json!({
            "query": query_string,
            "start_timestamp": start_time.timestamp(),
            "end_timestamp": end_time.timestamp(),
            "max_hits": req.page_size,
            "start_offset": offset,
            "sort_by": sort_field
        })
    }

    fn convert_response(
        &self,
        qw_response: Value,
        req: &SearchRequest,
        took_ms: u64,
    ) -> Result<SearchResponse, AppError> {
        let hits_array = qw_response["hits"]
            .as_array()
            .ok_or_else(|| AppError::ParseError("Missing hits field".to_string()))?;

        let total = qw_response["num_hits"].as_u64().unwrap_or(0);

        let mut hits: Vec<LogHit> = Vec::new();
        let mut parse_errors = 0;

        for hit in hits_array {
            match serde_json::from_value::<LogHit>(hit.clone()) {
                Ok(log_hit) => hits.push(log_hit),
                Err(_e) => {
                    parse_errors += 1;
                    // 仅在调试模式下输出错误信息
                    #[cfg(debug_assertions)]
                    eprintln!("Failed to parse hit: {:?}\nRaw value: {}", _e, hit);
                }
            }
        }

        // 如果有显著的解析失败，记录警告
        if parse_errors > 0 && parse_errors as f64 / hits_array.len() as f64 > 0.1 {
            eprintln!(
                "Warning: {} of {} hits failed to parse",
                parse_errors,
                hits_array.len()
            );
        }

        Ok(SearchResponse {
            total,
            hits,
            page: req.page,
            page_size: req.page_size,
            took_ms,
        })
    }
}

fn extract_buckets(value: &Value) -> Option<Vec<Value>> {
    let from_aggs = value
        .get("aggs")
        .and_then(|aggs| aggs.get("services"))
        .and_then(|agg| agg.get("buckets"))
        .and_then(|buckets| buckets.as_array().cloned());

    if from_aggs.is_some() {
        return from_aggs;
    }

    value
        .get("aggregations")
        .and_then(|aggs| aggs.get("services"))
        .and_then(|agg| agg.get("buckets"))
        .and_then(|buckets| buckets.as_array().cloned())
}
