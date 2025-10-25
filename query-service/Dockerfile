# 构建阶段
FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app
COPY Cargo.toml Cargo.lock ./

# 创建虚拟 main.rs 预编译依赖
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制实际源代码
COPY src ./src
COPY config ./config

# 重新编译（触发 main.rs 变更）
RUN touch src/main.rs && \
    cargo build --release

# 运行阶段
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/target/release/log-query-service .
COPY --from=builder /app/config ./config

EXPOSE 8080

CMD ["./log-query-service"]
