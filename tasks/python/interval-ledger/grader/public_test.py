import sys
import unittest

sys.path.insert(0, ".")
from ledger import reconcile


class PublicContract(unittest.TestCase):
    def test_unsorted_overlap(self):
        self.assertEqual(reconcile([(8, 12), (1, 5), (4, 9)]), [(1, 12)])

    def test_touching_half_open_windows_merge(self):
        self.assertEqual(reconcile([(0, 4), (4, 7)]), [(0, 7)])

    def test_empty(self):
        self.assertEqual(reconcile([]), [])


if __name__ == "__main__":
    result = unittest.main(exit=False)
    if not result.result.wasSuccessful():
        raise SystemExit(1)
    print("REPOGAUNTLET_PHASE_COMPLETE:public_tests")
