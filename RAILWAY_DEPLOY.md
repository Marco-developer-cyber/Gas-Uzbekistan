# Railway Deploy (Django)

## 1. Push project to GitHub
Railway deploys fastest from a GitHub repo.

## 2. Create new Railway project
1. Open Railway dashboard.
2. `New Project` -> `Deploy from GitHub repo`.
3. Select this repository.

## 3. Add PostgreSQL service
1. In the same Railway project, create `PostgreSQL`.
2. Railway will provide connection variables.

## 4. Set environment variables (Service -> Variables)
- `DJANGO_SECRET_KEY` = long random secret
- `DJANGO_DEBUG` = `False`
- `ALLOWED_HOSTS` = `<your-service>.up.railway.app`
- `CSRF_TRUSTED_ORIGINS` = `https://<your-service>.up.railway.app`
- `DATABASE_URL` = Railway Postgres connection URL

Optional:
- `PYTHON_VERSION` = `3.11.9`

## 5. Deploy
This repo now includes:
- `Procfile` for web process
- `railway.json` with:
  - build: install deps + collectstatic
  - pre-deploy: `python manage.py migrate`
  - start: gunicorn on `$PORT`

After deploy, open:
- `https://<your-service>.up.railway.app`
- `https://<your-service>.up.railway.app/admin/`
