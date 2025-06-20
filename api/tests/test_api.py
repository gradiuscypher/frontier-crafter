from collections.abc import Generator
from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from api import app
from schema import get_session


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
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


def test_add_target(client: TestClient) -> None:
    response = client.post("/crafting-session")
    assert response.status_code == HTTPStatus.OK
    session_id = response.json()

    response = client.post(f"/crafting-session/{session_id}/target", json={"item_id": 1, "needed_quantity": 10})
    assert response.status_code == HTTPStatus.OK
    assert response.json()["session_uuid"] == session_id
