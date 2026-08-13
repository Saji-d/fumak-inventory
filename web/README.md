This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Port and the Android scanner app

`next dev` defaults to port 3000, but if that port is already taken by another
process (e.g. a different project's dev server also running on this machine),
Next.js silently falls back to the next free port (3001, 3002, ...) and only
prints a one-line notice in the terminal that started it.

The Android FUMAK Scanner app's "Add Desktop" screen also defaults new
connection profiles to port **3000**. If this dev server ever falls back to a
different port, either:

- start it with a fixed port instead — `next dev -p 3000` — after freeing up
  port 3000, or
- check the terminal output for the port it actually bound to, and make sure
  the phone's active connection profile (Settings → Desktop Connection) uses
  that same port.

A mismatch here doesn't show an error on the phone or in the browser — it just
looks like scans silently do nothing on `/sales`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
