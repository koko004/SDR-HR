# AGENTS.md

This document provides instructions for agentic coding agents working on the SDR-HR repository.

## Project Overview
SDR-HR (SDR-Headless Remote) is a web application designed for managing RTL-SDR receivers on embedded Linux systems (Armbian/Debian). It acts as a dynamic installer and orchestrator for SDR services, allowing switching between operating modes (Web, Network, TCP) without SSH access.

## Build/Lint/Test Commands
This project is a Next.js application optimized for low-resource environments.

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Start**: `npm run start`

**Note**: The application is designed to run on low-memory boards (like Orange Pi Zero). Memory usage is capped via `NODE_OPTIONS='--max-old-space-size=256'`.

### Testing
- There are no formal unit tests defined in `package.json`. Verification involves running the service and monitoring functionality.
- To verify system integration, monitor logs or use the `/api/status` endpoint.

## Code Style Guidelines
- **Framework**: Next.js (React), App Router.
- **Language**: JavaScript (ES6+).
- **Naming Conventions**:
  - Components: `PascalCase.jsx` (e.g., `InstallPanel.jsx`).
  - API Routes: `route.js` within `src/app/api/` directories.
  - Functions/Variables: `camelCase`.
- **Formatting**: Standard JavaScript formatting. Maintain consistency with existing files.
- **Imports**: Use relative imports.
- **Error Handling**: Since this application interacts directly with system commands, all `exec` calls must include robust error handling to prevent service crashes. Use `src/lib/exec.js` as the standard wrapper for executing system commands.
- **Architecture**:
  - `src/app/api`: Handles system commands, service orchestration, and status checks.
  - `src/components`: React components for UI interactions.
  - `src/lib`: Utility functions, specifically for system execution.

## Critical Rules
1. **Exclusion Mutua**: The RTL-SDR tuner can only be used by one service at a time. All orchestration logic **must** ensure the current service is stopped before starting another.
2. **System Interaction**: Use the `lib/exec.js` wrapper to run shell commands. Never run arbitrary commands directly via `child_process` in API routes.
3. **No Interactive Commands**: All system installations must be non-interactive (use `DEBIAN_FRONTEND=noninteractive`, `-y` flags, etc.) to prevent hanging.
4. **Permissions**: The application relies on `SUDOERS` configuration. Assume the environment has proper sudo permissions configured according to the project `SUDOERS` file.
5. **Resource Constraints**: When making changes, prioritize memory efficiency. Avoid heavy dependencies or operations.
6. **Proactiveness**: When suggesting changes, check if they impact the service orchestration or system stability, especially regarding USB tuner access.
7. **File Paths**: Always use absolute paths within the container/host context for system files (e.g., `/etc/systemd/system/`, `/opt/sdr-hr/`).
