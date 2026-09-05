#include "topk.hpp"
#include <cassert>
#include <iostream>

int main() {
    assert(streaming_topk({TrackedInt(5),TrackedInt(1),TrackedInt(9),TrackedInt(9),TrackedInt(2)},3) == std::vector<TrackedInt>({TrackedInt(9),TrackedInt(9),TrackedInt(5)}));
    assert(streaming_topk({TrackedInt(3),TrackedInt(2),TrackedInt(1)},0).empty());
    assert(streaming_topk({TrackedInt(2),TrackedInt(1)},8) == std::vector<TrackedInt>({TrackedInt(2),TrackedInt(1)}));
    std::cout << "public top-k contract passed\nREPOGAUNTLET_PHASE_COMPLETE:public_tests\n";
}
