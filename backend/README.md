# BioShield Insurance Backend

Backend API completa para la plataforma de seguros paramétricos descentralizados BioShield.

## 🚀 Características

- **API RESTful** con NestJS y TypeScript
- **Autenticación** JWT y Web3 (wallet signatures)
- **Base de datos** PostgreSQL con Prisma ORM
- **Cache** Redis para optimización
- **Blockchain** Integración Solana y Base
- **Oracles** Chainlink para verificación de datos
- **IPFS** Almacenamiento descentralizado
- **Testing** Jest y Supertest
- **Documentación** Swagger/OpenAPI
- **Docker** Containerización completa

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/bioshield/insurance-platform.git
cd insurance-platform/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**
```bash
# Iniciar PostgreSQL y Redis
docker-compose up -d postgres redis

# Ejecutar migraciones
npm run prisma:migrate

# Generar cliente Prisma
npm run prisma:generate
```

5. **Iniciar servidor de desarrollo**
```bash
npm run start:dev
```

### Docker

```bash
# Construir y ejecutar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

## 📚 API Documentation

Una vez iniciado el servidor, la documentación estará disponible en:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testing

### Tests Unitarios
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

### Tests de Integración
```bash
npm run test:integration
```

### Coverage
```bash
npm run test:cov
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Autenticación y autorización
│   │   ├── insurance/      # Gestión de seguros
│   │   ├── blockchain/     # Integración blockchain
│   │   ├── oracle/         # Sistema de oracles
│   │   ├── liquidity/      # Pools de liquidez
│   │   ├── analytics/      # Analytics y métricas
│   │   ├── ipfs/          # Almacenamiento IPFS
│   │   ├── notifications/ # Sistema de notificaciones
│   │   ├── governance/    # Gobernanza descentralizada
│   │   └── bridge/        # Bridge cross-chain
│   ├── config/            # Configuración
│   ├── common/            # Utilidades comunes
│   └── main.ts           # Punto de entrada
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── migrations/       # Migraciones
├── test/                 # Tests
├── docker-compose.yml   # Docker Compose
└── Dockerfile          # Dockerfile
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev        # Servidor de desarrollo
npm run start:debug      # Servidor con debug

# Producción
npm run build           # Construir aplicación
npm run start:prod      # Iniciar en producción

# Base de datos
npm run prisma:generate # Generar cliente Prisma
npm run prisma:push     # Push schema a DB
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:studio   # Abrir Prisma Studio

# Testing
npm run test            # Tests unitarios
npm run test:watch      # Tests en modo watch
npm run test:cov        # Coverage
npm run test:e2e        # Tests E2E

# Docker
npm run docker:up       # Iniciar servicios Docker
npm run docker:down     # Detener servicios Docker
npm run docker:logs     # Ver logs Docker

# Linting
npm run lint            # ESLint
npm run format          # Prettier
```

## 🔐 Autenticación

### JWT Authentication
```bash
# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "user": { ... },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### Web3 Authentication
```bash
# Generate nonce
GET /auth/nonce
{
  "walletAddress": "0x..."
}

# Login with signature
POST /auth/web3/login
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "BioShield Authentication..."
}
```

## 📊 Endpoints Principales

### Insurance
- `POST /insurance/policies` - Crear póliza
- `GET /insurance/policies` - Listar pólizas
- `GET /insurance/policies/:id` - Obtener póliza
- `POST /insurance/claims` - Enviar reclamo
- `GET /insurance/stats` - Estadísticas del pool

### Liquidity
- `POST /liquidity/add` - Agregar liquidez
- `POST /liquidity/remove` - Remover liquidez
- `GET /liquidity/pools` - Listar pools

### Governance
- `GET /governance/proposals` - Listar propuestas
- `POST /governance/vote` - Votar propuesta
- `POST /governance/propose` - Crear propuesta

## 🔗 Integración Blockchain

### Solana
- Programa Anchor para lógica de seguros
- Cuentas PDA para pólizas
- Integración con $LIVES token
- Verificación automática vía oracles

### Base/Ethereum
- Contratos Solidity para liquidez
- Integración con $SHIELD token
- Bridge cross-chain
- Pools de liquidez

## 🛡️ Seguridad

- **Rate Limiting** - Protección contra spam
- **CORS** - Configuración de orígenes permitidos
- **Helmet** - Headers de seguridad
- **Validation** - Validación de entrada con class-validator
- **Encryption** - Bcrypt para passwords
- **JWT** - Tokens seguros con expiración

## 📈 Monitoreo

- **Health Checks** - Endpoint de salud
- **Logging** - Logs estructurados
- **Metrics** - Métricas de performance
- **Error Tracking** - Integración con Sentry

## 🚀 Deployment

### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```bash
# Construir imagen
docker build -t bioshield-backend .

# Ejecutar contenedor
docker run -p 3001:3001 bioshield-backend
```

### Kubernetes
```bash
# Aplicar manifiestos
kubectl apply -f k8s/
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- **Documentación**: [docs.bioshield.insurance](https://docs.bioshield.insurance)
- **Discord**: [BioShield Community](https://discord.gg/bioshield)
- **GitHub Issues**: [Reportar bugs](https://github.com/bioshield/insurance-platform/issues)
- **Email**: dev@bioshield.insurance

---

**BioShield** - Protegiendo el futuro de la ciencia descentralizada 🛡️🧬
