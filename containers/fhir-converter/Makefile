.PHONY: help run-docker run-python build-image

# Load configuration files
include ../config.env
-include ../local-config.env

help:
	@echo "\033[1;32mDIBBs FHIR Converter Service Commands:\033[0m"
	@select option in "run-docker" "run-python" "build-image" "docker-local" "docker-local-no-cache" "build-loud" "test-dotnet" "exit"; do \
		case $$option in \
			"run-docker") $(MAKE) run-docker; break;; \
			"run-python") $(MAKE) run-python; break;; \
			"build-image") $(MAKE) build-image; break;; \
			"docker-local") $(MAKE) docker-local; break;; \
			"docker-local-no-cache")  $(MAKE) docker-local-no-cache; break;; \
			"exit") echo "Exiting..."; break;; \
			*) echo "Invalid option. Please try again."; \
		esac; \
	done

run-docker:
	@echo "Running FHIR Converter service using Docker on localhost:$(FHIR_CONVERTER_PORT)..."
	docker pull ghcr.io/cdcgov/phdi/fhir-converter:latest
	docker run -p $(FHIR_CONVERTER_PORT):8080 fhir-converter:latest

run-python:
	@echo "Running FHIR Converter service from Python source on localhost:$(FHIR_CONVERTER_PORT)..."
	python3 -m venv .venv && \
	. .venv/bin/activate && \
	pip install -r requirements.txt && \
	python -m uvicorn app.main:app --host 0.0.0.0 --port $(FHIR_CONVERTER_PORT)

docker-local:
	docker compose up

docker-local-no-cache:
	$(MAKE) build-image-no-cache && docker compose up

build-image:
	@echo "Building Docker image for the FHIR Converter service..."
	docker compose build 

build-image-no-cache:
	@echo "Building Docker image for the FHIR Converter service without cache..."
	docker compose build --no-cache

build-image-no-cache-service:
	@echo "Building Docker image for the FHIR Converter service without cache..."
	docker compose build --build-arg CACHEBUSTSERVICE=$(shell date +%s)
