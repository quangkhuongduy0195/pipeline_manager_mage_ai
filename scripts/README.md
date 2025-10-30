# Docker Scripts for Pipeline Manager

This directory contains convenient scripts for building and running the Pipeline Manager application using Docker.

## Available Scripts

### 1. `docker-build.sh`
Builds the Docker image for the Pipeline Manager.

**Usage:**
```bash
./scripts/docker-build.sh
```

**Output:**
- Creates Docker image tagged as `pipeline-manager:latest`

---

### 2. `docker-run.sh`
Runs the Pipeline Manager in a Docker container with various options.

**Usage:**
```bash
./scripts/docker-run.sh [OPTIONS]
```

**Options:**
- `-p, --port PORT` - Expose on a specific port (default: 8008)
- `-d, --detach` - Run container in background
- `-e, --env-file FILE` - Path to .env file (default: ./.env)
- `-h, --help` - Show help message

**Examples:**
```bash
# Run in foreground on default port 8008
./scripts/docker-run.sh

# Run in background on port 3000
./scripts/docker-run.sh --detach --port 3000

# Run with custom .env file
./scripts/docker-run.sh --env-file ./config/.env.production
```

**Features:**
- Automatically builds image if not found
- Creates default .env file if missing
- Stops existing container if already running
- Shows helpful logs and access information

---

### 3. `docker-compose-up.sh`
Runs the application using Docker Compose (best for managing multiple services).

**Usage:**
```bash
./scripts/docker-compose-up.sh [OPTIONS]
```

**Options:**
- `-d, --detach` - Run in background
- `-b, --build` - Force rebuild without cache
- `-h, --help` - Show help message

**Examples:**
```bash
# Run in foreground
./scripts/docker-compose-up.sh

# Run in background
./scripts/docker-compose-up.sh --detach

# Force rebuild and run
./scripts/docker-compose-up.sh --build --detach
```

---

### 4. `Makefile`
Convenient make targets for all Docker operations.

**Usage:**
```bash
make [target]
```

**Available Targets:**
```bash
make help                      # Show all available commands
make docker-build              # Build Docker image
make docker-run                # Run in foreground
make docker-run-detach         # Run in background
make docker-stop               # Stop running container
make docker-logs               # View container logs
make docker-compose-up         # Run Docker Compose (foreground)
make docker-compose-up-detach  # Run Docker Compose (background)
make docker-compose-down       # Stop Docker Compose services
make docker-clean              # Remove image and containers
make docker-rebuild            # Force rebuild image
```

**Examples:**
```bash
# Show all available commands
make help

# Build and run in one command
make docker-run-detach

# View logs
make docker-logs

# Clean everything
make docker-clean
```

---

## Quick Start

### Option 1: Using Shell Scripts
```bash
# Build the image
./scripts/docker-build.sh

# Run the container
./scripts/docker-run.sh --detach

# Access the app at http://localhost:8008
```

### Option 2: Using Docker Compose
```bash
# Build and run everything
./scripts/docker-compose-up.sh --detach

# Access the app at http://localhost:8008

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Using Make
```bash
# Show available commands
make help

# Run everything at once
make docker-run-detach

# View logs
make docker-logs

# Clean up
make docker-clean
```

---

## Environment Variables

The scripts expect a `.env` file in the project root with:
```env
VITE_API_KEY=your_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
```

If the `.env` file doesn't exist, the `docker-run.sh` and `docker-compose-up.sh` scripts will create a default one.

---

## Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View Docker images
docker images

# View container logs
docker logs -f pipeline-manager

# Execute command in running container
docker exec -it pipeline-manager /bin/sh

# Remove container
docker rm pipeline-manager

# Remove image
docker rmi pipeline-manager:latest

# Build without cache
docker build --no-cache -t pipeline-manager:latest .

# Prune unused Docker resources
docker system prune -a
```

---

## Troubleshooting

### Container fails to start
1. Check if port 8008 is already in use: `lsof -i :8008`
2. View logs: `docker logs pipeline-manager`
3. Ensure .env file is properly configured

### Image not found
- Run `./scripts/docker-build.sh` to build the image

### Permission denied on scripts
```bash
chmod +x scripts/*.sh
```

### Docker not running
- Start Docker Desktop or ensure Docker daemon is running

---

## Docker Architecture

The application uses a multi-stage Docker build:
1. **Build Stage**: Uses Node.js to install dependencies and build the app
2. **Production Stage**: Uses Nginx to serve the built application

This results in a lightweight production image that efficiently serves the React application.
