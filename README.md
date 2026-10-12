# Carewell

A complete student doctor appointment project using React, Redux, Redux Thunk, React Router, Tailwind CSS, React Icons, Node.js, Express, and MongoDB.

## Start locally

Requires Node 22.12+ and npm.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and configure MongoDB and a random JWT secret of at least 32 characters. An existing local environment file may already be configured; do not overwrite it.
3. Run `npm run dev`.
4. Open http://localhost:5173 and create a patient account.

The app uses a dedicated `carewell` MongoDB database. Never commit `.env`, database passwords, or real patient information.

### Temporary demonstration

Run `npm run dev:demo` instead of `npm run dev`. It starts an isolated temporary MongoDB instance, seeds fictional appointments, and exposes a clearly labeled demo login button. Demo login: `alex@carewell.demo` / `Carewell123`. All demo data resets on restart. The first run downloads a MongoDB binary. Stop other Carewell servers before starting the demo.

## Pages and features

- Login and signup: validation, hashed passwords, HttpOnly cookie sessions, successful login toast, default redirect to My profile.
- Patient dashboard: live appointment/report counts, next appointment card, specialist links, wellness carousel.
- Book an appointment: specialty filter, doctor choice, live availability, date/time in IST, notes, up to three 5 MB reports, summary and confirmation.
- My appointments: patient-owned cards, year filter, upcoming/past/cancelled categories, cancellation, private report downloads.
- My profile: name, phone, birth date, gender, blood group, address, and profile photo upload.
- Services: API-loaded hospital services and accessible FAQ accordion.
- Responsive sidebar, original Carewell SVG logo and illustration, card hover effects, empty/loading/error states.

All doctors, services, prices, and clinic descriptions are fictional project content. No online payment or clinical advice is provided. The profile photo is saved only when Save changes is clicked.

## Structure

```
src/
  components/       shared layout, logo, cards, fields, alerts
  pages/            seven page views and React Testing Library tests
  store/            Redux reducer and asynchronous thunk actions
  lib/              API client and date formatting
  test/             test setup
  styles.css        Tailwind entry and responsive design
server/
  data/             fictional doctor and service catalog
  middleware/       authentication and session helpers
  models/           User, Appointment, Report MongoDB schemas
  validation.js     shared server input schemas
  app.js            Express API and production SPA serving
  index.js          database connection and startup
  api.test.js       isolated MongoDB integration tests
scripts/
  demo.js           isolated demonstration server and seeded data
  check-db.js       read-only, sanitized database connection check
```

## Verification

`npm test` runs React Testing Library UI tests and API tests against an isolated temporary MongoDB database. It never uses the configured Atlas database. Coverage includes login, profile changes, multipart booking, year filters, FAQ, cancellation, upload checks, access control, and concurrent booking conflicts.
`npm run build` creates the production SPA in `dist/`.
`node scripts/check-db.js` checks your configured database without writing records.

## API

| Method    | Endpoint                                       | Purpose                            |
| --------- | ---------------------------------------------- | ---------------------------------- |
| POST      | /api/auth/signup                               | Create account and session         |
| POST      | /api/auth/login                                | Sign in                            |
| POST      | /api/auth/logout                               | Clear session                      |
| GET       | /api/auth/me                                   | Restore authenticated patient      |
| PUT       | /api/profile                                   | Update own patient profile         |
| GET       | /api/doctors                                   | Doctor catalog                     |
| GET       | /api/services                                  | Hospital services                  |
| GET       | /api/availability?doctorId=...&date=YYYY-MM-DD | Free slots                         |
| GET, POST | /api/appointments                              | List own bookings / create booking |
| PATCH     | /api/appointments/:id/cancel                   | Cancel own future booking          |
| GET       | /api/reports/:id                               | Download own report                |
| GET       | /api/health                                    | Database readiness                 |

Booking uniqueness is enforced by a partial MongoDB unique index on doctor/date/time for confirmed appointments. All appointment/report reads and mutations enforce patient ownership. Passwords use bcrypt; JWTs live in HttpOnly SameSite cookies, secure in production. Mutation origins are checked. Login/signup requests are rate limited. File signatures and sizes are checked. Report bytes are stored in MongoDB for persistent hosting without local disk uploads.

## Hosting with GitHub and Render

The Express server serves the built React app and API from the same origin, keeping cookies simple.

1. Create a GitHub repository and push this project. Do not upload `.env`.
2. In Render, create a Blueprint from that repository using `render.yaml`.
3. Set `MONGODB_URI` to a connection URI that includes the `carewell` database. Set `APP_ORIGIN` to the exact HTTPS Render URL, without a trailing slash. JWT_SECRET is generated automatically.
4. Add the Render service's outbound IPs to the Atlas network access list and use a database user scoped to this project.
5. Run deployment. GitHub Actions tests and builds every PR/push; Render is configured to deploy when checks pass.
6. Verify signup, login, booking, report download, and logout on the deployed URL.

Deployment requires a GitHub repository and connected hosting account; local source creation does not deploy the app. Hosted Sites uses Workers, which does not run this requested Express/raw-TCP MongoDB stack, so this project targets a Node hosting provider.

## Design references

The palette uses calm teal, sage, cream, and muted pastel accents, inspired by [Color Hunt teal palettes](https://colorhunt.co/palettes/teal). Vite and Tailwind integration follows their official documentation: [Vite](https://vite.dev/guide/) and [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite).
