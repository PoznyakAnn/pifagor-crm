# Пифагор — маркетинговый сайт

React + TypeScript + Vite. Подключён к CRM backend через REST API.

## Запуск

```bash
npm install
npm run dev
```

Сайт: http://localhost:5173

**Требуется запущенный backend** (см. корневой [README](../README.md)):

```bash
cd ../pifagor-crm/pifagor-crm
docker compose up --build
docker compose exec backend python seed.py
```

## Переменные окружения

Скопируйте `.env.example` в `.env.local`:

```env
VITE_API_BASE_URL=
VITE_CRM_URL=http://localhost:8000
```

В dev-режиме `VITE_API_BASE_URL` оставьте пустым — Vite проксирует `/api` на backend.

## Что подключено к CRM

- **Формы заявок** → `POST /api/v1/requests`
- **Репетиторы** → `GET /api/v1/users/tutors/public`
- **Цены** → `GET /api/v1/prices`
- **FAQ** → `GET /api/v1/faq`
- **Отзывы** → `GET /api/v1/reviews`
- **Личный кабинет** → ссылка на CRM (`VITE_CRM_URL`)

## Сборка

```bash
npm run build
npm run preview
```
