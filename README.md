# BioShield - Plataforma de Seguros Paramétricos DeSci

## 🛡️ Descripción

BioShield es la primera plataforma de seguros paramétricos descentralizados diseñada específicamente para el ecosistema biotech y DeSci (Ciencia Descentralizada). La plataforma utiliza tecnología blockchain para proporcionar protección automática contra riesgos comunes en investigación científica.

## 🚀 Características Principales

### Seguros Paramétricos Automatizados
- **Ensayos Clínicos**: Protección contra fallos en Fase II/III
- **Financiación de Investigación**: Cobertura contra pérdida de financiación
- **Protección de IP**: Seguro contra disputas de propiedad intelectual
- **Aprobaciones Regulatorias**: Protección contra rechazos FDA/EMA

### Tecnología Blockchain
- **Multi-chain**: Solana (principal) + Base (DeFi integration)
- **Oracles Chainlink**: Verificación automática de datos externos
- **IPFS**: Almacenamiento descentralizado de evidencia
- **Arweave**: Archivo permanente de pólizas

### Tokenomics
- **$LIVES Token**: Descuento del 50% en primas
- **$SHIELD Token**: Recompensas por liquidez y gobernanza
- **DAO Governance**: Gobernanza descentralizada del protocolo

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** con App Router y TypeScript
- **Reown AppKit** para conexión de wallets
- **TailwindCSS** con diseño glassmorphism
- **Framer Motion** para animaciones
- **React Query** para manejo de estado

### Blockchain
- **Solana**: Programa principal con Anchor
- **Base**: Integración DeFi con ethers.js
- **Wormhole**: Bridge cross-chain
- **Chainlink**: Oracles para datos externos

### Backend
- **IPFS**: Almacenamiento descentralizado
- **Arweave**: Archivo permanente
- **Next.js API Routes**: Backend ligero

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/bioshield/insurance-platform.git
cd insurance-platform
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus claves:
```env
# Blockchain RPC
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org

# Contract Addresses
NEXT_PUBLIC_PROGRAM_ID=BioSh1eLd...
NEXT_PUBLIC_INSURANCE_POOL=InsurP00L...
NEXT_PUBLIC_LIVES_TOKEN=L1VES...
NEXT_PUBLIC_SHIELD_TOKEN=SH13LD...

# Chainlink
CHAINLINK_ORACLE_ADDRESS=0x...
CHAINLINK_SUBSCRIPTION_ID=123

# IPFS
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Reown AppKit
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🏗️ Estructura del Proyecto

```
bioshield-insurance/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Página principal
│   ├── dashboard/         # Dashboard del usuario
│   ├── marketplace/       # Marketplace de seguros
│   ├── claims/           # Centro de claims
│   ├── pools/            # Pools de liquidez
│   ├── governance/       # Gobernanza DAO
│   └── globals.css       # Estilos globales
├── components/           # Componentes React
│   ├── ui/              # Componentes de UI base
│   ├── layout/          # Componentes de layout
│   ├── web3/            # Componentes Web3
│   └── insurance/       # Componentes específicos de seguros
├── lib/                 # Utilidades y configuraciones
├── types/               # Tipos TypeScript
├── hooks/               # Custom hooks
└── public/              # Archivos estáticos
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Producción
npm run start

# Linting
npm run lint

# Testing
npm run test

# Testing E2E
npm run test:e2e

# Deploy Solana
npm run deploy:solana

# Deploy Base
npm run deploy:base
```

## 🌐 Redes Soportadas

### Solana (Principal)
- **Mainnet**: Programa principal de seguros
- **Devnet**: Desarrollo y testing

### Base (DeFi Integration)
- **Mainnet**: Integración DeFi y bridge
- **Sepolia**: Testing

## 🔐 Seguridad

- **Auditorías**: Contratos auditados por firmas especializadas
- **Oracles**: Verificación múltiple de datos externos
- **IPFS**: Evidencia inmutable y verificable
- **Multi-sig**: Tesorería protegida por multi-firma

## 📊 Métricas del Protocolo

- **TVL Total**: $2.4M
- **Pólizas Activas**: 156
- **Claims Procesados**: 23
- **APY Promedio**: 12.5%
- **Usuarios**: 1,247

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🏆 Hackathon

Este proyecto fue desarrollado para el **DeSci Builders Hackathon 2025** en Próspera/Infinita City, enfocándose en el track "Insurance in a Box".

## 📞 Contacto

- **Website**: [https://bioshield.insurance](https://bioshield.insurance)
- **Twitter**: [@BioShieldDeSci](https://twitter.com/BioShieldDeSci)
- **Discord**: [BioShield Community](https://discord.gg/bioshield)
- **Email**: team@bioshield.insurance

## 🙏 Agradecimientos

- DeSci Builders Hackathon 2025
- Próspera/Infinita City
- Comunidad DeSci
- Contribuidores del proyecto

---

**BioShield** - Protegiendo el futuro de la ciencia descentralizada 🛡️🧬
