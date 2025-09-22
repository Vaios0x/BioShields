# BioShields Solana Devnet Deployment Guide

## 🎯 Complete Setup for September 2025

Esta guía te permitirá desplegar BioShields en Solana devnet desde Windows usando WSL con todas las mejores prácticas actualizadas para Solana v2.0.14 y Anchor 0.30.1.

## 📋 Requisitos Previos

- Windows 10/11 con WSL2 instalado
- Acceso a internet estable
- Al menos 4GB de espacio libre

## 🚀 Instalación Rápida (Método Recomendado)

### Opción 1: Instalación Automática

1. **Abrir PowerShell como Administrador**
2. **Ejecutar el script de instalación:**
   ```powershell
   .\setup-solana-windows.ps1
   ```

### Opción 2: Instalación Manual Paso a Paso

#### 1. Instalar WSL (si no está instalado)
```powershell
wsl --install
# Reiniciar después de la instalación
```

#### 2. Abrir Ubuntu Terminal
- Buscar "Ubuntu" en el menú Start
- O usar Windows Terminal y seleccionar Ubuntu

#### 3. Instalar dependencias en WSL
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas necesarias
sudo apt install -y curl wget git build-essential pkg-config libudev-dev libssl-dev

# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Instalar Solana CLI (v2.0.14 - September 2025)
sh -c "$(curl -sSfL https://release.anza.xyz/v2.0.14/install)"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Instalar Anchor CLI (0.30.1 - September 2025)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
```

## 🔧 Configuración del Proyecto

### 1. Navegar al proyecto
```bash
cd /mnt/c/Daaps/BioShields
```

### 2. Generar keypair de tu private key
```bash
node generate-keypair.js
```

### 3. Configurar Solana para devnet
```bash
solana config set --url devnet
solana config set --keypair ./devnet-keypair.json
```

### 4. Solicitar SOL de prueba
```bash
solana airdrop 2
```

## 🚀 Deployment

### Método 1: Script Automático (Recomendado)
```bash
# Hacer ejecutable el script
chmod +x deploy-devnet.sh

# Ejecutar deployment
./deploy-devnet.sh
```

### Método 2: Desde Windows (Batch)
```batch
# Desde Command Prompt en Windows
quick-deploy.bat
```

### Método 3: NPM Scripts
```bash
# Generar keypair
npm run setup:solana

# Build del programa
npm run solana:build

# Deploy a devnet
npm run deploy:devnet

# Verificar deployment
npm run verify:deployment
```

## 🔍 Verificación

### 1. Verificar deployment automáticamente
```bash
node verify-deployment.js
```

### 2. Verificación manual
```bash
# Ver información del programa
solana program show <PROGRAM_ID> --url devnet

# Ver balance de la wallet
solana balance

# Ver configuración actual
solana config get
```

### 3. Explorar en Solana Explorer
- Visita: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
- Reemplaza `<PROGRAM_ID>` con tu Program ID

## 📁 Archivos Importantes

- `.env.devnet` - Variables de entorno para devnet
- `devnet-keypair.json` - Tu keypair para devnet
- `deployment-info.json` - Información del deployment
- `deployment-verification.json` - Reporte de verificación
- `rust/Anchor.toml` - Configuración de Anchor
- `deploy-devnet.sh` - Script principal de deployment

## 🛠️ Comandos Útiles

### Solana CLI
```bash
# Ver versión
solana --version

# Ver configuración
solana config get

# Ver balance
solana balance

# Cambiar cluster
solana config set --url devnet
solana config set --url mainnet-beta

# Airdrop (solo devnet/testnet)
solana airdrop 2
```

### Anchor CLI
```bash
# Ver versión
anchor --version

# Build programa
anchor build

# Deploy programa
anchor deploy

# Ejecutar tests
anchor test

# Limpiar build
anchor clean
```

## 🐛 Troubleshooting

### Error: "command not found"
```bash
# Recargar profile
source ~/.bashrc
source ~/.cargo/env
```

### Error: "insufficient funds"
```bash
# Solicitar más SOL
solana airdrop 2
# O usar web faucet: https://faucet.solana.com
```

### Error: "deployment failed"
```bash
# Verificar balance
solana balance

# Reintentar con priority fees más altos (v2.0.14)
solana program deploy target/deploy/bioshield_insurance.so --with-compute-unit-price 100000
```

### Error: "WSL command not found"
- Instalar WSL: `wsl --install` en PowerShell como Admin
- Reiniciar Windows
- Abrir Ubuntu terminal

### Error: "anchor command not found"
```bash
# Reinstalar Anchor (September 2025)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

## 📈 Próximos Pasos

1. **Testing**: Ejecutar tests con `npm run solana:test`
2. **Frontend Integration**: Actualizar frontend con nueva Program ID
3. **Monitoring**: Configurar monitoreo del programa
4. **Mainnet**: Cuando esté listo, deployment a mainnet

## 🔒 Seguridad

- ✅ Nunca compartir tu private key
- ✅ Usar diferentes keypairs para devnet/mainnet
- ✅ Hacer backup de tus keypairs
- ✅ Verificar Program IDs antes de interactuar

## 🌐 Enlaces Útiles

- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com)
- [Anchor Documentation](https://anchor-lang.com)
- [Solana Documentation](https://docs.solana.com)

---

## ✅ Checklist de Deployment

- [ ] WSL instalado y funcionando
- [ ] Rust instalado
- [ ] Solana CLI instalado
- [ ] Anchor CLI instalado
- [ ] Keypair generado
- [ ] SOL en devnet obtenido
- [ ] Programa compilado
- [ ] Programa desplegado
- [ ] Deployment verificado
- [ ] Explorer funcionando

**¡Tu BioShields está listo en Solana devnet! 🎉**