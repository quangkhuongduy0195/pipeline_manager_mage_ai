#!/bin/bash

# Script to build and run using Docker Compose
# Usage: ./scripts/docker-compose-up.sh [OPTIONS]
# Options:
#   -d, --detach      Run in background
#   -b, --build       Force rebuild
#   -h, --help        Show this help message

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
DETACH=false
BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--detach)
      DETACH=true
      shift
      ;;
    -b|--build)
      BUILD=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -d, --detach      Run in background"
      echo "  -b, --build       Force rebuild"
      echo "  -h, --help        Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${YELLOW}⚠️  .env file not found${NC}"
  echo -e "${BLUE}Creating a default .env file...${NC}"
  cat > "$PROJECT_ROOT/.env" << 'EOF'
# Pipeline Manager Environment Variables
VITE_API_KEY=your_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
EOF
  echo -e "${GREEN}✅ Default .env file created${NC}"
fi

# Build compose command
COMPOSE_CMD="docker-compose"

if [ "$BUILD" = true ]; then
  COMPOSE_CMD="$COMPOSE_CMD -f $PROJECT_ROOT/docker-compose.yml build --no-cache"
  echo -e "${YELLOW}🏗️  Building Docker images (force rebuild)...${NC}"
  eval $COMPOSE_CMD
  COMPOSE_CMD="docker-compose"
fi

COMPOSE_CMD="$COMPOSE_CMD -f $PROJECT_ROOT/docker-compose.yml up"

if [ "$DETACH" = true ]; then
  COMPOSE_CMD="$COMPOSE_CMD -d"
fi

cd "$PROJECT_ROOT"

echo -e "${YELLOW}🚀 Starting services with Docker Compose...${NC}"
eval $COMPOSE_CMD

if [ "$DETACH" = true ]; then
  echo -e "${GREEN}✅ Services started in background${NC}"
  echo -e "${GREEN}Access the application at: http://localhost:8008${NC}"
  echo -e "${YELLOW}View logs with: docker-compose logs -f${NC}"
  echo -e "${YELLOW}Stop services with: docker-compose down${NC}"
else
  echo -e "${GREEN}✅ Services running (press Ctrl+C to stop)${NC}"
fi
