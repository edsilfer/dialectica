// 1 file, 1 hunk, example of additions
export const SAMPLE_DIFF = `diff --git a/foo.ts b/foo.ts
index 0000000..3b18e9a 100644
--- a/foo.ts
+++ b/foo.ts
@@ -0,0 +1,3 @@
+const x = 1
+const y = 2
+const z = 3`

// 1 file, 1 hunk, example of deletions
export const DELETION_DIFF = `diff --git a/example.js b/example.js
index 1234567..abcdefg 100644
--- a/example.js
+++ b/example.js
@@ -1,5 +1,2 @@
 function hello() {
-  console.log('old line 1')
-  console.log('old line 2')
-  console.log('old line 3')
+  console.log('new implementation')
 }`

// 1 file, 1 hunk, example of mixed changes
export const MIXED_DIFF = `diff --git a/utils.ts b/utils.ts
index abc123..def456 100644
--- a/utils.ts
+++ b/utils.ts
@@ -1,7 +1,8 @@
 export function calculate(a: number, b: number) {
-  const sum = a + b
-  console.log('calculating')
+  // Updated implementation
+  const result = a + b
+  console.log('calculating result')
  
-  return sum
+  return result
 }`

// 1 file, 1 hunk, example of file renaming
export const RENAME_DIFF = `diff --git a/old-name.js b/new-name.js
similarity index 100%
rename from old-name.js
rename to new-name.js
index 1234567..1234567 100644
--- a/old-name.js
+++ b/new-name.js
@@ -1,3 +1,3 @@
 const message = 'hello'
-console.log(message)
+console.log('Updated:', message)
 export default message`

// 2 files, 2 hunks, example of multi-file changes
export const MULTI_FILE_DIFF = `diff --git a/file1.ts b/file1.ts
index 0000000..1111111 100644
--- a/file1.ts
+++ b/file1.ts
@@ -0,0 +1,2 @@
+export const value1 = 'hello'
+export const value2 = 'world'
diff --git a/file2.ts b/file2.ts
index 2222222..3333333 100644
--- a/file2.ts
+++ b/file2.ts
@@ -1,1 +1,2 @@
 const existing = true
+const newVar = false`

// 1 file, 2 hunks, example of multi-hunk changes
export const MULTI_HUNK_DIFF = `diff --git a/complex.js b/complex.js
index aaaa111..bbbb222 100644
--- a/complex.js
+++ b/complex.js
@@ -1,3 +1,3 @@
 function first() {
-  return 'old'
+  return 'new'
 }
@@ -10,3 +10,3 @@
 function second() {
-  return 'old'
+  return 'new'
 }`
