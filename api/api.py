from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import FrontierBlueprint
from tools import create_crafting_json, item_search

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # Common React port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
blueprints, item_types = create_crafting_json("blueprint.db", "typelistSelection.json", "typelist.json")


@app.get("/items/{item_id}")
def get_item(item_id: int) -> list[FrontierBlueprint]:
    """
    Return an item by its item ID
    """
    if item_id not in blueprints:
        raise HTTPException(status_code=404, detail="Item not found")

    return [FrontierBlueprint.model_validate(bp) for bp in blueprints[item_id]]


@app.get("/search/{item_name}")
def search_item(item_name: str) -> list[dict[str, Any]]:
    """
    Search for partial matches of item name and return a dict of item_id to item_name
    """
    return item_search(item_types, item_name)
