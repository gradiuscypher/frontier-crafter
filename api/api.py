from typing import Any

from fastapi import FastAPI, HTTPException

from models import FrontierBlueprint
from tools import create_crafting_json, item_search

app = FastAPI()
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
