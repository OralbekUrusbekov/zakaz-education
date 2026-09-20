from fastapi.testclient import TestClient

API = "/api/v1/analytics/dashboard"


def test_dashboard_structure(client: TestClient, admin_headers: dict):
    body = client.get(API, headers=admin_headers).json()
    assert set(body) >= {
        "total_students", "active_students", "attendance_rate", "average_grade", "graduates",
        "students_trend", "attendance_trend", "grade_distribution", "course_averages",
        "courses", "graduates_trend", "teachers", "at_risk",
    }
    assert body["total_students"]["value"] >= body["active_students"]["value"]
    assert 0 <= body["attendance_rate"]["value"] <= 100
    assert 0 <= body["average_grade"]["value"] <= 10


def test_grade_distribution_covers_ten_points(client: TestClient, admin_headers: dict):
    body = client.get(API, headers=admin_headers).json()
    grades = [int(p["grade"]) for p in body["grade_distribution"]]
    assert grades == list(range(10, 0, -1))


def test_trends_have_twelve_months(client: TestClient, admin_headers: dict):
    body = client.get(API, headers=admin_headers).json()
    assert len(body["students_trend"]) == 12
    assert len(body["graduates_trend"]) == 12
    totals = [p["total"] for p in body["students_trend"]]
    assert totals == sorted(totals)  # число студентов накопительно не убывает


def test_course_filter_narrows_data(client: TestClient, admin_headers: dict):
    all_data = client.get(API, headers=admin_headers).json()
    course_id = all_data["courses"][0]["course_id"]
    filtered = client.get(API, headers=admin_headers, params={"course_id": course_id}).json()
    assert len(filtered["courses"]) == 1
    assert filtered["courses"][0]["course_id"] == course_id
    assert filtered["total_students"]["value"] <= all_data["total_students"]["value"]


def test_period_filter_changes_window(client: TestClient, admin_headers: dict):
    month = client.get(API, headers=admin_headers, params={"period": "month"}).json()
    year = client.get(API, headers=admin_headers, params={"period": "year"}).json()
    assert sum(p["count"] for p in year["grade_distribution"]) >= sum(p["count"] for p in month["grade_distribution"])
    assert year["graduates"]["value"] >= month["graduates"]["value"]


def test_unknown_period_is_rejected(client: TestClient, admin_headers: dict):
    assert client.get(API, headers=admin_headers, params={"period": "decade"}).status_code == 422


def test_courses_popularity_is_sorted(client: TestClient, admin_headers: dict):
    courses = client.get(API, headers=admin_headers).json()["courses"]
    assert [c["enrolled"] for c in courses] == sorted((c["enrolled"] for c in courses), reverse=True)
    for c in courses:
        assert c["active"] + c["completed"] <= c["enrolled"]
        assert 0 <= c["completion_rate"] <= 100


def test_at_risk_students_have_reasons(client: TestClient, admin_headers: dict):
    for s in client.get(API, headers=admin_headers).json()["at_risk"]:
        assert s["reasons"]
        if "Низкая посещаемость" in s["reasons"]:
            assert s["attendance_rate"] < 75
        if "Низкая успеваемость" in s["reasons"]:
            assert s["average_grade"] < 7  # порог десятибалльной шкалы
        if "Задолженность по оплате" in s["reasons"]:
            assert s["debt"] > 0


def test_teachers_stats(client: TestClient, admin_headers: dict):
    teachers = client.get(API, headers=admin_headers).json()["teachers"]
    assert teachers
    assert [t["students"] for t in teachers] == sorted((t["students"] for t in teachers), reverse=True)
    for t in teachers:
        assert t["groups"] >= 1
        assert t["average_grade"] is None or 1 <= t["average_grade"] <= 10
