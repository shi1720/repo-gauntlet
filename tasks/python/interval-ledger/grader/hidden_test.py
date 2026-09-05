import random
import sys
import unittest

sys.path.insert(0, ".")
from ledger import reconcile


def reference(intervals):
    values = list(intervals)
    if any(start > end for start, end in values):
        raise ValueError
    points = sorted((start, end) for start, end in values if start != end)
    result = []
    for start, end in points:
        if result and start <= result[-1][1]:
            result[-1] = (result[-1][0], max(result[-1][1], end))
        else:
            result.append((start, end))
    return result


class HiddenContract(unittest.TestCase):
    def test_empty_duplicate_and_contained(self):
        values = [(2, 2), (0, 10), (3, 4), (0, 10)]
        self.assertEqual(reconcile(values), [(0, 10)])
        self.assertEqual(values, [(2, 2), (0, 10), (3, 4), (0, 10)])

    def test_reversed_rejected(self):
        with self.assertRaises(ValueError):
            reconcile([(5, 3)])

    def test_seeded_property_cases(self):
        random.seed(42)
        for _ in range(1000):
            values = []
            for _ in range(random.randint(0, 20)):
                start = random.randint(-30, 30)
                values.append((start, start + random.randint(0, 12)))
            self.assertEqual(reconcile(values), reference(values))


if __name__ == "__main__":
    result = unittest.main(exit=False)
    if not result.result.wasSuccessful():
        raise SystemExit(1)
