# Shopifake B2C Customer Microservice

Ce microservice gère les profils clients pour les applications B2C (Business to Customer).

- Gestion des profils clients (consultation, modification)
- Administration des clients (CRUD)
- Vérification du service et de la base via `/healthz`

Développé avec Node.js, TypeScript, Express et Prisma (PostgreSQL).

## Endpoints

- `GET /api/customers/me` — Récupère le profil du client connecté
- `PUT /api/customers/me` — Met à jour le profil du client connecté
- `GET /api/customers` — Liste tous les clients
- `POST /api/customers` — Crée un nouveau client
- `GET /api/customers/:id` — Récupère un client par ID
- `PUT /api/customers/:id` — Met à jour un client
- `DELETE /api/customers/:id` — Supprime un client
- `GET /healthz` — Healthcheck du service et de la base

## Démarrage

1. Installe les dépendances :
   ```bash
   npm install
   ```
2. Configure le fichier `.env` (voir `.env.template`)
3. Lance les migrations Prisma :
   ```bash
   npm run db:push
   ```
4. Compile le projet :
   ```bash
   npm run build
   ```
5. Démarre le service :
   ```bash
   npm start
   ```
