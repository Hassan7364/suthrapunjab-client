# SPA Daily Trip Reports

React/Vite client with an Express, MongoDB, and Cloudinary API.

## Requirements

- Node.js 20 or later
- A MongoDB connection string (local MongoDB or MongoDB Atlas)
- Cloudinary credentials for trip photo uploads

## Configuration

The frontend API URL is in the project-root `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

The backend settings are in `server/.env`. Set `MONGODB_URI` and `JWT_SECRET` before starting the server. Set all three Cloudinary values to enable photo uploads. The blank values are intentional; never put backend secrets in the client `.env` file.

`server/.env.example` and `.env.example` list the expected environment variables.

## Run Locally

Install client dependencies from the project root and server dependencies from the server folder:

```sh
npm install
npm --prefix server install
```

Start the API in one terminal:

```sh
npm run dev:server
```

Start the Vite client in another terminal:

```sh
npm run dev
```

The API exits with a configuration error until `MONGODB_URI` is set. Cloudinary is only needed for trip image upload and removal.

## API

All responses use `{ "success": boolean, "data": ... }`; errors include a `message`.

| Method | Endpoint                         | Access                          |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/api/health`                    | Public                          |
| POST   | `/api/auth/register`             | Public                          |
| POST   | `/api/auth/login`                | Public                          |
| GET    | `/api/auth/me`                   | Bearer token                    |
| GET    | `/api/reports?date=YYYY-MM-DD`   | Bearer token                    |
| POST   | `/api/reports`                   | Bearer token                    |
| PUT    | `/api/reports/:id`               | Bearer token                    |
| DELETE | `/api/reports/:id`               | Bearer token                    |
| POST   | `/api/reports/:id/images/:field` | Bearer token, multipart `image` |
| DELETE | `/api/reports/:id/images/:field` | Bearer token                    |

Image `field` must be `trip1Image`, `trip2Image`, or `trip3Image`. Images are limited to 8 MB.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
