.PHONY: help docker-build docker-run docker-stop docker-logs docker-compose-up docker-compose-down docker-clean docker-rebuild

help:
	@echo "Pipeline Manager Docker Scripts"
	@echo "================================"
	@echo ""
	@echo "Available commands:"
	@echo "  make docker-build              Build Docker image"
	@echo "  make docker-run                Run Docker container (foreground)"
	@echo "  make docker-run-detach         Run Docker container (background)"
	@echo "  make docker-stop               Stop running container"
	@echo "  make docker-logs               View container logs"
	@echo "  make docker-compose-up         Run with Docker Compose (foreground)"
	@echo "  make docker-compose-up-detach  Run with Docker Compose (background)"
	@echo "  make docker-compose-down       Stop Docker Compose services"
	@echo "  make docker-clean              Remove Docker image and stopped containers"
	@echo "  make docker-rebuild            Force rebuild Docker image"
	@echo ""

docker-build:
	@bash scripts/docker-build.sh

docker-run: docker-build
	@bash scripts/docker-run.sh

docker-run-detach: docker-build
	@bash scripts/docker-run.sh --detach

docker-stop:
	@docker stop pipeline-manager || true

docker-logs:
	@docker logs -f pipeline-manager

docker-compose-up:
	@bash scripts/docker-compose-up.sh

docker-compose-up-detach:
	@bash scripts/docker-compose-up.sh --detach

docker-compose-down:
	@cd . && docker-compose down

docker-clean:
	@docker rmi pipeline-manager:latest || true
	@docker container prune -f

docker-rebuild: docker-clean docker-build

.DEFAULT_GOAL := help
