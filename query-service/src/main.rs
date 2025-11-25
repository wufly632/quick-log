use actix_web::{middleware, web, App, HttpServer};
use log::info;

mod config;
mod error;
mod handlers;
mod models;
mod services;

use config::Config;
use services::{quickwit::QuickwitClient, ai_analyzer::AiAnalyzerClient};

#[derive(Clone)]
pub struct AppState {
    pub quickwit: QuickwitClient,
    pub ai_analyzer: AiAnalyzerClient,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // 加载 .env 文件（如果存在）
    dotenv::dotenv().ok();

    // 加载配置
    let config = Config::load().expect("Failed to load config");

    // 调试：打印 AI 配置
    info!("AI Analyzer Config:");
    info!("  Base URL: {}", config.ai_analyzer.base_url);
    info!("  Model: {}", config.ai_analyzer.model);
    info!("  API Key exists: {}", config.ai_analyzer.api_key.is_some());
    if let Some(key) = &config.ai_analyzer.api_key {
        if key.is_empty() {
            info!("  WARNING: API key is empty! Set APP__AI_ANALYZER__API_KEY environment variable");
        } else {
            info!("  API Key (last 4 chars): ****{}", &key[key.len().saturating_sub(4)..]);
        }
    }

    // 创建 Quickwit 客户端
    let quickwit_client = QuickwitClient::new(
        config.quickwit.base_url.clone(),
        config.quickwit.index_id.clone(),
    );

    // 创建 AI 分析器客户端
    let ai_analyzer_client = AiAnalyzerClient::new(
        config.ai_analyzer.base_url.clone(),
        config.ai_analyzer.api_key.clone(),
        config.ai_analyzer.model.clone(),
    );

    let app_state = AppState {
        quickwit: quickwit_client,
        ai_analyzer: ai_analyzer_client,
    };

    let bind_addr = format!("{}:{}", config.server.host, config.server.port);
    info!("Starting server on {}", bind_addr);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            // 中间件
            .wrap(middleware::Logger::default())
            .wrap(actix_cors::Cors::permissive())
            // 路由
            .route("/health", web::get().to(handlers::health::health_check))
            .route("/api/v1/search", web::post().to(handlers::search::search))
            .route(
                "/api/v1/fields",
                web::get().to(handlers::search::get_fields),
            )
            .route(
                "/api/v1/services",
                web::get().to(handlers::search::list_services),
            )
            .route(
                "/api/v1/ai/analyze",
                web::post().to(handlers::ai_analyzer::analyze_error),
            )
    })
    .bind(&bind_addr)?
    .run()
    .await
}
