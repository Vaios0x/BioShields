# BioShield - Documentación Técnica

## 🏗️ Arquitectura del Sistema

### Frontend
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS con diseño glassmorphism
- **Animaciones**: Framer Motion
- **Estado**: React Query + Context API
- **Formularios**: React Hook Form + Zod

### Blockchain
- **Red Principal**: Solana (programa principal)
- **Red Secundaria**: Base (integración DeFi)
- **Bridge**: Wormhole SDK
- **Oracles**: Chainlink Functions

### Backend
- **API**: Next.js API Routes
- **Almacenamiento**: IPFS (Pinata/Web3.Storage)
- **Archivo Permanente**: Arweave
- **Base de Datos**: Indexación on-chain

## 🔧 Componentes Principales

### 1. Sistema de Seguros Paramétricos

```typescript
interface InsurancePolicy {
  id: string
  type: 'clinical_trial' | 'research_funding' | 'ip_protection' | 'regulatory_approval'
  coverageAmount: number
  premium: number
  triggerConditions: TriggerConditions
  status: 'active' | 'expired' | 'claimed' | 'cancelled'
}
```

### 2. Integración Multi-Chain

#### Solana (Principal)
- Programa Anchor para lógica de seguros
- Cuentas PDA para pólizas
- Integración con $LIVES token
- Verificación automática vía oracles

#### Base (DeFi)
- Contratos Solidity para liquidez
- Integración con $SHIELD token
- Bridge cross-chain
- Pools de liquidez

### 3. Sistema de Oracles

```typescript
interface OracleData {
  source: 'clinicaltrials.gov' | 'fda.gov' | 'uspto.gov' | 'custom_api'
  timestamp: Date
  value: any
  verified: boolean
  confidence: number
}
```

## 🎨 Sistema de Diseño

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Paleta de Colores
```css
:root {
  --primary: #7c3aed;    /* Violeta Próspera */
  --secondary: #06b6d4;  /* Cyan tech */
  --accent: #f59e0b;     /* Naranja $LIVES */
  --success: #10b981;
  --danger: #ef4444;
  --dark-bg: #0f0f23;
}
```

### Animaciones Neurales
- Partículas flotantes con movimiento browniano
- Conexiones dinámicas entre nodos
- Interacción con mouse/touch
- Optimizado con requestAnimationFrame

## 🔐 Seguridad

### Smart Contracts
- Auditorías por firmas especializadas
- Verificación múltiple de oracles
- Multi-sig para tesorería
- Rate limiting en funciones críticas

### Frontend
- Input sanitization
- Content Security Policy
- CORS configuration
- Wallet signature verification

## 📊 Tokenomics

### $LIVES Token
- **Función**: Descuento del 50% en primas
- **Red**: Multi-chain (Solana + Base)
- **Utilidad**: Pago de primas, gobernanza

### $SHIELD Token
- **Función**: Recompensas por liquidez
- **Red**: Base (principal)
- **Utilidad**: Staking, gobernanza, recompensas

## 🚀 Deployment

### Desarrollo Local
```bash
npm install
npm run dev
```

### Producción
```bash
npm run build
npm run start
```

### Vercel
```bash
vercel --prod
```

## 📈 Métricas y Monitoreo

### On-Chain
- TVL por pool
- Número de pólizas activas
- Claims procesados
- APY promedio

### Off-Chain
- Usuarios activos
- Tiempo de sesión
- Conversión de pólizas
- Satisfacción del usuario

## 🔄 Flujo de Datos

1. **Creación de Póliza**
   - Usuario selecciona tipo de seguro
   - Calculadora de prima
   - Pago con $LIVES (descuento) o USDC
   - Creación on-chain

2. **Verificación de Claims**
   - Usuario envía claim
   - Oracle verifica datos externos
   - Pago automático si se cumplen condiciones
   - Notificación al usuario

3. **Gobernanza**
   - Propuestas de la comunidad
   - Votación con $SHIELD tokens
   - Ejecución automática
   - Transparencia total

## 🛠️ Herramientas de Desarrollo

### Testing
- Jest para unit tests
- Cypress para E2E
- Solana test validator
- Hardhat para contratos

### Linting
- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks

### CI/CD
- GitHub Actions
- Vercel deployment
- Automated testing
- Security scanning

## 📚 APIs y Integraciones

### Chainlink Functions
```typescript
const source = `
  const trialId = args[0];
  const apiResponse = await Functions.makeHttpRequest({
    url: \`https://clinicaltrials.gov/api/v2/studies/\${trialId}\`,
  });
  return Functions.encodeUint256(
    apiResponse.data.protocolSection.statusModule.overallStatus === 'COMPLETED' ? 1 : 0
  );
`;
```

### IPFS
```typescript
const uploadToIPFS = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
    },
    body: formData,
  });
  
  return response.json();
};
```

## 🔮 Roadmap Técnico

### Fase 1 (Actual)
- ✅ Frontend completo
- ✅ Integración Solana
- ✅ Sistema de oracles básico
- ✅ PWA funcional

### Fase 2 (Q2 2025)
- 🔄 Auditorías de seguridad
- 🔄 Integración Base completa
- 🔄 Bridge cross-chain
- 🔄 Mobile app nativa

### Fase 3 (Q3 2025)
- 📋 IA para evaluación de riesgo
- 📋 Más tipos de seguros
- 📋 Integración con más oracles
- 📋 Marketplace de reaseguros

## 🤝 Contribución

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### Pull Requests
1. Fork del repositorio
2. Crear rama feature
3. Implementar cambios
4. Tests pasando
5. Documentación actualizada
6. Pull request con descripción detallada

## 📞 Soporte Técnico

- **Documentación**: [docs.bioshield.insurance](https://docs.bioshield.insurance)
- **Discord**: [BioShield Community](https://discord.gg/bioshield)
- **GitHub Issues**: [Reportar bugs](https://github.com/bioshield/insurance-platform/issues)
- **Email**: dev@bioshield.insurance

---

**BioShield** - Protegiendo el futuro de la ciencia descentralizada 🛡️🧬
