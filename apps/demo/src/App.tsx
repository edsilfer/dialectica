import { DiffViewer, DiffParserAdapter } from '@diff-viewer'


export const SAMPLE_DIFF = `
diff --git a/foo.ts b/foo.ts
index 0000000..3b18e9a 100644
--- a/foo.ts
+++ b/foo.ts
@@ -0,0 +1,3 @@
+const x = 1
+const y = 2
+const z = 3
`

export default function App() {
  const parser = new DiffParserAdapter()
  const parsedDiff = parser.parse(SAMPLE_DIFF)

  return <DiffViewer diff={parsedDiff} mode="unified" />
}
