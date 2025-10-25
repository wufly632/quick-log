use actix_web::{web, App, HttpServer, middleware};
use log::info;

mod config;
mod handlers;
mod services;
mod models;
mod error;

use config::Config;
use services::quickwit::QuickwitClient;

#[derive(Clone)]
pub struct AppState {
    quickwit: QuickwitClient,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化日志
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // 加载配置
    let config = Config::load().expect("Failed to load config");

    // 创建 Quickwit 客户端
    let quickwit_client = QuickwitClient::new(
        config.quickwit.base_url.clone(),
        config.quickwit.index_id.clone(),
    );

    let app_state = AppState {
        quickwit: quickwit_client,
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
            .route("/api/v1/fields", web::get().to(handlers::search::get_fields))
    })
    .bind(&bind_addr)?
    .run()
    .await
}
