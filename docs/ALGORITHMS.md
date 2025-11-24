# Algorithm Documentation

**Per P-7: k-d Tree Implementation Documentation**

## Color Matching Algorithms

### k-d Tree for Nearest Neighbor Search

**Implementation:** `src/utils/kd-tree.ts`  
**Used by:** `DyeService.findClosestDye()` and `DyeService.findDyesWithinDistance()`

#### Overview

The k-d tree (k-dimensional tree) is a space-partitioning data structure for organizing points in k-dimensional space. For color matching, we use a 3D k-d tree in RGB color space.

#### Why k-d Tree?

**Problem:** Linear search through all dyes is O(n) complexity, requiring distance calculations for every dye.

**Solution:** k-d tree provides O(log n) average case for nearest neighbor queries, significantly faster for the 136-dye database.

**Performance Improvement:**
- **Before (Linear Search):** O(n) = O(136) operations per query
- **After (k-d Tree):** O(log n) = O(log 136) ≈ O(7) operations per query
- **Expected Speedup:** 10-20x faster for nearest neighbor queries

#### Algorithm Details

1. **Tree Construction:**
   - Points are inserted into the tree
   - Tree is built recursively by splitting on alternating dimensions (R, G, B)
   - Median point is selected as node, left subtree contains points with smaller values, right subtree contains larger values

2. **Nearest Neighbor Search:**
   - Start at root, traverse down the tree based on target point's coordinates
   - Track best candidate found so far
   - When backtracking, check if the other side of the split could contain a closer point
   - Only search other side if the distance to the splitting plane is less than current best distance

3. **Range Queries (Points Within Distance):**
   - Similar to nearest neighbor, but collect all points within threshold
   - Prune branches where the entire subtree is outside the search radius

#### Space Complexity

- **Storage:** O(n) - one node per dye
- **Tree Height:** O(log n) - balanced tree structure

#### Time Complexity

- **Construction:** O(n log n) - done once during initialization
- **Nearest Neighbor:** O(log n) average case, O(n) worst case (rare)
- **Range Query:** O(log n + k) where k is number of results

#### Implementation Notes

- **Color Space:** RGB (3D) - matches `ColorService.getColorDistance()` which uses Euclidean distance in RGB space
- **Exclusion Support:** Tree supports excluding points via `excludeData` callback function
- **Facewear Exclusion:** Facewear dyes are excluded from tree construction (not added to tree)
- **Fallback:** Linear search fallback if tree is not available (shouldn't happen in normal operation)

#### Performance Benchmarks

Based on integration tests:

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Nearest neighbor (single) | < 2ms | ✅ | Pass |
| Nearest neighbor (batch 50) | < 5ms avg | ✅ | Pass |
| Range query (within distance) | < 5ms | ✅ | Pass |

#### Trade-offs

**Advantages:**
- Fast nearest neighbor search
- Efficient range queries
- Scales well with dataset size

**Disadvantages:**
- Tree construction overhead (one-time cost)
- Slightly more memory usage
- More complex implementation than linear search

**Decision:** For 136 dyes, the performance improvement justifies the added complexity. The tree is built once during initialization, and all subsequent queries benefit from the speedup.

#### Alternative Approaches Considered

1. **Linear Search:** Simple but slow (O(n))
2. **Hue-Indexed Map (P-2):** Fast for harmony generation but not optimal for RGB distance queries
3. **k-d Tree:** Best balance of performance and complexity for nearest neighbor in RGB space

#### Future Enhancements

- Consider using LAB color space for perceptually uniform distance calculations
- Implement approximate nearest neighbor for even faster queries (if needed)
- Add support for weighted distance functions

---

**Related:** P-7: k-d Tree Implementation  
**Last Updated:** November 2025

