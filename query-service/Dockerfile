# 构建阶段
FROM rust:alpine AS builder

# 设置 Cargo 镜像源（中科大）
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
ENV CARGO_REGISTRIES_CRATES_IO_INDEX=https://mirrors.ustc.edu.cn/crates.io-index/

RUN apk add --no-cache musl-dev openssl-dev pkgconfig

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

RUN apk add --no-cache ca-certificates openssl

WORKDIR /app
COPY --from=builder /app/target/release/log-query-service .
COPY --from=builder /app/config ./config

EXPOSE 8080

CMD ["./log-query-service"]