from datetime import date, datetime, timedelta

from fastapi.testclient import TestClient

API = "/api/v1/students/me"


def test_overview_has_all_blocks(client: TestClient, student_headers: dict):
    body = client.get(f"{API}/overview", headers=student_headers).json()
    assert set(body) >= {"next_lesson", "today", "attendance_rate", "average_grade", "homework_due", "payment_status", "courses"}
    assert 0 <= body["attendance_rate"] <= 100
    assert 1 <= body["average_grade"] <= 10  # десятибалльная шкала
    assert body["payment_status"] in {"paid", "pending", "overdue"}
    assert all(c["status"] == "active" for c in body["courses"])


def test_schedule_respects_range(client: TestClient, student_headers: dict):
    start = datetime.combine(date.today(), datetime.min.time())
    end = start + timedelta(days=7)
    res = client.get(f"{API}/schedule", headers=student_headers, params={"start": start.isoformat(), "end": end.isoformat()})
    assert res.status_code == 200
    for item in res.json():
        assert start <= datetime.fromisoformat(item["starts_at"]) < end
        assert item["course_name"] and item["teacher_name"]


def test_schedule_empty_range_returns_nothing(client: TestClient, student_headers: dict):
    start = datetime.combine(date.today() + timedelta(days=3650), datetime.min.time())
    res = client.get(f"{API}/schedule", headers=student_headers, params={"start": start.isoformat(), "end": (start + timedelta(days=7)).isoformat()})
    assert res.json() == []


def test_attendance_counts_match_records(client: TestClient, student_headers: dict):
    body = client.get(f"{API}/attendance", headers=student_headers).json()
    assert sum(body["counts"].values()) == len(body["records"])
    assert sum(c["total"] for c in body["by_course"]) == len(body["records"])
    attended = body["counts"]["present"] + body["counts"]["late"]
    assert round(100 * attended / len(body["records"]), 1) == body["rate"]


def test_progress_reports_completed_lessons(client: TestClient, student_headers: dict):
    body = client.get(f"{API}/progress", headers=student_headers).json()
    assert body
    for course in body:
        assert course["completed_lessons"] <= course["total_lessons"]
        assert 0 <= course["progress"] <= 100
        assert len(course["topics"]) == course["total_lessons"]


def test_homework_statuses_are_consistent(client: TestClient, student_headers: dict):
    items = client.get(f"{API}/homework", headers=student_headers).json()
    assert items
    for hw in items:
        if hw["status"] in {"active", "overdue"}:
            assert hw["submission"] is None
        else:
            assert hw["submission"] is not None
        if hw["status"] == "reviewed":
            assert hw["submission"]["grade"] is not None


def test_submit_homework_with_file(client: TestClient, student_headers: dict):
    items = client.get(f"{API}/homework", headers=student_headers).json()
    target = next(h for h in items if h["status"] == "active")
    res = client.post(
        f"{API}/homework/{target['id']}/submit",
        headers=student_headers,
        data={"text": "Готово"},
        files={"file": ("answer.txt", b"solution", "text/plain")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "submitted"
    assert body["submission"]["text"] == "Готово"
    assert body["submission"]["file_name"] == "answer.txt"
    assert body["submission"]["file_url"].startswith("/uploads/")


def test_submit_requires_text_or_file(client: TestClient, student_headers: dict):
    items = client.get(f"{API}/homework", headers=student_headers).json()
    target = next(h for h in items if h["status"] in {"active", "overdue"})
    res = client.post(f"{API}/homework/{target['id']}/submit", headers=student_headers, data={"text": "  "})
    assert res.status_code == 422


def test_submit_foreign_homework_is_not_found(client: TestClient, student_headers: dict):
    res = client.post(f"{API}/homework/999999/submit", headers=student_headers, data={"text": "hi"})
    assert res.status_code == 404


def test_grades_average_matches_items(client: TestClient, student_headers: dict):
    body = client.get(f"{API}/grades", headers=student_headers).json()
    values = [g["value"] for g in body["items"]]
    assert all(1 <= v <= 10 for v in values)
    assert body["average"] == round(sum(values) / len(values), 2)
    assert sum(c["count"] for c in body["by_course"]) == len(values)


def test_payments_and_demo_pay(client: TestClient, student_headers: dict):
    body = client.get(f"{API}/payments", headers=student_headers).json()
    assert body["items"]
    unpaid = [p for p in body["items"] if p["status"] != "paid"]
    if unpaid:
        target = body["next_payment"]
        after = client.post(f"{API}/payments/{target['id']}/pay", headers=student_headers).json()
        paid = next(p for p in after["items"] if p["id"] == target["id"])
        assert paid["status"] == "paid" and paid["paid_at"]


def test_pay_foreign_payment_is_not_found(client: TestClient, student_headers: dict):
    assert client.post(f"{API}/payments/999999/pay", headers=student_headers).status_code == 404


def test_comments_belong_to_student(client: TestClient, student_headers: dict):
    me = client.get("/api/v1/auth/me", headers=student_headers).json()
    for c in client.get(f"{API}/comments", headers=student_headers).json():
        assert c["student_id"] == me["id"]
        assert c["kind"] in {"praise", "remark", "recommendation"}
