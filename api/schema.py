import uuid
from collections.abc import Generator

from sqlalchemy.orm import selectinload
from sqlmodel import Field, Relationship, Session, SQLModel, create_engine, select

sqlite_file_name = "crafting_tool.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


class CraftingSession(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    crafting_targets: list["CraftingTarget"] = Relationship(back_populates="crafting_session")
    session_uuid: uuid.UUID = Field(default_factory=uuid.uuid4)

    model_config = {"from_attributes": True}

    @staticmethod
    def create_session(crafting_targets: list["CraftingTarget"]) -> uuid.UUID:
        with Session(engine) as session:
            new_crafting_session = CraftingSession(crafting_targets=crafting_targets)
            session.add(new_crafting_session)
            session.commit()
            session.refresh(new_crafting_session)
            return new_crafting_session.session_uuid

    @staticmethod
    def get_session(session_uuid: uuid.UUID) -> "CraftingSession | None":
        with Session(engine) as session:
            query = (
                select(CraftingSession)
                .where(CraftingSession.session_uuid == session_uuid)
                .options(
                    selectinload(CraftingSession.crafting_targets).selectinload(CraftingTarget.ingredients), # type: ignore[arg-type]
                )
            )
            return session.exec(query).first()

    @staticmethod
    def add_target(session_uuid: uuid.UUID, crafting_target: "CraftingTarget") -> "CraftingSession | None":
        with Session(engine) as session:
            # Query for the existing session
            query = (
                select(CraftingSession)
                .where(CraftingSession.session_uuid == session_uuid)
                .options(
                    selectinload(CraftingSession.crafting_targets).selectinload(CraftingTarget.ingredients), # type: ignore[arg-type]
                )
            )
            crafting_session = session.exec(query).first()
            if crafting_session is None:
                return None

            # Set the foreign key relationship
            crafting_target.session_id = crafting_session.id
            crafting_target.crafting_session = crafting_session

            # Add the target to the session
            session.add(crafting_target)
            session.commit()
            session.refresh(crafting_session)
            return crafting_session


class CraftingTarget(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    item_id: int
    needed_quantity: int
    crafted_quantity: int = 0
    blueprint_id: int = 0  # Add default value
    crafting_session: CraftingSession = Relationship(back_populates="crafting_targets")
    session_id: int = Field(foreign_key="craftingsession.id")
    ingredients: list["CraftingIngredient"] = Relationship(back_populates="crafting_target")

    model_config = {"from_attributes": True}


class CraftingIngredient(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    item_id: int
    needed_quantity: int
    crafted_quantity: int = 0
    crafting_target: CraftingTarget = Relationship(back_populates="ingredients")
    target_id: int = Field(foreign_key="craftingtarget.id")

    model_config = {"from_attributes": True}
