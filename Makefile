.PHONY: run

run:
	cd api && uv run fastapi dev api.py
