from collections.abc import Generator
from http import HTTPStatus
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

import schema
from api import app
from schema import get_session

TARGET_ITEM_ID = 88561
TARGET_BLUEPRINT_ID = 88611


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    # Patch the engine in schema module to use our test engine
    with patch.object(schema, "engine", engine), Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override() -> Session:
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_create_session(client: TestClient) -> None:
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    assert response.json() is not None


def test_get_session(client: TestClient) -> None:
    # create a session to fetch next
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    session_id = response.json()

    response = client.get(f"/crafting-session/{session_id}")
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id


def test_get_targets(client: TestClient) -> None:
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    session_id = response.json()

    response = client.post(f"/crafting-session/{session_id}/target", json={"item_id": TARGET_ITEM_ID, "needed_quantity": 10, "blueprint_id": TARGET_BLUEPRINT_ID})
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id

    response = client.get(f"/crafting-session/{session_id}/targets")
    assert response.status_code == HTTPStatus.OK
    assert response.json() == [{"item_id": TARGET_ITEM_ID, "needed_quantity": 10, "blueprint_id": TARGET_BLUEPRINT_ID, "crafted_quantity": 0, "session_id": 1, "id": 1}]


def test_get_target_ingredients(client: TestClient) -> None:
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    session_id = response.json()

    response = client.post(f"/crafting-session/{session_id}/target", json={"item_id": TARGET_ITEM_ID, "needed_quantity": 10, "blueprint_id": TARGET_BLUEPRINT_ID})
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id

    response = client.get(f"/crafting-session/{session_id}/target/{TARGET_ITEM_ID}/ingredients")
    assert response.status_code == HTTPStatus.OK


def test_modify_ingredient_quantity(client: TestClient) -> None:
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    session_id = response.json()

    response = client.post(f"/crafting-session/{session_id}/target", json={"item_id": TARGET_ITEM_ID, "needed_quantity": 10, "blueprint_id": TARGET_BLUEPRINT_ID})
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id

    response = client.post(f"/crafting-session/{session_id}/target/{TARGET_ITEM_ID}/ingredient/77811/100")
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id

    response = client.get(f"/crafting-session/{session_id}/target/{TARGET_ITEM_ID}/ingredients")
    assert response.status_code == HTTPStatus.OK
    assert response.json() == [{"item_id": 77811, "needed_quantity": 728, "crafted_quantity": 100, "id": 1, "target_id": 1}]
