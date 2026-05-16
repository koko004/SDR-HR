#!/bin/bash
# SDR-HR - Script de despliegue autonomo
# Ejecutar como root desde el directorio del proyecto: bash deploy.sh
# Clona desde GitHub y ejecuta: todo se instala automaticamente.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/opt/sdr-hr"

echo "=========================================="
echo "  SDR-HR - Deploy Autonomo"
echo "=========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "$SCRIPT_DIR/package.json" ] || [ ! -d "$SCRIPT_DIR/src" ]; then
  echo "ERROR: Ejecuta este script desde el directorio del proyecto (donde esta package.json)"
  exit 1
fi

# Verificar root
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Este script debe ejecutarse como root (sudo bash deploy.sh)"
  exit 1
fi

echo "[1/7] Instalando dependencias del sistema..."
DEBIAN_FRONTEND=noninteractive apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl wget net-tools git \
  build-essential cmake \
  gnupg rtl-sdr libsox-fmt-all sox

# Instalar Node.js si no existe
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "  -> Instalando Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

echo "[2/7] Compilando e instalando rtl_ais..."
if command -v rtl_ais &> /dev/null; then
  echo "  -> rtl_ais ya instalado, saltando."
else
  TMPDIR=$(mktemp -d)
  git clone https://github.com/dgiardini/rtl-ais.git "$TMPDIR/rtl-ais"
  cd "$TMPDIR/rtl-ais"
  make
  cp rtl_ais /usr/local/bin/
  chmod +x /usr/local/bin/rtl_ais
  cd "$SCRIPT_DIR"
  rm -rf "$TMPDIR"
  echo "  -> rtl_ais instalado en /usr/local/bin/rtl_ais"
fi

echo "[3/7] Configurando memoria swap (optimizacion para dispositivos con poca RAM)..."
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  echo "  -> Creando 512MB de swap..."
  fallocate -l 512M /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=512
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "  -> Swap activado"
else
  echo "  -> Swap ya existe, saltando."
fi

echo "[4/7] Preparando directorio de instalacion..."
mkdir -p "$APP_DIR"

# Limpiar directorio de destino completamente para evitar archivos residuales
rm -rf "$APP_DIR/src" "$APP_DIR/.next" "$APP_DIR/node_modules"
rm -f "$APP_DIR/package.json" "$APP_DIR/next.config.js" "$APP_DIR/SUDOERS" "$APP_DIR/sdr-hr.service"

echo "[5/7] Copiando archivos del proyecto..."
cp -a "$SCRIPT_DIR/." "$APP_DIR/"
rm -rf "$APP_DIR/node_modules" "$APP_DIR/.next" "$APP_DIR/deploy.sh"

# Eliminar TODOS los archivos TypeScript y configuracion TS
find "$APP_DIR" -name "*.ts" -o -name "*.tsx" | xargs rm -f
rm -f "$APP_DIR/tsconfig.json" "$APP_DIR/next-env.d.ts"
rm -rf "$APP_DIR/.tsbuildinfo"

# Verificar que no quedaron archivos TS
TS_COUNT=$(find "$APP_DIR/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
if [ "$TS_COUNT" -gt 0 ]; then
  echo "  WARNING: Se encontraron $TS_COUNT archivos TypeScript, eliminando..."
  find "$APP_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs rm -f
fi

echo "[6/7] Instalando dependencias de Node.js..."
cd "$APP_DIR"
npm install --production

echo "[7/7] Construyendo la aplicacion Next.js (modo optimizado para baja memoria)..."
npm run build

echo "[8/8] Copiando archivos estaticos al directorio standalone..."
cp -r "$APP_DIR/.next/static" "$APP_DIR/.next/standalone/.next/"
if [ -d "$APP_DIR/public" ]; then
  cp -r "$APP_DIR/public" "$APP_DIR/.next/standalone/"
fi
echo "  -> Archivos estaticos copiados"

echo "[9/8] Configurando permisos y servicios..."

# Sudoers
if [ -f "$APP_DIR/SUDOERS" ]; then
  cp "$APP_DIR/SUDOERS" /etc/sudoers.d/sdr-hr
  chmod 0440 /etc/sudoers.d/sdr-hr
  echo "  -> Sudoers configurado en /etc/sudoers.d/sdr-hr"
  echo "     IMPORTANTE: Edita /etc/sudoers.d/sdr-hr y cambia 'sdr' por tu usuario real"
fi

# Systemd
if [ -f "$APP_DIR/sdr-hr.service" ]; then
  cp "$APP_DIR/sdr-hr.service" /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable sdr-hr
  echo "  -> Servicio systemd habilitado"
fi

echo ""
echo "=========================================="
echo "  Deploy completado exitosamente"
echo "=========================================="
echo ""
echo "Iniciar la aplicacion:"
echo "  systemctl start sdr-hr"
echo ""
echo "Ver estado:"
echo "  systemctl status sdr-hr"
echo ""
echo "La app estara disponible en: http://<IP>:3000"
echo ""
