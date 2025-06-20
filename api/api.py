import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from models import FrontierBlueprint
from schema import CraftingSession, CraftingTarget, create_db_and_tables, get_session
from tools import create_crafting_json, item_search


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    create_db_and_tables()
    yield
    # Shutdown (if needed)


app = FastAPI(lifespan=lifespan)
SessionDep = Annotated[Session, Depends(get_session)]


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


@app.post("/crafting-session")
def create_crafting_session() -> uuid.UUID:
    return CraftingSession.create_session(crafting_targets=[])


@app.get("/crafting-session/{session_uuid}")
def get_crafting_session(session_uuid: uuid.UUID) -> dict[str, Any]:
    target_session = CraftingSession.get_session(session_uuid)
    if target_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return target_session.model_dump()


@app.post("/crafting-session/{session_uuid}/target")
def add_target(session_uuid: uuid.UUID, crafting_target: CraftingTarget) -> dict[str, Any]:
    result = CraftingSession.add_target(session_uuid, crafting_target)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result.model_dump()
