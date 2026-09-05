#pragma once
#include <cstddef>
#include <vector>

class TrackedInt {
public:
    explicit TrackedInt(int value) : value_(value) {}
    static std::size_t observed_comparisons() { return comparisons_; }
    friend bool operator<(const TrackedInt& left, const TrackedInt& right) { ++comparisons_; return left.value_ < right.value_; }
    friend bool operator>(const TrackedInt& left, const TrackedInt& right) { ++comparisons_; return left.value_ > right.value_; }
    friend bool operator<=(const TrackedInt& left, const TrackedInt& right) { ++comparisons_; return left.value_ <= right.value_; }
    friend bool operator==(const TrackedInt& left, const TrackedInt& right) { ++comparisons_; return left.value_ == right.value_; }
private:
    int value_;
    inline static std::size_t comparisons_ = 0;
};

std::vector<TrackedInt> streaming_topk(const std::vector<TrackedInt>& input, std::size_t k);
