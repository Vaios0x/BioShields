# 🚀 **GUÍA DE DEPLOYMENT MANUAL EN SOLANA DEVNET**

## 📋 **Estado Actual**

✅ **Configuración Completada**
- **Program ID**: `4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW`
- **Wallet**: `3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF`
- **Balance**: 15.98 SOL (suficiente para deployment)
- **Archivos**: Program keypair y wallet keypair generados

⚠️ **Pendiente**: Compilación y deployment manual

---

## 🛠️ **REQUISITOS PREVIOS**

### 1. **Instalar Solana CLI**
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "solana-install.exe"
.\solana-install.exe init

# O usando WSL
curl -sSfL https://release.solana.com/stable/install | sh
export PATH="/home/usuario/.local/share/solana/install/active_release/bin:$PATH"
```

### 2. **Instalar Anchor CLI**
```bash
# Opción 1: NPM (recomendado)
npm install -g @coral-xyz/anchor-cli

# Opción 2: Cargo (requiere Visual Studio Build Tools)
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### 3. **Verificar Instalación**
```bash
solana --version
anchor --version
```

---

## 🚀 **PROCESO DE DEPLOYMENT**

### **Paso 1: Configurar Solana**
```bash
# Configurar para devnet
solana config set --url devnet
solana config set --commitment confirmed

# Verificar configuración
solana config get
```

### **Paso 2: Configurar Wallet**
```bash
# El wallet ya está configurado en ./rust/wallet-keypair.json
# Verificar balance
solana balance
```

### **Paso 3: Compilar Programa**
```bash
# Navegar al directorio rust
cd rust

# Compilar con Anchor
anchor build
```

### **Paso 4: Desplegar Programa**
```bash
# Deploy a devnet
anchor deploy --provider.cluster devnet
```

### **Paso 5: Verificar Deployment**
```bash
# Verificar que el programa esté desplegado
solana program show 4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW --url devnet
```

---

## 🔧 **SCRIPTS DISPONIBLES**

### **Scripts de Configuración**
```bash
# Generar Program ID
npm run generate-id

# Configurar wallet
npm run setup-wallet

# Configuración completa
npm run deploy:one-click
```

### **Scripts de Deployment**
```bash
# Deployment completo (requiere Anchor CLI)
npm run deploy:solana

# Verificación
npm run verify:solana

# Deployment alternativo (solo verificación)
node deploy-solana-alternative.js
```

---

## 📊 **INFORMACIÓN DEL PROGRAMA**

### **Program ID**
```
4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW
```

### **Wallet Address**
```
3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF
```

### **Explorer Link**
```
https://explorer.solana.com/address/4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW?cluster=devnet
```

---

## 🎯 **COMANDOS ONE-LINER**

### **Para WSL/Linux**
```bash
# Instalar herramientas
curl -sSfL https://release.solana.com/stable/install | sh && \
npm install -g @coral-xyz/anchor-cli && \
cd rust && \
solana config set --url devnet && \
anchor build && \
anchor deploy --provider.cluster devnet
```

### **Para Windows (PowerShell)**
```powershell
# Instalar Solana CLI
Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "solana-install.exe"; .\solana-install.exe init

# Instalar Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Deploy
cd rust; solana config set --url devnet; anchor build; anchor deploy --provider.cluster devnet
```

---

## 🔍 **VERIFICACIÓN POST-DEPLOYMENT**

### **1. Verificar en Explorer**
- Visitar: https://explorer.solana.com/address/4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW?cluster=devnet
- Confirmar que el programa esté desplegado

### **2. Verificar con CLI**
```bash
solana program show 4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW --url devnet
```

### **3. Ejecutar Tests**
```bash
cd rust
anchor test --provider.cluster devnet
```

---

## 📝 **ACTUALIZAR INFORMACIÓN**

Una vez desplegado exitosamente, actualizar:

### **deployment-info.json**
```json
{
  "program_id": "4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW",
  "wallet_address": "3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF",
  "deployment_date": "2025-09-22T05:15:00.000Z",
  "cluster": "devnet",
  "program_size": [TAMAÑO_REAL],
  "deployment_cost": "[COSTO_REAL] SOL",
  "solana_version": "2.0.14",
  "anchor_version": "0.30.1",
  "transaction_signature": "[SIGNATURE_REAL]",
  "status": "deployed"
}
```

### **README.md**
- Cambiar estado de "⚠️ Configurado" a "✅ Activo"

---

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### **Error: "link.exe not found"**
- Instalar Visual Studio Build Tools
- O usar WSL para evitar problemas de Windows

### **Error: "Anchor CLI not found"**
- Instalar con: `npm install -g @coral-xyz/anchor-cli`
- O usar cargo: `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked`

### **Error: "Insufficient balance"**
- El wallet ya tiene 15.98 SOL, suficiente para deployment
- Si es necesario: `solana airdrop 2`

### **Error: "Program already exists"**
- El programa ya está desplegado
- Verificar con: `solana program show 4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW --url devnet`

---

## ✅ **ESTADO FINAL ESPERADO**

Una vez completado el deployment:

- ✅ **Program ID**: `4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW`
- ✅ **Estado**: Desplegado en Solana Devnet
- ✅ **Explorer**: Accesible y verificable
- ✅ **Tests**: Ejecutándose correctamente
- ✅ **Documentación**: Actualizada

---

**🎯 Objetivo**: Completar el deployment del programa BioShield Insurance en Solana Devnet para tener cobertura completa en las 3 redes (Base, Optimism, Solana).
