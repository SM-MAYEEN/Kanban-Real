# Realtime Kanban

## Local development

Install dependencies once:

```sh
npm --prefix client install
npm --prefix server install
```

Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and a private
`JWT_SECRET`. Set `EMAIL_USER` and `EMAIL_PASS` to enable email features. Copy
`client/.env.example` to `client/.env` if you want to override the local API
defaults.

Run the server and client in separate terminals from the repository root:

```sh
npm run dev:server
npm run dev:client
```

The client is served at `http://localhost:5173`; the API and Socket.IO server
use `http://localhost:5000`.

To run the local client against the deployed API instead, put the deployed API
URL in `client/.env.local` as `VITE_API_URL`. This sends **all** local app
changes (not just password reset) to the deployed database. Restart Vite after
changing this file. Do not set it unless you intend to work with live data.

## Deploy the client to Vercel

- Set the Vercel project Root Directory to `client`.
- Use `npm run build` as the build command and `dist` as the output directory.
- Set `VITE_API_URL` to the deployed backend URL ending in `/api`, for example
  `https://your-backend.example.com/api`.
- `VITE_SOCKET_URL` is optional; when omitted, the client uses the origin of
  `VITE_API_URL`.
- Redeploy after changing Vite environment variables.

## Deploy the server

Deploy `server` as a persistent Node.js service (for example, a Render Web
Service), with `server` as its Root Directory, `npm install` as its build
command, and `npm start` as its start command. Configure these environment
variables in the hosting provider:

- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` set to the canonical deployed Vercel URL (without a trailing
  slash)
- `EMAIL_USER` and `EMAIL_PASS` to enable password-reset and invite emails
- S3 variables from `server/.env.example` only if uploads are enabled

The API health check is available at `/health`. After deployment, check that
endpoint before testing the client. Vercel preview origins are allowed by the
server, while password-reset emails use the canonical `CLIENT_URL`.
