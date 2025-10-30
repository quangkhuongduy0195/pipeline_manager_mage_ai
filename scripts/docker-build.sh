#!/bin/bash

# Script to build Docker image for Pipeline Manager
# Usage: ./scripts/docker-build.sh

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🐳 Building Docker image for Pipeline Manager...${NC}"

# Build the Docker image
cd "$PROJECT_ROOT"
docker build -t pipeline-manager:latest -f Dockerfile .

echo -e "${GREEN}✅ Docker image built successfully!${NC}"
echo -e "${GREEN}Image: pipeline-manager:latest${NC}"
