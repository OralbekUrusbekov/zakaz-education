from fastapi.testclient import TestClient


def test_login_returns_token_and_user(client: TestClient):
    res = client.post("/api/v1/auth/login", json={"email": "student@techschool.kz", "password": "password123"})
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["role"] == "student"
    assert body["user"]["full_name"] == "Анна Ким"


def test_login_is_case_insensitive(client: TestClient):
    res = client.post("/api/v1/auth/login", json={"email": "Student@TechSchool.KZ", "password": "password123"})
    assert res.status_code == 200


def test_login_with_wrong_password_fails(client: TestClient):
    res = client.post("/api/v1/auth/login", json={"email": "student@techschool.kz", "password": "nope"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Неверный email или пароль"


def test_login_with_unknown_email_fails(client: TestClient):
    res = client.post("/api/v1/auth/login", json={"email": "ghost@techschool.kz", "password": "password123"})
    assert res.status_code == 401


def test_me_requires_token(client: TestClient):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_rejects_broken_token(client: TestClient):
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert res.status_code == 401


def test_me_returns_current_user(client: TestClient, teacher_headers: dict):
    res = client.get("/api/v1/auth/me", headers=teacher_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "teacher"


def test_role_guard_blocks_foreign_cabinet(client: TestClient, student_headers: dict, teacher_headers: dict):
    assert client.get("/api/v1/analytics/dashboard", headers=student_headers).status_code == 403
    assert client.get("/api/v1/students/me/overview", headers=teacher_headers).status_code == 403


def test_courses_are_public(client: TestClient):
    res = client.get("/api/v1/courses")
    assert res.status_code == 200
    assert len(res.json()) == 6


def test_health(client: TestClient):
    assert client.get("/health").json() == {"status": "ok"}
