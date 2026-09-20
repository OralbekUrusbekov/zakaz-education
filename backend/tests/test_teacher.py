from fastapi.testclient import TestClient

API = "/api/v1"


def _first_group(client: TestClient, headers: dict) -> dict:
    groups = client.get(f"{API}/teachers/me/groups", headers=headers).json()
    assert groups
    return groups[0]


def test_overview(client: TestClient, teacher_headers: dict):
    body = client.get(f"{API}/teachers/me/overview", headers=teacher_headers).json()
    assert body["groups_count"] >= 1
    assert body["students_count"] > 0
    assert body["pending_submissions"] >= len(body["recent_submissions"])


def test_groups_have_stats(client: TestClient, teacher_headers: dict):
    for g in client.get(f"{API}/teachers/me/groups", headers=teacher_headers).json():
        assert g["students_count"] > 0
        assert g["average_grade"] is None or 1 <= g["average_grade"] <= 10


def test_students_filtered_by_group(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    rows = client.get(f"{API}/teachers/me/students", headers=teacher_headers, params={"group_id": group["id"]}).json()
    assert rows and all(r["group_id"] == group["id"] for r in rows)
    assert all(r["payment_status"] in {"paid", "pending", "overdue"} for r in rows)


def test_foreign_group_is_not_found(client: TestClient, teacher_headers: dict):
    assert client.get(f"{API}/teachers/me/students", headers=teacher_headers, params={"group_id": 999}).status_code == 404


def test_student_detail(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    student = client.get(f"{API}/teachers/me/students", headers=teacher_headers, params={"group_id": group["id"]}).json()[0]
    body = client.get(f"{API}/teachers/me/students/{student['id']}", headers=teacher_headers, params={"group_id": group["id"]}).json()
    assert body["student"]["id"] == student["id"]
    assert body["homework_submitted"] <= body["homework_total"]


def test_gradebook_structure(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    body = client.get(f"{API}/teachers/me/gradebook", headers=teacher_headers, params={"group_id": group["id"]}).json()
    assert body["group"]["id"] == group["id"]
    assert body["students"] and body["lessons"]
    lesson_ids = {l["id"] for l in body["lessons"]}
    student_ids = {s["id"] for s in body["students"]}
    for g in body["grades"]:
        assert g["student_id"] in student_ids
        assert g["lesson_id"] is None or g["lesson_id"] in lesson_ids


def test_grade_crud(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    book = client.get(f"{API}/teachers/me/gradebook", headers=teacher_headers, params={"group_id": group["id"]}).json()
    student = book["students"][0]
    lesson = book["lessons"][-1]

    created = client.post(
        f"{API}/grades",
        headers=teacher_headers,
        json={"student_id": student["id"], "group_id": group["id"], "lesson_id": lesson["id"], "value": 9, "type": "classwork"},
    )
    assert created.status_code == 201
    grade = created.json()
    assert grade["value"] == 9 and grade["date"] == lesson["starts_at"][:10]

    updated = client.patch(f"{API}/grades/{grade['id']}", headers=teacher_headers, json={"value": 7, "comment": "исправлено"})
    assert updated.status_code == 200 and updated.json()["value"] == 7

    assert client.delete(f"{API}/grades/{grade['id']}", headers=teacher_headers).status_code == 204
    assert client.patch(f"{API}/grades/{grade['id']}", headers=teacher_headers, json={"value": 8}).status_code == 404


def test_grade_scale_is_ten_points(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    book = client.get(f"{API}/teachers/me/gradebook", headers=teacher_headers, params={"group_id": group["id"]}).json()
    payload = {"student_id": book["students"][0]["id"], "group_id": group["id"], "value": 10, "type": "test"}
    ok = client.post(f"{API}/grades", headers=teacher_headers, json=payload)
    assert ok.status_code == 201
    client.delete(f"{API}/grades/{ok.json()['id']}", headers=teacher_headers)
    assert client.post(f"{API}/grades", headers=teacher_headers, json={**payload, "value": 11}).status_code == 422
    assert client.post(f"{API}/grades", headers=teacher_headers, json={**payload, "value": 0}).status_code == 422


def test_grade_for_student_outside_group_is_rejected(client: TestClient, teacher_headers: dict, admin_headers: dict):
    group = _first_group(client, teacher_headers)
    res = client.post(
        f"{API}/grades",
        headers=teacher_headers,
        json={"student_id": 1, "group_id": group["id"], "value": 8, "type": "test"},
    )
    assert res.status_code == 400


def test_attendance_sheet_and_save(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    sheet = client.get(f"{API}/attendance", headers=teacher_headers, params={"group_id": group["id"]}).json()
    assert sheet["lesson"] and sheet["rows"]
    lesson_id = sheet["lesson"]["id"]
    student_id = sheet["rows"][0]["student_id"]

    saved = client.post(
        f"{API}/attendance",
        headers=teacher_headers,
        json={"lesson_id": lesson_id, "records": [{"student_id": student_id, "status": "late"}]},
    ).json()
    assert next(r for r in saved["rows"] if r["student_id"] == student_id)["status"] == "late"


def test_attendance_rejects_foreign_student(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    sheet = client.get(f"{API}/attendance", headers=teacher_headers, params={"group_id": group["id"]}).json()
    res = client.post(
        f"{API}/attendance",
        headers=teacher_headers,
        json={"lesson_id": sheet["lesson"]["id"], "records": [{"student_id": 1, "status": "present"}]},
    )
    assert res.status_code == 400


def test_review_submission_creates_grade(client: TestClient, teacher_headers: dict):
    pending = client.get(f"{API}/teachers/me/submissions", headers=teacher_headers, params={"status": "submitted"}).json()
    assert pending
    sub = pending[0]
    reviewed = client.patch(
        f"{API}/submissions/{sub['id']}",
        headers=teacher_headers,
        json={"status": "reviewed", "grade": 9, "teacher_comment": "Хорошо"},
    ).json()
    assert reviewed["status"] == "reviewed" and reviewed["grade"] == 9

    book = client.get(f"{API}/teachers/me/gradebook", headers=teacher_headers, params={"group_id": sub["group_id"]}).json()
    homework_grades = [g for g in book["grades"] if g["student_id"] == sub["student_id"] and g["type"] == "homework"]
    assert any(g["value"] == 9 for g in homework_grades)


def test_review_without_grade_is_rejected(client: TestClient, teacher_headers: dict):
    pending = client.get(f"{API}/teachers/me/submissions", headers=teacher_headers, params={"status": "submitted"}).json()
    if not pending:
        return
    res = client.patch(f"{API}/submissions/{pending[0]['id']}", headers=teacher_headers, json={"status": "reviewed"})
    assert res.status_code == 422


def test_send_to_revision_clears_grade(client: TestClient, teacher_headers: dict):
    pending = client.get(f"{API}/teachers/me/submissions", headers=teacher_headers, params={"status": "submitted"}).json()
    if not pending:
        return
    body = client.patch(
        f"{API}/submissions/{pending[0]['id']}",
        headers=teacher_headers,
        json={"status": "revision", "teacher_comment": "Доработайте вторую часть"},
    ).json()
    assert body["status"] == "revision" and body["grade"] is None


def test_create_homework(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    res = client.post(
        f"{API}/teachers/me/homework",
        headers=teacher_headers,
        json={"group_id": group["id"], "title": "Тестовое задание", "description": "Описание", "due_date": "2030-01-01T23:59:00"},
    )
    assert res.status_code == 201
    assert res.json()["students"] == group["students_count"]


def test_comments_flow(client: TestClient, teacher_headers: dict):
    group = _first_group(client, teacher_headers)
    student = client.get(f"{API}/teachers/me/students", headers=teacher_headers, params={"group_id": group["id"]}).json()[0]
    created = client.post(
        f"{API}/comments",
        headers=teacher_headers,
        json={"student_id": student["id"], "kind": "praise", "text": "Отличная работа"},
    )
    assert created.status_code == 201
    mine = client.get(f"{API}/comments", headers=teacher_headers, params={"student_id": student["id"]}).json()
    assert any(c["text"] == "Отличная работа" for c in mine)


def test_comment_for_foreign_student_is_rejected(client: TestClient, teacher_headers: dict):
    res = client.post(f"{API}/comments", headers=teacher_headers, json={"student_id": 1, "kind": "praise", "text": "Привет"})
    assert res.status_code == 400
