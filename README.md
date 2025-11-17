<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Temple Platform

A comprehensive multi-tenant platform for religious organizations (churches, temples, mosques) to manage their communities, content, events, and member engagement.

## Features

- 🏛️ **Multi-tenant Architecture** - Each organization gets its own space
- 👥 **Member Management** - Role-based access, membership approvals
- 📝 **Content Management** - Posts, sermons, events, books, podcasts
- 💬 **Communication** - Direct messaging, announcements, prayer walls
- 📅 **Event Management** - Calendar, RSVPs, recurring events
- 👫 **Small Groups** - Community building and group management
- 🎨 **Customization** - Branding, themes, permissions
- 📊 **Admin Dashboard** - Analytics, audit logs, settings

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npm run db:seed
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Testing

This project includes a **comprehensive test suite** that tests every feature, page, and API endpoint.

### Quick Test

```bash
npm run test:all
```

### View Results

Results are saved in `test-results/` folder:
- `test-report-*.txt` - Human-readable report (read this first!)
- `test-issues-*.json` - Only failures and errors
- Open `test-suite/dashboard.html` in browser for interactive view

### Documentation

- **Quick Start:** [test-suite/README.md](test-suite/README.md)
- **Full Documentation:** [test-suite/DOCUMENTATION.md](test-suite/DOCUMENTATION.md)
- **Quick Reference:** [test-suite/QUICK-REFERENCE.md](test-suite/QUICK-REFERENCE.md)

### What Gets Tested

✅ 95+ API endpoints
✅ 30+ pages (public, authenticated, tenant, admin)
✅ 15+ feature workflows
✅ Authentication and authorization
✅ Error detection and handling

### Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:all` | Run all tests |
| `npm run test:api` | Test API endpoints only |
| `npm run test:pages` | Test page loading only |
| `npm run test:features` | Test feature workflows only |

## Project Structure

```
Temple4/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── auth/              # Authentication pages
│   ├── tenants/           # Tenant pages
│   └── ...
├── lib/                   # Utility functions
├── prisma/                # Database schema and migrations
├── test-suite/            # Comprehensive test suite
│   ├── run-tests.ts       # Main test runner
│   ├── api-tests.ts       # API endpoint tests
│   ├── page-tests.ts      # Page loading tests
│   ├── feature-tests.ts   # Feature workflow tests
│   └── dashboard.html     # Results viewer
└── ...
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed database with test data |
| `npm run test:all` | Run comprehensive test suite |
| `npm run lint` | Run ESLint |

## Development Workflow

1. **Start the server:** `npm run dev`
2. **Make changes** to your code
3. **Run tests:** `npm run test:all`
4. **Review results:** Check `test-results/test-report-*.txt`
5. **Fix issues** one by one
6. **Re-run tests** to verify fixes
7. **Repeat** until all tests pass

## Routes

See [ROUTES.md](ROUTES.md) for complete route documentation.

## Technology Stack

- **Framework:** Next.js 16
- **Database:** SQLite (Prisma ORM)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Testing:** Custom TypeScript test suite

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test:all`
4. Ensure all tests pass
5. Submit pull request

## License

[Add your license here]

## Support

For issues or questions:
1. Check test results for errors
2. Review documentation in `test-suite/`
3. Check server logs
4. Open an issue on GitHub
