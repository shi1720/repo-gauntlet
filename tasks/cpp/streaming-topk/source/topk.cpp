#include "topk.hpp"
#include <algorithm>

std::vector<TrackedInt> streaming_topk(const std::vector<TrackedInt>& input, std::size_t k) {
    std::vector<TrackedInt> values = input;
    std::sort(values.begin(), values.end(), std::greater<TrackedInt>());
    if (values.size() > k) values.erase(values.begin() + static_cast<std::ptrdiff_t>(k), values.end());
    return values;
}
