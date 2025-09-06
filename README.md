# NeoChyrp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, modular, and extensible blogging engine. NeoChyrp is a complete rebuild of the classic Chyrp blogging engine, designed from the ground up for performance, security, and an excellent developer experience.

It is built with a powerful tech stack including Next.js 15 (App Router), TypeScript, Tailwind CSS, and Prisma, with Supabase for authentication and database hosting.

## Features

NeoChyrp comes packed with features that make it a powerful and flexible platform for any kind of blog or publication.

- **Content Management:**
    - **Feathers:** Create diverse content with different "Feathers" (post types) like Text, Photo, Video, Audio, Quotes, and Links.
    - **WYSIWYG Editor:** A modern Markdown editor for writing content.
    - **Tagging & Categorization:** Organize your posts with tags and nested categories.
- **Community & Interaction:**
    - **Comments:** A full-featured, threaded commenting system.
    - **Likes:** Allow users to like and engage with posts.
    - **Webmentions:** A core part of the IndieWeb, allowing for rich interactions between blogs.
- **Extensibility:**
    - **Modular Architecture:** A robust, event-driven module system allows for easy extension and customization.
    - **Permissions:** Fine-grained, role-based access control (RBAC) for users, groups, and permissions.
- **Technical Features:**
    - **API-First Design:** A comprehensive API for all major functionalities.
    - **Database Migrations:** Database schema management with Prisma Migrate.
    - **Authentication:** Secure authentication powered by Supabase.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (strict)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Authentication:** [Supabase Auth](https://supabase.com/auth)

## Architecture

NeoChyrp is built on a modern, modular architecture that emphasizes separation of concerns and developer ergonomics.

- **Domain-Driven Design (DDD):** Each feature is treated as a "module" with its own domain, application, infrastructure, and UI layers.
- **Event-Driven:** Modules communicate through an event bus, keeping them decoupled and making the system highly extensible.
- **API-First:** The majority of functionality is exposed via a RESTful API, allowing for flexible client implementations.

## Directory Structure

```text
neo-chyrp/
├── prisma/            # Database schema, migrations, and seed script
├── scripts/           # Helper scripts for bootstrapping the application
├── src/
│   ├── app/           # Next.js App Router routes (RSC)
│   ├── components/    # Shared UI components
│   ├── lib/           # Core infrastructure (DB, auth, events, etc.)
│   ├── modules/       # Feature modules (comments, likes, etc.)
│   └── styles/        # Global styles
└── ...
```

## Getting Started

Follow these instructions to get NeoChyrp up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [npm](https://www.npmjs.com/) (v10.x or later)
- A [Supabase](https://supabase.com/) account for database and authentication.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/neo-chyrp.git
    cd neo-chyrp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to a new file named `.env` and fill in the required values.
    ```bash
    cp .env.example .env
    ```

4.  **Run database migrations:**
    This will apply the database schema to your Supabase database.
    ```bash
    npm run db:migrate
    ```

5.  **Seed the database:**
    This will populate the database with some initial data (e.g., an admin user, default settings).
    ```bash
    npm run db:seed
    ```

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running at [http://localhost:3000](http://localhost:3000).

### One-Command Bootstrap

For convenience, you can use the helper scripts in the `scripts/` directory to perform all the setup steps at once.

-   **macOS/Linux:**
    ```bash
    ./scripts/start.sh
    ```
-   **Windows (PowerShell):**
    ```bash
    ./scripts/start.ps1
    ```
-   **Windows (CMD):**
    ```bash
    scripts\\start.cmd
    ```

## Configuration

All configuration is done via environment variables. See the `.env.example` file for a full list of available options.

| Variable                      | Description                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_NAME`        | The name of your application.                                                                           |
| `NEXT_PUBLIC_APP_URL`         | The public URL of your application.                                                                     |
| `NEXT_PUBLIC_SUPABASE_URL`    | Your Supabase project URL.                                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key.                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`   | Your Supabase service role key (should be kept secret).                                                 |
| `DATABASE_URL`                | The connection string for your Supabase database (with connection pooling).                             |
| `DIRECT_URL`                  | The direct connection string for your Supabase database (used for migrations).                          |
| `NEXTAUTH_SECRET`             | A secret key for NextAuth.                                                                              |
| `NEXTAUTH_URL`                | The URL for NextAuth.                                                                                   |
| `ENCRYPTION_KEY`              | A 32-byte key for encryption.                                                                           |
| `JWT_SIGNING_KEY`             | A key for signing JWTs.                                                                                 |


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
