# Fix para Direcciones de Tokens Inválidas

## Problema
La aplicación estaba usando direcciones de tokens inválidas que causaban errores de contrato:

```
Address "L1VES1234567890123456789012345678901234" is invalid.
- Address must be a hex value of 20 bytes (40 hex characters).
- Address must match its checksum counterpart.
```

## Causa Raíz
El problema era que el código estaba usando variables de entorno incorrectas o valores por defecto inválidos:

1. **`NEXT_PUBLIC_LIVES_TOKEN`** - Configurado para Solana, no para Ethereum
2. **`NEXT_PUBLIC_BIOSHIELD_CONTRACT`** - Usando valor por defecto `'0x...'` inválido
3. **Falta de lógica para seleccionar direcciones según la red actual**

## Solución Implementada

### 1. Funciones de Selección de Direcciones

Se crearon funciones para obtener las direcciones correctas según la red actual:

#### `hooks/useLivesToken.ts`
```typescript
// Get the correct LIVES token address based on the current network
const getLivesTokenAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532)
  if (chainId === 84532) {
    return process.env.NEXT_PUBLIC_BASE_LIVES_TOKEN || '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279'
  }
  // Optimism Sepolia (chainId: 11155420)
  if (chainId === 11155420) {
    return process.env.NEXT_PUBLIC_OPTIMISM_LIVES_TOKEN || '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2'
  }
  // Default fallback - use a valid Ethereum address
  return '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279'
}

// Get the correct SHIELD token address based on the current network
const getShieldTokenAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532)
  if (chainId === 84532) {
    return process.env.NEXT_PUBLIC_BASE_SHIELD_TOKEN || '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE'
  }
  // Optimism Sepolia (chainId: 11155420)
  if (chainId === 11155420) {
    return process.env.NEXT_PUBLIC_OPTIMISM_SHIELD_TOKEN || '0x15164c7C1E5ced9788c2fB82424fe595950ee261'
  }
  // Default fallback - use a valid Ethereum address
  return '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE'
}
```

#### `hooks/useInsurance.ts`
```typescript
// Get the correct BioShield contract address based on the current network
const getBioShieldAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532)
  if (chainId === 84532) {
    return process.env.NEXT_PUBLIC_BASE_BIOSHIELD || '0x5C0F9F645E82cFB26918369Feb1189211511250e'
  }
  // Optimism Sepolia (chainId: 11155420)
  if (chainId === 11155420) {
    return process.env.NEXT_PUBLIC_OPTIMISM_BIOSHIELD || '0x0E98bc946F105e0371AD6D338d6814A4fcBBaC27'
  }
  // Default fallback - use a valid Ethereum address
  return '0x5C0F9F645E82cFB26918369Feb1189211511250e'
}
```

### 2. Integración con useChainId

Se agregó `useChainId` a los hooks para detectar la red actual:

```typescript
const chainId = useChainId()
const livesTokenAddress = getLivesTokenAddress(chainId)
const bioshieldAddress = getBioShieldAddress(chainId)
```

### 3. Direcciones de Contratos Configuradas

Las direcciones se obtienen de las variables de entorno configuradas en `env.example`:

#### Base Sepolia
- **BioShield Contract**: `0x5C0F9F645E82cFB26918369Feb1189211511250e`
- **LIVES Token**: `0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279`
- **SHIELD Token**: `0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE`

#### Optimism Sepolia
- **BioShield Contract**: `0x0E98bc946F105e0371AD6D338d6814A4fcBBaC27`
- **LIVES Token**: `0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2`
- **SHIELD Token**: `0x15164c7C1E5ced9788c2fB82424fe595950ee261`

## Archivos Modificados

1. **`hooks/useLivesToken.ts`**
   - Agregadas funciones `getLivesTokenAddress()` y `getShieldTokenAddress()`
   - Integrado `useChainId` para detectar la red actual
   - Actualizadas todas las referencias para usar las direcciones correctas

2. **`hooks/useInsurance.ts`**
   - Agregada función `getBioShieldAddress()`
   - Integrado `useChainId` para detectar la red actual
   - Actualizadas todas las referencias para usar las direcciones correctas

## Resultado

- ✅ **Direcciones de tokens válidas** según la red actual
- ✅ **Detección automática de red** usando `useChainId`
- ✅ **Fallbacks seguros** con direcciones válidas por defecto
- ✅ **Compatibilidad multi-red** (Base Sepolia y Optimism Sepolia)
- ✅ **Sin errores de contrato** por direcciones inválidas

## Estado Actual

La aplicación ahora usa las direcciones correctas de tokens y contratos según la red actual. Los errores de "Address is invalid" se han resuelto y las transacciones pueden ejecutarse correctamente en ambas redes de prueba.
