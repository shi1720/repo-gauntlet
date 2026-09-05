#include "topk.hpp"
#include <algorithm>
#include <iostream>
#include <random>

int main() {
    std::mt19937 random(42); std::uniform_int_distribution<int> distribution(-100000,100000);
    std::vector<TrackedInt> input; input.reserve(100000); for(int i=0;i<100000;i++) input.emplace_back(distribution(random));
    auto expected=input; std::sort(expected.begin(),expected.end(),std::greater<TrackedInt>()); expected.erase(expected.begin()+16,expected.end());
    const std::size_t before=TrackedInt::observed_comparisons(); auto result=streaming_topk(input,16); const std::size_t observed=TrackedInt::observed_comparisons()-before;
    if(result != expected){std::cerr<<"semantic top-k mismatch\n";return 1;}
    const std::size_t lower=input.size()-16; const std::size_t upper=input.size()*12;
    if(observed<lower || observed>upper){std::cerr<<"tracked comparison contract failed: "<<observed<<" not in ["<<lower<<", "<<upper<<"]\n";return 1;}
    std::cout<<"hidden top-k contract passed with "<<observed<<" grader-observed comparisons\n";
}
