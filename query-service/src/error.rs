use actix_web::{error::ResponseError, HttpResponse};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Quickwit error: {0}")]
    QuickwitError(String),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Parse error: {0}")]
    ParseError(String),
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::ValidationError(msg) => {
                HttpResponse::BadRequest().json(serde_json::json!({"error": msg}))
            }
            AppError::QuickwitError(msg) => {
                HttpResponse::BadGateway().json(serde_json::json!({"error": msg}))
            }
            AppError::ParseError(msg) => {
                HttpResponse::InternalServerError().json(serde_json::json!({"error": msg}))
            }
        }
    }
}

impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError::ValidationError(s)
    }
}
