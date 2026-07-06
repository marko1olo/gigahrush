Please review my recent commit updating the parameter list for `ellipseBand`.

```
diff --git a/src/entities/trubnyy_avtomat.ts b/src/entities/trubnyy_avtomat.ts
index 752ee61..5cf4a01 100644
--- a/src/entities/trubnyy_avtomat.ts
+++ b/src/entities/trubnyy_avtomat.ts
@@ -49,14 +49,14 @@ function ellipse(t: Uint32Array, cx: number, cy: number, rx: number, ry: number,
   }
 }

-function ellipseBand(t: Uint32Array, cx: number, cy: number, rx: number, ry: number, thick: number, r: number, g: number, b: number): void {
+function ellipseBand(t: Uint32Array, cx: number, cy: number, rx: number, ry: number, thick: number, color: [number, number, number]): void {
   for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
     for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
       const dx = (x - cx) / rx;
       const dy = (y - cy) / ry;
       const d = Math.sqrt(dx * dx + dy * dy);
       if (d > 1 || d < 1 - thick) continue;
-      put(t, x, y, r, g, b);
+      put(t, x, y, color[0], color[1], color[2]);
     }
   }
 }
@@ -71,8 +71,8 @@ export function generateSprite(): Uint32Array {

   ellipse(t, cx, 32, 18, 17, 56, 62, 65, 7101);
   ellipse(t, cx - 2, 32, 12, 19, 34, 38, 40, 7102);
-  ellipseBand(t, cx, 27, 18, 7, 0.26, 34, 118, 154);
-  ellipseBand(t, cx, 36, 18, 7, 0.25, 42, 154, 198);
+  ellipseBand(t, cx, 27, 18, 7, 0.26, [34, 118, 154]);
+  ellipseBand(t, cx, 36, 18, 7, 0.25, [42, 154, 198]);

   for (let y = 23; y < 43; y += 5) {
     for (let x = 17; x < 48; x++) {
@@ -84,8 +84,8 @@ export function generateSprite(): Uint32Array {
   rect(t, 9, 16, 5, 14, 48, 52, 52, 7121);
   rect(t, 42, 18, 8, 5, 70, 49, 36, 7122);
   rect(t, 49, 20, 5, 14, 46, 50, 51, 7123);
-  ellipseBand(t, 14, 18, 7, 7, 0.22, 82, 54, 38);
-  ellipseBand(t, 49, 32, 8, 8, 0.20, 82, 54, 38);
+  ellipseBand(t, 14, 18, 7, 7, 0.22, [82, 54, 38]);
+  ellipseBand(t, 49, 32, 8, 8, 0.20, [82, 54, 38]);

   rect(t, 39, 29, 13, 7, 28, 32, 34, 7140);
   rect(t, 50, 30, 7, 5, 22, 24, 25, 7141);
```
