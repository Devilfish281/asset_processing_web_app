This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
NO! npm run dev
# or
yarn dev
# or
NO!  pnpm dev
# or
NO!  bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### get Environment Variables

vercel env pull .env

## run Program

https://asset-processing-web-app.vercel.app/projects

## postgreSQL Environment Variables

POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_URL_NO_SSL
POSTGRES_PRISMA_URL
POSTGRES_DATABASE

POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_HOST

## drizzle-kit

yarn drizzle-kit
yarn drizzle-kit studio

https://local.drizzle.studio

## How the program is structured?

asset_processing_service/ = whole project root

Python app lives in the Python-side folders

Next.js app lives in nextjs/

UI pages are in nextjs/src/app/

DB code is in nextjs/server/db/

Drizzle generated files are in nextjs/drizzle/

static assets are in nextjs/public/

# Add Shadcn components to the project

cd nextjs

npx shadcn add input
npx shadcn add button
NOTE: skip button we already have it
npx shadcn@latest add alert-dialog
npx shadcn@latest add textarea
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add card
npx shadcn@latest add dropdown-menu

# Add axios to the project

yarn add axios

```
import axios from "axios";
```

# Add react-hot-toast to the project

```
yarn add react-hot-toast
```

```
import { toast } from "react-hot-toast";
```

## Add Toaster to the project <div><Toaster/></div>

in roort layout.tsx

```
return (
  <ClerkProvider>
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  </ClerkProvider>
);
```

## Zod

# To install zod

'''
yarn add zod
'''
https://zod.dev

TypeScript-first schema validation.

# react-markdown

## React component that takes a markdown string and renders it as React elements

yarn add react-markdown
