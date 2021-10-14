# Kachna inform

## Enviroment variables
- CRON_TIMING: "* * * * *"
- CRON_TIMEZONE: "Europe/Prague"
- MAIL_TO: "user@example.com, fitstudent@example.com"
- MAIL_TO_RESTART: "admin@example.com"
- MAIL_SUBJECT: "Kachna state changed"
- NODEMAILER_SENDER: "Kachna <kachna@example.com>"
- NODEMAILER_TRANSPORT: '{"host": "", "port": 465, "secure": true, "auth": {"user": "user@user.net", "pass": "pass"}}'
- NODEMAILER_DEFAULTS

## Docker compose

```batch
# Copy docker compose file
cp docker-compose.sample.yml docker-compose.yml

# Edit docker-compose.yml
vim docker-compose.yml

# Copy mongo init file
cp mongo-init.sample.js mongo-init.js

# Edit database credentials
vim mongo-init.js

# Start containers
docker-compose up -d
```
