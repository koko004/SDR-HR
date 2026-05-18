#!/bin/bash
# SDR-HR - Script de despliegue autonomo
# Ejecutar como root desde el directorio del proyecto: bash deploy.sh
# Clona desde GitHub y ejecuta: todo se instala automaticamente.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/opt/sdr-hr"
CURRENT_USER=$(whoami)

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

echo "[0/8] Instalando Node.js y npm..."
DEBIAN_FRONTEND=noninteractive apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm

echo "[1/8] Instalando dependencias del sistema..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl wget net-tools git \
  build-essential cmake pkg-config \
  gnupg rtl-sdr librtlsdr-dev libsox-fmt-all sox

echo "[2/8] Compilando e instalando rtl_ais..."
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

echo "[3/8] Configurando memoria swap (optimizacion para dispositivos con poca RAM)..."
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  echo "  -> Creando 2GB de swap..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "  -> Swap activado"
else
  echo "  -> Swap ya existe, saltando."
fi

echo "[4/8] Preparando directorio de instalacion..."
mkdir -p "$APP_DIR"

# Limpiar directorio de destino completamente para evitar archivos residuales
rm -rf "$APP_DIR/src" "$APP_DIR/.next" "$APP_DIR/node_modules"
rm -f "$APP_DIR/package.json" "$APP_DIR/next.config.js" "$APP_DIR/SUDOERS" "$APP_DIR/sdr-hr.service"

echo "[5/8] Copiando archivos del proyecto..."
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

echo "[6/8] Instalando dependencias de Node.js..."
cd "$APP_DIR"
npm install --production

echo "[7/8] Construyendo la aplicacion Next.js (modo optimizado para baja memoria)..."
npm run build

echo "[8/8] Configurando permisos y servicios..."

# Copiar estaticos para modo standalone
cp -r "$APP_DIR/.next/static" "$APP_DIR/.next/standalone/.next/"
if [ -d "$APP_DIR/public" ]; then
  cp -r "$APP_DIR/public" "$APP_DIR/.next/standalone/"
fi
echo "  -> Archivos estaticos copiados"

# Sudoers - reemplazar 'sdr' con el usuario actual automaticamente
if [ -f "$APP_DIR/SUDOERS" ]; then
  sed "s/^sdr /${CURRENT_USER} /g" "$APP_DIR/SUDOERS" > /etc/sudoers.d/sdr-hr
  chmod 0440 /etc/sudoers.d/sdr-hr
  echo "  -> Sudoers configurado para usuario: ${CURRENT_USER}"
fi

# Systemd
if [ -f "$APP_DIR/sdr-hr.service" ]; then
  cp "$APP_DIR/sdr-hr.service" /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable sdr-hr
  systemctl start sdr-hr
  echo "  -> Servicio systemd habilitado e iniciado"
fi

echo ""
echo "=========================================="
echo "  Deploy completado exitosamente"
echo "=========================================="
echo ""
echo "La app estara disponible en: http://<IP>:3000"
echo ""
echo "Ver estado del servicio:"
echo "  systemctl status sdr-hr"
echo ""
echo "Ver logs:"
echo "  journalctl -u sdr-hr -f"
echo ""
