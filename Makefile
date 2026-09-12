.PHONY: test dev backend frontend docker-up docker-down

test:
	py -3.11 -m pytest tests/ -v

backend:
	py -3.11 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make backend' in one terminal and 'make frontend' in another."

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
