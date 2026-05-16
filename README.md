# SDR-HR (SDR-Headless Remote)

Aplicación web para gestionar receptores RTL-SDR en sistemas empotrados Linux (Armbian/Debian). Actúa como instalador dinámico y orquestador de servicios SDR, permitiendo cambiar entre modos de operación sin acceso SSH.

## Características

- **Panel de Instalación**: Instala OpenWebRX, SpyServer y rtl_tcp con un clic
- **Orquestador de Servicios**: Cambia entre modos Web, Red y TCP sin conflictos de hardware USB
- **Monitor de Estado**: Visualización en tiempo real del estado de cada servicio
- **Monitor del Sistema**: Temperatura, CPU, RAM, Swap, red y uptime
- **100% Headless**: No requiere monitor ni teclado en la placa
- **Optimizado para baja memoria**: Funciona en Orange Pi Zero (256MB RAM)
- **Detección automática de arquitectura**: Descarga el binario correcto para ARM32/ARM64/x64

## Requisitos

- Placa SBC con Armbian/Debian (Orange Pi Zero, Raspberry Pi, etc.)
- Receptor RTL-SDR conectado por USB
- Conexión de red (Ethernet o WiFi)
- Acceso root o sudo

## Instalación

### Método 1: Clonar y ejecutar deploy.sh

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/sdr-hr.git
cd sdr-hr

# Ejecutar el script de despliegue (requiere root)
sudo bash deploy.sh
```

El script `deploy.sh` realiza automáticamente:
1. Instalación de dependencias del sistema (curl, wget, git, build-essential, etc.)
2. Compilación e instalación de `rtl_ais` desde fuente
3. Creación de swap (512MB) si no existe
4. Copia de archivos del proyecto a `/opt/sdr-hr`
5. Instalación de dependencias Node.js
6. Build de la aplicación Next.js
7. Configuración de sudoers y servicio systemd

### Método 2: Instalación manual

```bash
# Instalar dependencias
sudo apt-get update
sudo apt-get install -y nodejs npm curl wget git build-essential cmake rtl-sdr

# Clonar y construir
git clone https://github.com/TU_USUARIO/sdr-hr.git
cd sdr-hr
npm install --production
npm run build

# Copiar estáticos para modo standalone
cp -r .next/static .next/standalone/.next/

# Configurar servicio
sudo cp sdr-hr.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sdr-hr
```

## Configuración de permisos

El archivo `SUDOERS` configura los permisos necesarios para que la aplicación ejecute comandos de sistema sin contraseña:

```bash
# Copiar configuración de sudoers
sudo cp SUDOERS /etc/sudoers.d/sdr-hr
sudo chmod 0440 /etc/sudoers.d/sdr-hr

# Editar y cambiar 'sdr' por tu usuario real
sudo visudo -f /etc/sudoers.d/sdr-hr
```

## Uso

Una vez instalada, accede a la aplicación desde cualquier navegador:

```
http://<IP-de-tu-placa>:3000
```

### Panel de Instalación

- **Instalar OpenWebRX**: Instala el receptor web SDR desde el repositorio oficial Debian
- **Instalar SpyServer**: Descarga y configura el servidor Airspy para tu arquitectura
- **Instalar rtl_tcp**: Instala el servidor TCP para SDR
- **Reinstalar**: Cada servicio tiene su propio botón de reinstalación con confirmación

### Orquestador de Servicios

Solo un servicio puede usar el sintonizador USB a la vez:

- **Modo Web (OpenWebRX)**: Interfaz web completa para escuchar radio
- **Modo Red (SpyServer)**: Servidor para clientes SDR remotos (SDR#, SDR++)
- **Modo TCP (rtl_tcp)**: Servidor TCP raw para aplicaciones SDR
- **Apagado Total**: Libera el sintonizador USB completamente

### Monitor del Sistema

Actualización automática cada 5 segundos:
- Temperatura del SoC
- Uso de CPU
- RAM y Swap con barras de progreso
- Tráfico de red (RX/TX)
- Uptime del sistema

## Servicios instalados

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| OpenWebRX | 8073 | Receptor web SDR completo |
| SpyServer | 5555 | Servidor Airspy para clientes remotos |
| rtl_tcp | 1234 | Servidor TCP raw para SDR |
| SDR-HR | 3000 | Panel de control web |

## Estructura del proyecto

```
sdr-hr/
├── deploy.sh                 # Script de despliegue autónomo
├── sdr-hr.service            # Servicio systemd
├── SUDOERS                   # Configuración de permisos
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── install/      # Endpoints de instalación
│   │   │   ├── service/      # Orquestador de servicios
│   │   │   ├── status/       # Estado de servicios
│   │   │   └── system/       # Métricas del sistema
│   │   ├── layout.jsx
│   │   └── page.jsx
│   ├── components/           # Componentes React
│   └── lib/
│       └── exec.js           # Wrapper para comandos de sistema
└── package.json
```

## Notas importantes

- **Exclusión mutua**: El sintonizador USB solo admite un proceso a la vez. El orquestador asegura la parada estricta antes de iniciar otro servicio.
- **Automatización no interactiva**: Todos los comandos usan `DEBIAN_FRONTEND=noninteractive` y `-y` para evitar bloqueos.
- **Detección de arquitectura**: SpyServer detecta automáticamente ARM32/ARM64/x64 y descarga el binario correcto.
- **OpenWebRX**: Se detecta la versión de Debian (buster/bullseye) para usar el repositorio correcto.

## Licencia

MIT

---

Desarrollado para sistemas empotrados con recursos limitados.
