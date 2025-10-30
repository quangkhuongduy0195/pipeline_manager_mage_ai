#!/bin/bash

# Script to run Docker container for Pipeline Manager
# Usage: ./scripts/docker-run.sh [OPTIONS]
# Options:
#   -p, --port PORT       Port to expose (default: 8008)
#   -d, --detach          Run container in background
#   -e, --env-file FILE   Path to .env file (default: ./.env)
#   -h, --help            Show this help message

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PORT=8008
DETACH=false
ENV_FILE="$PROJECT_ROOT/.env"
CONTAINER_NAME="pipeline-manager"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -d|--detach)
      DETACH=true
      shift
      ;;
    -e|--env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -p, --port PORT       Port to expose (default: 8008)"
      echo "  -d, --detach          Run container in background"
      echo "  -e, --env-file FILE   Path to .env file (default: ./.env)"
      echo "  -h, --help            Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if image exists
if ! docker image inspect pipeline-manager:latest > /dev/null 2>&1; then
  echo -e "${YELLOW}📦 Docker image not found. Building...${NC}"
  bash "$SCRIPT_DIR/docker-build.sh"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚠️  .env file not found at $ENV_FILE${NC}"
  echo -e "${BLUE}Creating a default .env file...${NC}"
  cat > "$ENV_FILE" << 'EOF'
# Pipeline Manager Environment Variables
VITE_API_KEY=your_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
EOF
  echo -e "${GREEN}✅ Default .env file created at $ENV_FILE${NC}"
fi

# Build run command
RUN_CMD="docker run --name $CONTAINER_NAME --rm"

if [ "$DETACH" = true ]; then
  RUN_CMD="$RUN_CMD -d"
fi

RUN_CMD="$RUN_CMD -p $PORT:8008 --env-file $ENV_FILE pipeline-manager:latest"

echo -e "${YELLOW}🚀 Starting Pipeline Manager container...${NC}"
echo -e "${BLUE}Port: $PORT${NC}"
echo -e "${BLUE}ENV File: $ENV_FILE${NC}"

# Check if container is already running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  Container already running. Stopping existing container...${NC}"
  docker stop $CONTAINER_NAME || true
fi

# Run the container
eval $RUN_CMD

if [ "$DETACH" = true ]; then
  echo -e "${GREEN}✅ Container started in background${NC}"
  echo -e "${GREEN}Access the application at: http://localhost:$PORT${NC}"
  echo -e "${YELLOW}View logs with: docker logs -f $CONTAINER_NAME${NC}"
  echo -e "${YELLOW}Stop container with: docker stop $CONTAINER_NAME${NC}"
else
  echo -e "${GREEN}✅ Container running (press Ctrl+C to stop)${NC}"
  echo -e "${GREEN}Access the application at: http://localhost:$PORT${NC}"
fi
