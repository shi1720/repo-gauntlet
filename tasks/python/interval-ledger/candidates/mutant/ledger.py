"""Plausible incomplete fix: merges touching intervals but misses validation."""

from typing import Iterable, List, Tuple

Interval = Tuple[int, int]


def reconcile(intervals: Iterable[Interval]) -> List[Interval]:
    ordered = sorted(interval for interval in intervals if interval[0] != interval[1])
    merged: List[Interval] = []
    for start, end in ordered:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged

