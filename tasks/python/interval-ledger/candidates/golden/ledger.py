"""Correct linear-scan union for half-open intervals."""

from typing import Iterable, List, Tuple

Interval = Tuple[int, int]


def reconcile(intervals: Iterable[Interval]) -> List[Interval]:
    snapshot = list(intervals)
    for start, end in snapshot:
        if start > end:
            raise ValueError("interval start must not exceed end")
    ordered = sorted((start, end) for start, end in snapshot if start != end)
    merged: List[Interval] = []
    for start, end in ordered:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged

