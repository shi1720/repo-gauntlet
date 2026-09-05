#include "topk.hpp"
#include <algorithm>

std::vector<TrackedInt> streaming_topk(const std::vector<TrackedInt>& input, std::size_t k) {
    if (k == 0 || input.empty()) return {};
    k = std::min(k, input.size());
    std::vector<TrackedInt> heap; heap.reserve(k);
    auto sift_up = [&](std::size_t index) {
        while (index > 0) {
            const std::size_t parent = (index - 1) / 2;
            if (heap[parent] <= heap[index]) break;
            std::swap(heap[parent], heap[index]); index = parent;
        }
    };
    auto sift_down = [&](std::size_t index) {
        while (true) {
            const std::size_t left = index * 2 + 1; if (left >= heap.size()) break;
            const std::size_t right = left + 1; std::size_t smallest = left;
            if (right < heap.size() && heap[right] < heap[left]) smallest = right;
            if (heap[index] <= heap[smallest]) break;
            std::swap(heap[index], heap[smallest]); index = smallest;
        }
    };
    for (const TrackedInt& value : input) {
        if (heap.size() < k) { heap.push_back(value); sift_up(heap.size() - 1); continue; }
        if (value > heap.front()) { heap.front() = value; sift_down(0); }
    }
    std::sort(heap.begin(), heap.end(), std::greater<TrackedInt>());
    return heap;
}

