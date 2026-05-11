# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ClassTwin, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly at [security contact]
3. Include a detailed description of the vulnerability
4. Allow reasonable time for a fix before public disclosure

## Security Best Practices

### Environment Variables
- Never commit `.env` files â€” they are listed in `.gitignore`
- Use the `.env.example` files as templates
- Rotate API keys regularly

### Authentication
- All protected routes require Supabase authentication
- Backend API endpoints validate JWT tokens via Supabase
- Google OAuth is used for teacher sign-in

### Data Protection
- Student data is scoped per session via Row Level Security (RLS)
- WebSocket connections are authenticated with Supabase tokens
- LiveKit tokens have a 4-hour TTL and are scoped per room

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
