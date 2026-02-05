# EpiTrello

EpiTrello est un clone de Trello développé avec :

- **Frontend** : React + Vite + TypeScript
- **Backend** : FastAPI + SQLAlchemy
- **Database** : PostgreSQL
- **Infra** : Docker, Docker Compose
- **CI** : GitHub Actions
- **Registry** : GitHub Container Registry (GHCR)

## Prérequis

- Docker ≥ 24
- Docker Compose v2
- Git

## Lancer le projet en développement

```bash
docker compose up --build
```

Services exposés :

- Frontend : http://localhost:5173
- Backend API : http://localhost:8000
- PostgreSQL : localhost:5432

## Structure du projet

```
.
├── backend/
├── frontend/
├── docker-compose.yml
└── .github/
```

## Authentification

L'authentification se fait **au runtime** :
- Le frontend gère la connexion utilisateur
- Le token JWT est stocké côté client
- Les requêtes API utilisent `Authorization: Bearer <token>`

## Environnements

Variables importantes :

- DATABASE_URL
- JWT_SECRET
- VITE_API_BASE_URL

## Releases

Les releases sont gérées avec :
- release-please
- Semantic Versioning
- Images Docker publiées sur GHCR

Voir CHANGELOG.md pour l’historique.
