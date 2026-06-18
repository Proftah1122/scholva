# Provider Secrets Setup

Keep provider credentials in an ignored local `.env` file and in the hosting provider secret store. Do not commit live secrets.

## Neon

Set both values during local development unless you have a separate direct connection string:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

For Prisma migrations in production, prefer Neon’s non-pooled direct connection for `DIRECT_URL` and the pooled connection for `DATABASE_URL`.

## Cloudinary

Scholva can use either `CLOUDINARY_URL` or separate Cloudinary fields:

```bash
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="scholva_projects"
```

The Cloudinary cloud name is required. An API key and API secret are not enough to form `CLOUDINARY_URL`.

## Rotation Required

Any credential pasted into chat should be treated as exposed. Rotate the Neon database password and Cloudinary API secret before production use, then update local `.env`, Fly secrets, Vercel environment variables, and any CI/CD secret store.
