import uuid

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


class Material(BaseModel):
    quantity: int
    type_id: int = Field(alias="typeID")
    name: str


class FrontierBlueprint(BaseModel):
    bp_id: int
    structures: list[str]
    materials: list[Material]
    time: int
    max_production: int
    product_count: int
    product_name: str


class CraftingSession(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    crafting_targets: list["CraftingTarget"] = Relationship(back_populates="crafting_session")
    session_uuid: uuid.UUID = Field(default_factory=uuid.uuid4)


class CraftingTarget(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    item_id: int
    needed_quantity: int
    crafted_quantity: int = 0
    blueprint_id: int
    crafting_session: CraftingSession = Relationship(back_populates="crafting_targets")
    session_id: int = Field(foreign_key="craftingsession.id")
    ingredients: list["CraftingIngredient"] = Relationship(back_populates="crafting_target")


class CraftingIngredient(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    item_id: int
    needed_quantity: int
    crafted_quantity: int = 0
    crafting_target: CraftingTarget = Relationship(back_populates="ingredients")
    target_id: int = Field(foreign_key="craftingtarget.id")
