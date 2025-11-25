use crate::{error::AppError, models::query::{AiAnalyzeRequest, AiAnalyzeResponse}, AppState};
use actix_web::{web, HttpResponse, Result};
use log::info;

pub async fn analyze_error(
    state: web::Data<AppState>,
    req: web::Json<AiAnalyzeRequest>,
) -> Result<HttpResponse, AppError> {
    let trace_id = &req.trace_id;

    // 参数验证
    if trace_id.is_empty() {
        return Err(AppError::ValidationError(
            "trace_id cannot be empty".to_string(),
        ));
    }

    info!("AI analyze request for trace_id: {}", trace_id);

    // 查询该 trace_id 的所有错误日志
    let error_logs = get_error_logs_by_trace_id(&state, trace_id).await?;

    if error_logs.is_empty() {
        let response = AiAnalyzeResponse {
            analysis: "未找到该 trace_id 对应的错误日志。".to_string(),
            trace_id: trace_id.to_string(),
        };
        return Ok(HttpResponse::Ok().json(response));
    }

    // 格式化日志
    let formatted_logs: Vec<String> = error_logs
        .iter()
        .map(|log| {
            format!(
                "[{}] [{}] [{}] {}",
                log.timestamp.format("%Y-%m-%d %H:%M:%S.%3f"),
                log.level,
                log.service,
                log.message
            )
        })
        .collect();

    // 调用 AI 分析
    let analysis = state
        .ai_analyzer
        .analyze_error_logs(formatted_logs, trace_id)
        .await?;

    info!("AI analysis completed for trace_id: {}", trace_id);

    let response = AiAnalyzeResponse {
        analysis,
        trace_id: trace_id.to_string(),
    };

    Ok(HttpResponse::Ok().json(response))
}

async fn get_error_logs_by_trace_id(
    state: &AppState,
    trace_id: &str,
) -> Result<Vec<crate::models::query::LogHit>, AppError> {
    use crate::models::query::SearchRequest;
    use chrono::Utc;

    let end_time = Utc::now();
    let start_time = end_time - chrono::Duration::hours(24); // 搜索最近24小时

    let search_req = SearchRequest {
        query: format!("trace_id:{} AND level:ERROR", trace_id),
        filters: std::collections::HashMap::new(),
        time_range_type: "absolute".to_string(),
        relative_time_key: None,
        start_time: Some(start_time),
        end_time: Some(end_time),
        page: 1,
        page_size: 20,  // 减少到 20 条，减少请求大小
        sort_by: "timestamp".to_string(),
        sort_desc: true,
    };

    let result = state.quickwit.search(&search_req, start_time, end_time).await?;
    Ok(result.hits)
}
