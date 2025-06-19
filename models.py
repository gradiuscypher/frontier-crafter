from pydantic import BaseModel, Field


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

