# Development image: PHP 8.4 (the version the production image uses) with the extensions the app, the tests,
# the coverage checks and the debugger need. Node, pnpm and the GitHub CLI come from devcontainer.json.
FROM mcr.microsoft.com/devcontainers/php:1-8.4-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends jq pipx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions intl zip pdo_sqlite pdo_pgsql pcov xdebug \
    # Xdebug stays off until ./bin/dev switches it on, so tests and coverage run at full speed.
    && echo "xdebug.mode=off" > /usr/local/etc/php/conf.d/zz-xdebug-off.ini

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
