# Future Me

Статичен сайт с две среди и автоматичен деплой чрез GitHub Actions.

| Среда | Клон      | Адрес                                     |
|-------|-----------|-------------------------------------------|
| SIT   | `develop` | `https://ivelinanenova-ship-it.github.io/Future-me/sit/`    |
| PROD  | `main`    | `https://ivelinanenova-ship-it.github.io/Future-me/`        |

## Как се качва промяна

1. Работиш в клон `develop` (или в feature клон, който сливаш в `develop`).
2. `git push` → pipeline-ът деплойва в **SIT**.
3. Проверяваш SIT. Ако всичко е наред, отваряш Pull Request `develop` → `main`.
4. След merge pipeline-ът деплойва в **PROD**.

Pipeline: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
