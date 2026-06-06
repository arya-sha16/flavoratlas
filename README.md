# FlavorAtlas — Global Culinary Discovery Platform

FlavorAtlas is a full-stack global recipe discovery application that covers recipes from all 195+ countries and 50+ world cuisines. It enables home cooks to explore global dishes via an interactive map, search using fuzzy autocompletes, filter by complex dietary and allergen parameters, scale ingredient servings, view cached YouTube tutorial videos, and manage custom collections in their dashboards.

---

## 🎨 Design System & Visuals

- **Theme Palette**: Rich earthy tones (Saffron `#E8890C`, Cream `#FDF6EC`, Charcoal `#1C1C1C`, Terracotta `#C25B3F`).
- **Typography**: Display: *Playfair Display*; Body: *DM Sans*.
- **Features**: Animated World Map SVG continent filters, masonry grids, dark mode toggle, skeleton loaders, and micro-animations.

---

## ⚙️ Technology Stack

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Axios.
- **Backend**: Node.js + Express.js REST API (ES Modules, MVC architecture).
- **Database**: PostgreSQL (Prisma ORM).
- **Cache**: Redis (caches YouTube Search API query results for 24 hours).
- **Infrastructure**: Docker Compose (multi-container orchestration).

---

## 📂 Project Structure

```
/flavoratlas
├── /client                  ← React frontend
│   ├── /src
│   │   ├── /components      ← Navbar, Footer, WorldMap, RecipeCard, StarRating, Skeletons
│   │   ├── /context         ← AuthContext (sessions + saved cache), ThemeContext
│   │   ├── /pages           ← Home, Search, RecipeDetails, Auth, Dashboard, Submit, Admin
│   │   ├── /services        ← api.js (Axios base with automatic JWT refresh interceptor)
│   │   └── /utils           ← flags.js (Unicode country flags mapper)
│   ├── index.html
│   ├── tailwind.config.js
│   ├── nginx.conf           ← Nginx SPA router rules
│   └── Dockerfile           ← Production client image builder
├── /server                  ← Express backend
│   ├── /src
│   │   ├── /controllers     ← Auth, Users, Recipes, Reviews, Videos, Admin Controllers
│   │   ├── /routes          ← api.js route maps
│   │   ├── /middleware      ← Auth, Role check, Rate limiters, Error handling, Uploads
│   │   └── /services        ← Redis caching, YouTube search, email loggers, Cloudinary uploads
│   ├── package.json
│   └── Dockerfile           ← Backend image builder
├── /prisma
│   ├── schema.prisma        ← Database modeling declarations
│   └── seed.js              ← Seeding script (compiles 2000+ global recipes)
├── docker-compose.yml       ← Orchestrates db, redis, server, and client containers
├── .env.example             ← Environment templates
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js v20+](https://nodejs.org/) (for running locally outside Docker)

### Quick Run via Docker Compose (Recommended)

1. Clone the project and navigate to the `/flavoratlas` root directory.
2. Build and spin up all four container services (PostgreSQL, Redis, Express API, Vite Nginx client):
   ```bash
   docker compose up --build -d
   ```
3. Run the database migrations and seed script inside the running backend container:
   ```bash
   docker compose exec backend npx prisma db push --schema=/app/prisma/schema.prisma
   docker compose exec backend npm run prisma:seed
   ```
4. Access the platforms:
   - **Frontend App**: [http://localhost](http://localhost) (mapped to port 80)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
   - **API Healthcheck**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🛠️ Local Development (Running Services Separately)

If you prefer editing and running the code locally with hot reloading:

### 1. Start the Databases
Expose PostgreSQL and Redis on the standard ports (5432 and 6379) using Docker Compose:
```bash
docker compose up -d db redis
```

### 2. Configure Environment Variables
Copy `.env.example` into `.env` at the root folder:
```bash
cp .env.example .env
```
Keep the default local connections:
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flavoratlas?schema=public"`
- `REDIS_URL="redis://localhost:6379"`

### 3. Run Database Migrations & Seeding
Inside the `/server` directory:
```bash
npm run prisma:generate
npx prisma db push --schema=../prisma/schema.prisma
npm run prisma:seed
```
This runs the seed generator script, compiling:
- **Seed Users**: `admin@flavoratlas.com` (role `ADMIN`, password `Password123!`), `mod@flavoratlas.com` (`MODERATOR`), and 7 regular users.
- **Recipes**: **2050+ distinct recipes** spanning all 195+ countries, 50+ cuisine profiles, and 100+ tags.

### 4. Start the Express Backend API
Inside `/server` directory:
```bash
npm run dev
```
Starts development server on [http://localhost:5000](http://localhost:5000) using Nodemon.

### 5. Start the React Frontend App
Inside `/client` directory:
```bash
npm install
npm run dev
```
Starts Vite development hot reloads on [http://localhost:5173](http://localhost:5173).

---

## 🔐 Credentials for Testing

To log in and test different system privileges:

| User Type | Email | Password | Role |
|---|---|---|---|
| **System Admin** | `admin@flavoratlas.com` | `Password123!` | `ADMIN` |
| **System Moderator** | `mod@flavoratlas.com` | `Password123!` | `MODERATOR` |
| **Regular User** | `elena@example.com` | `Password123!` | `USER` |
