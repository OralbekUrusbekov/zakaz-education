from fastapi.testclient import TestClient

API = "/api/v1/registrations"
PAYLOAD = {
    "event_slug": "open-day",
    "event_title": "День открытых дверей",
    "event_date": "25 сентября 2026",
    "full_name": "Айгуль Серикбаева",
    "phone": "+7 777 123 45 67",
    "email": "aigul@example.kz",
    "people": 3,
    "comment": "Придём с двумя детьми",
}


def test_registration_is_public(client: TestClient):
    res = client.post(API, json=PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["event_title"] == PAYLOAD["event_title"]
    assert body["full_name"] == PAYLOAD["full_name"]
    assert body["id"] > 0


def test_registration_stores_row(client: TestClient, db):
    from app.models import EventRegistration

    before = db.query(EventRegistration).count()
    client.post(API, json={**PAYLOAD, "full_name": "Марат Асанов"})
    db.expire_all()
    assert db.query(EventRegistration).count() == before + 1


def test_optional_fields_can_be_empty(client: TestClient):
    res = client.post(API, json={
        "event_slug": "seminar",
        "event_title": "Семинар",
        "full_name": "Дана Ким",
        "phone": "87001234567",
    })
    assert res.status_code == 201
    assert res.json()["full_name"] == "Дана Ким"


def test_short_name_is_rejected(client: TestClient):
    assert client.post(API, json={**PAYLOAD, "full_name": "А"}).status_code == 422


def test_short_phone_is_rejected(client: TestClient):
    assert client.post(API, json={**PAYLOAD, "phone": "123"}).status_code == 422


def test_people_limits(client: TestClient):
    assert client.post(API, json={**PAYLOAD, "people": 0}).status_code == 422
    assert client.post(API, json={**PAYLOAD, "people": 21}).status_code == 422
    assert client.post(API, json={**PAYLOAD, "people": 20}).status_code == 201
