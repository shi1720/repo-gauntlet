"""Interval reconciliation service (baseline contains the reported defect)."""

from typing import Iterable, List, Tuple

Interval = Tuple[int, int]


def reconcile(intervals: Iterable[Interval]) -> List[Interval]:
    ordered = sorted(intervals)
    if not ordered:
        return []
    merged = [ordered[0]]
    for start, end in ordered[1:]:
        previous_start, previous_end = merged[-1]
        if start < previous_end:
            merged[-1] = (previous_start, max(previous_end, end))
        else:
            merged.append((start, end))
    return merged

