## 2024-06-22 - Verify code review claims
**Learning:** Code review might hallucinate or base claims on incorrect assumptions (e.g. saying `stampBlackHandMark` returns `void` according to the prompt, when in reality the function clearly returns `boolean` as seen in the source code).
**Action:** Always independently check code review claims against the source code before acting on them.
## 2024-05-18 - Enforcing render limits during generation
**Learning:** For rendering properties like `ceilingTier` that exist as pure visual metadata on `Room` objects, it's safer to enforce bounds during the room instantiation in the `gen` layer rather than hacking the render pipeline or waiting for `ceilingHeights.ts` to process unbound values.
**Action:** When adding or bounding render metadata on procedurally generated structures, apply the logic directly to the object creation factories (e.g. `stampRoom`, `makeShelterRoom`) based on dimensional heuristics.
