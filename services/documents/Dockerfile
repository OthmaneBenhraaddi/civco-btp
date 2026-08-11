FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative --no-interaction

FROM php:8.3-cli-bookworm

WORKDIR /app

COPY --from=vendor /app /app

RUN if [ ! -f .env ]; then cp .env.example .env; fi \
    && php artisan key:generate --force --no-interaction || true

EXPOSE 8081

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8081"]
