"""Тестовое окружение: отдельная SQLite-база в памяти файла + демо-данные из seed."""
import os
import tempfile
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

TMP_DIR = tempfile.mkdtemp(prefix="techschool-tests-")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{TMP_DIR}/test.db")
os.environ.setdefault("UPLOAD_DIR", f"{TMP_DIR}/uploads")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import DEMO_PASSWORD, seed  # noqa: E402

engine = create_engine(f"sqlite:///{TMP_DIR}/test.db", connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def database() -> Iterator[None]:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestSession() as db:
        seed(db)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="session")
def client(database: None) -> Iterator[TestClient]:
    def override() -> Iterator[Session]:
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    # lifespan не запускаем: база уже подготовлена фикстурой
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def db() -> Iterator[Session]:
    session = TestSession()
    yield session
    session.close()


def _token(client: TestClient, email: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": DEMO_PASSWORD})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def student_headers(client: TestClient) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(client, 'student@techschool.kz')}"}


@pytest.fixture(scope="session")
def teacher_headers(client: TestClient) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(client, 'teacher@techschool.kz')}"}


@pytest.fixture(scope="session")
def admin_headers(client: TestClient) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(client, 'admin@techschool.kz')}"}
