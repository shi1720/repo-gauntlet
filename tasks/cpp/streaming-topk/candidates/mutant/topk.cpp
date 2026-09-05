#include "topk.hpp"
#include <algorithm>
std::vector<TrackedInt> streaming_topk(const std::vector<TrackedInt>& input, std::size_t k) {
    std::vector<TrackedInt> values=input;
    if(k<values.size()) std::nth_element(values.begin(),values.begin()+k,values.end(),std::greater<TrackedInt>());
    if(values.size()>k) values.erase(values.begin()+static_cast<std::ptrdiff_t>(k),values.end()); return values;
}
