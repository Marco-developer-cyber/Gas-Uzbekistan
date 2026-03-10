# Gas-Uzbekistan

Веб-приложение на Django для поиска заправок в Узбекистане с картой, фильтрами и маршрутом.

## 1. Локальный запуск (SQLite)

### Требования
- Python 3.11+ (рекомендуется 3.11)
- `pip`

### Установка
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows PowerShell

pip install -r requirements.txt
```

### Миграции и запуск
```bash
python manage.py migrate
python manage.py runserver
```

Открой: `http://127.0.0.1:8000`

## 2. Перевод структуры и данных в PostgreSQL (1:1)

Ниже способ, который переносит таблицы и данные максимально точно через Django migrations + fixtures.

### Шаг 1. Создай PostgreSQL БД
Можно на Render (PostgreSQL service) или локально.

### Шаг 2. Укажи `DATABASE_URL`
Пример:
```bash
set DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
```
или
```bash
export DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
```

### Шаг 3. Создай структуру таблиц в Postgres
```bash
python manage.py migrate
```

Это создаст те же Django-таблицы (`auth_*`, `django_*`, `stations_*`) с той же логикой связей.

### Шаг 4. Перенеси данные из SQLite в Postgres
Сначала на SQLite (локально, без `DATABASE_URL`):
```bash
python manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission > data.json
```

Потом включи `DATABASE_URL` (Postgres) и загрузи:
```bash
python manage.py loaddata data.json
```

Опционально создай суперпользователя:
```bash
python manage.py createsuperuser
```

## 3. Деплой на Render

### Web Service поля
- **Build Command**
```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```
- **Start Command**
```bash
gunicorn gas_uzbekistan.wsgi:application
```

### Environment Variables (Render)
Обязательные:
- `DJANGO_SECRET_KEY` = длинный случайный ключ
- `DJANGO_DEBUG` = `False`
- `ALLOWED_HOSTS` = `your-service-name.onrender.com`
- `CSRF_TRUSTED_ORIGINS` = `https://your-service-name.onrender.com`
- `DATABASE_URL` = URL от Render PostgreSQL

Рекомендуемые:
- `PYTHON_VERSION` = `3.11.9`

## 4. Важно про SQLite vs PostgreSQL

- SQLite подходит для локальной разработки.
- Для production (Render) лучше PostgreSQL.
- Код моделей менять не нужно: Django ORM работает одинаково, меняется только backend БД.
