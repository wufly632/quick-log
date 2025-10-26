use crate::{error::AppError, models::query::SearchRequest, AppState};
use actix_web::{web, HttpResponse, Result};

pub async fn search(
    state: web::Data<AppState>,
    req: web::Json<SearchRequest>,
) -> Result<HttpResponse, AppError> {
    // 参数验证
    req.validate().map_err(AppError::ValidationError)?;

    // 计算实际的时间范围（支持相对时间和绝对时间）
    let (start_time, end_time) = req
        .compute_time_range()
        .map_err(AppError::ValidationError)?;

    // 记录日志
    log::info!(
        "Search request: query={}, time_range_type={}, start_time={}, end_time={}, page={}, page_size={}",
        req.query,
        req.time_range_type,
        start_time,
        end_time,
        req.page,
        req.page_size
    );

    // 执行搜索
    let result = state.quickwit.search(&req, start_time, end_time).await?;

    Ok(HttpResponse::Ok().json(result))
}

pub async fn get_fields() -> Result<HttpResponse> {
    let fields = vec![
        "timestamp",
        "message",
        "level",
        "service",
        "host",
        "env",
        "trace_id",
        "span_id",
        "source_file",
        "line_number",
    ];

    Ok(HttpResponse::Ok().json(serde_json::json!({ "fields": fields })))
}

pub async fn list_services(state: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let services = state.quickwit.list_services().await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "services": services })))
}
