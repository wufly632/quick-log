use config::{Config as ConfigBuilder, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub quickwit: QuickwitConfig,
    pub ai_analyzer: AiAnalyzerConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct QuickwitConfig {
    pub base_url: String,
    pub index_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AiAnalyzerConfig {
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
}

impl Config {
    pub fn load() -> Result<Self, ConfigError> {
        let config = ConfigBuilder::builder()
            .add_source(File::with_name("config/config").required(false))
            .add_source(Environment::with_prefix("APP").separator("__"))
            .build()?;

        config.try_deserialize()
    }
}
