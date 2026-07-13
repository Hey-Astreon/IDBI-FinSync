# IDBI FinSync — Enterprise Deployment & Operations Guide

This document contains standard production reference parameters, configuration keys, database migrations instructions, and architectural specifications.

---

## 🛠️ System Requirements & Architecture

- **Runtime Environment**: Node.js v20 LTS (Alpine recommended)
- **Database Engine**: PostgreSQL v15+
- **Caching Layer**: Redis v7+
- **Security Protocols**: Argon2, HTTPS-Only Cookies, JWT Session Rotation
- **AI Core Integration**: Google Gemini 1.5 Flash API

---

## 🔐 Environment Configuration Reference

The following parameters must be configured in the container runtime environment before deployment:

| Variable         | Description                                       | Security Requirements                                                   |
| :--------------- | :------------------------------------------------ | :---------------------------------------------------------------------- |
| `NODE_ENV`       | Target mode (`production`, `development`, `test`) | Must be set to `production` in live environments.                       |
| `PORT`           | Local binding port for Fastify server             | Default is `5000`.                                                      |
| `DATABASE_URL`   | PostgreSQL connection string                      | Use strong credentials and SSL modes (`sslmode=require`).               |
| `JWT_SECRET`     | Secret key used for signing JWT tokens            | Must be a secure random hash of at least 32 characters.                 |
| `GEMINI_API_KEY` | Google Gemini developer credentials               | Required in production mode. Suppresses mock loops.                     |
| `CORS_WHITELIST` | Whitelisted origin domains for browser clients    | Set to specific comma-separated URLs (e.g. `https://finsync.idbi.com`). |

---

## 🚀 Database Operations & Migrations

### Applying Pending Database Schema Changes

Migrations must be applied automatically at startup or out-of-band during the release phase. The production-ready Dockerfile includes inline script execution:

```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### Safety & Rollbacks

- Prisma baseline migration `20260713000000_initial_schema` sets the initial table layout.
- Destructive updates (such as column dropping) require explicit migration configuration (`--create-only`) and verification to prevent data loss.

---

## 🛡️ Security Policy Summary

1. **HttpOnly Cookies**: Refresh tokens are stored strictly in `httpOnly`, `secure: true`, and `sameSite: strict` response cookies.
2. **CORS Restrictions**: Origin spoofing via substring matching is blocked by exact whitelisted array equality.
3. **Passwords**: Strong constraints are enforced (minimum 8 characters, uppercase, lowercase, numbers, and special characters).
4. **Validation Capping**: Large message prompts to Gemini are restricted to `2000` characters to prevent memory depletion and API quota exhaustion.
5. **OTP Leak Protection**: Plaintext OTP codes are never returned in JSON response bodies when running in `production` mode.
