## 2024-06-22 - Verify code review claims
**Learning:** Code review might hallucinate or base claims on incorrect assumptions (e.g. saying `stampBlackHandMark` returns `void` according to the prompt, when in reality the function clearly returns `boolean` as seen in the source code).
**Action:** Always independently check code review claims against the source code before acting on them.
## 2024-05-19 - Memory and Resource Singleton Cleanup
**Learning:** Instantiating `AudioContext` loosely without checking `globalThis` can result in limit exhaustion due to HMR or un-garbage collected instances. Bounding caching systems (like `MAX_FLOOR_MEMORY_ENTRIES`) is crucial in environments where JS Garbage Collection alone is not sufficient if arrays are not explicitly emptied (like with `entities.length = 0` vs `entities = []` or just `entities = gen.entities`).
**Action:** When fixing resource exhaustion bugs (like `localStorage` limit or `AudioContext`), always employ hard boundaries using global singletons or strictly sized collections. Clear active ECS arrays via mutation (`length = 0`) before reassignment to prevent dangling references in closures.
