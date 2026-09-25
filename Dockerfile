# syntax=docker/dockerfile:1

# --- Frontend assets -------------------------------------------------------
FROM node:24-slim AS assets
RUN npm install --global pnpm@12.6.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY vite.config.ts tsconfig.json ./
COPY resources ./resources
COPY public ./public
RUN pnpm build

# --- PHP dependencies --------------------------------------------------------
FROM dunglas/frankenphp:1.12.7-php8.4 AS php-base
RUN install-php-extensions pdo_sqlite pdo_pgsql intl opcache pcntl zip

FROM php-base AS vendor
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY routes ./routes
RUN composer dump-autoload --no-dev --no-scripts --optimize --classmap-authoritative --no-interaction

# --- Runtime ----------------------------------------------------------------
FROM php-base AS runtime
WORKDIR /app

COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/ricette-entrypoint
COPY --from=vendor /app/vendor ./vendor
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY lang ./lang
COPY routes ./routes
COPY storage ./storage
COPY resources/views ./resources/views
COPY public ./public
COPY artisan composer.json ./
COPY --from=assets /app/public/build ./public/build

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/data/database.sqlite \
    SERVER_NAME=:8080

RUN mkdir -p /data /config/caddy /data/caddy \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache /data /config

USER 33:33
VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["php", "-r", "exit(@file_get_contents('http://127.0.0.1:8080/up') === false ? 1 : 0);"]

ENTRYPOINT ["ricette-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
