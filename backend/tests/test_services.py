from datetime import date, datetime

from app.seed import _grade_value
from app.services import average, last_months, month_key, month_label, payment_status, rate


class _Payment:
    def __init__(self, status: str) -> None:
        self.status = status


def test_rate_counts_present_and_late():
    assert rate(["present", "late", "absent", "excused"]) == 50.0
    assert rate(["present", "present"]) == 100.0
    assert rate([]) is None


def test_average_rounds_to_two_digits():
    assert average([9, 10, 8]) == 9.0
    assert average([7, 8]) == 7.5
    assert average([]) is None


def test_payment_status_priority():
    assert payment_status([_Payment("paid"), _Payment("overdue"), _Payment("pending")]) == "overdue"
    assert payment_status([_Payment("paid"), _Payment("pending")]) == "pending"
    assert payment_status([_Payment("paid")]) == "paid"
    assert payment_status([]) == "paid"


def test_month_helpers():
    assert month_key(date(2026, 9, 18)) == (2026, 9)
    assert month_key(datetime(2026, 1, 1, 10, 0)) == (2026, 1)
    assert month_label((2026, 9)) == "Сен"


def test_last_months_is_ordered_and_sized():
    months = last_months(12, date(2026, 3, 15))
    assert len(months) == 12
    assert months[-1] == (2026, 3)
    assert months[0] == (2025, 4)


def test_grade_value_stays_in_ten_point_scale():
    import random

    rng = random.Random(1)
    values = [_grade_value(rng, d / 100) for d in range(0, 101) for _ in range(5)]
    assert min(values) >= 1 and max(values) <= 10
    low = [_grade_value(rng, 0.2) for _ in range(200)]
    high = [_grade_value(rng, 0.95) for _ in range(200)]
    assert sum(low) / len(low) < sum(high) / len(high)  # прилежание влияет на оценку
