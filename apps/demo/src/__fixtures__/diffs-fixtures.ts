export const SAMPLE_DIFF = `
diff --git a/python/pyspark/pandas/frame.py b/python/pyspark/pandas/frame.py
index a6f737d0d01bf..67d651fd19086 100644
--- a/python/pyspark/pandas/frame.py
+++ b/python/pyspark/pandas/frame.py
@@ -112,6 +112,7 @@
     column_labels_level,
     combine_frames,
     default_session,
+    is_ansi_mode_enabled,
     is_name_like_tuple,
     is_name_like_value,
     is_testing,
@@ -8456,7 +8457,13 @@ def isin(self, values: Union[List, Dict]) -> "DataFrame":
             )
 
             for label in self._internal.column_labels:
-                scol = self._internal.spark_column_for(label).isin([F.lit(v) for v in values])
+                if is_ansi_mode_enabled(self._internal.spark_frame.sparkSession):
+                    col_type = self._internal.spark_type_for(label)
+                    scol = self._internal.spark_column_for(label).isin(
+                        [F.lit(v).try_cast(col_type) for v in values]
+                    )
+                else:
+                    scol = self._internal.spark_column_for(label).isin([F.lit(v) for v in values])
                 scol = F.coalesce(scol, F.lit(False))
                 data_spark_columns.append(scol.alias(self._internal.spark_column_name_for(label)))
         else:
diff --git a/python/pyspark/pandas/namespace.py b/python/pyspark/pandas/namespace.py
index a8736aba811f0..754f02a450e3a 100644
--- a/python/pyspark/pandas/namespace.py
+++ b/python/pyspark/pandas/namespace.py
@@ -76,6 +76,7 @@
 from pyspark.pandas.utils import (
     align_diff_frames,
     default_session,
+    is_ansi_mode_enabled,
     is_name_like_tuple,
     is_name_like_value,
     name_like_string,
@@ -3630,7 +3631,11 @@ def to_numeric(arg, errors="raise"):
     """
     if isinstance(arg, Series):
         if errors == "coerce":
-            return arg._with_new_scol(arg.spark.column.try_cast("float"))
+            spark_session = arg._internal.spark_frame.sparkSession
+            if is_ansi_mode_enabled(spark_session):
+                return arg._with_new_scol(arg.spark.column.try_cast("float"))
+            else:
+                return arg._with_new_scol(arg.spark.column.cast("float"))
         elif errors == "raise":
             scol = arg.spark.column
             scol_casted = scol.cast("float")
diff --git a/python/pyspark/pandas/tests/frame/test_reindexing.py b/python/pyspark/pandas/tests/frame/test_reindexing.py
index ebfaa8910cb7c..c013c29325694 100644
--- a/python/pyspark/pandas/tests/frame/test_reindexing.py
+++ b/python/pyspark/pandas/tests/frame/test_reindexing.py
@@ -765,7 +765,6 @@ def test_swapaxes(self):
         self.assertRaises(AssertionError, lambda: psdf.swapaxes(0, 1, copy=False))
         self.assertRaises(ValueError, lambda: psdf.swapaxes(0, -1))
 
-    @unittest.skipIf(is_ansi_mode_test, ansi_mode_not_supported_message)
     def test_isin(self):
         pdf = pd.DataFrame(
             {
`

export const TEN_FILES_DIFF = `
diff --git a/core/src/main/scala/org/apache/spark/api/python/PythonRunner.scala b/core/src/main/scala/org/apache/spark/api/python/PythonRunner.scala
index 287dc86942288..3ef55ce9def0c 100644
--- a/core/src/main/scala/org/apache/spark/api/python/PythonRunner.scala
+++ b/core/src/main/scala/org/apache/spark/api/python/PythonRunner.scala
@@ -170,6 +170,8 @@ private[spark] abstract class BasePythonRunner[IN, OUT](
   protected val faultHandlerEnabled: Boolean = conf.get(PYTHON_WORKER_FAULTHANLDER_ENABLED)
   protected val idleTimeoutSeconds: Long = conf.get(PYTHON_WORKER_IDLE_TIMEOUT_SECONDS)
   protected val killOnIdleTimeout: Boolean = conf.get(PYTHON_WORKER_KILL_ON_IDLE_TIMEOUT)
+  protected val tracebackDumpIntervalSeconds: Long =
+    conf.get(PYTHON_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS)
   protected val hideTraceback: Boolean = false
   protected val simplifiedTraceback: Boolean = false
 
@@ -267,6 +269,9 @@ private[spark] abstract class BasePythonRunner[IN, OUT](
     if (faultHandlerEnabled) {
       envVars.put("PYTHON_FAULTHANDLER_DIR", faultHandlerLogDir.toString)
     }
+    if (tracebackDumpIntervalSeconds > 0L) {
+      envVars.put("PYTHON_TRACEBACK_DUMP_INTERVAL_SECONDS", tracebackDumpIntervalSeconds.toString)
+    }
     // allow the user to set the batch size for the BatchedSerializer on UDFs
     envVars.put("PYTHON_UDF_BATCH_SIZE", batchSizeForPythonUDF.toString)
 
diff --git a/core/src/main/scala/org/apache/spark/internal/config/Python.scala b/core/src/main/scala/org/apache/spark/internal/config/Python.scala
index 46d54be92f3d6..8c3adedb372a1 100644
--- a/core/src/main/scala/org/apache/spark/internal/config/Python.scala
+++ b/core/src/main/scala/org/apache/spark/internal/config/Python.scala
@@ -117,4 +117,14 @@ private[spark] object Python {
     .version("4.1.0")
     .booleanConf
     .createWithDefault(false)
+
+  val PYTHON_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS =
+    ConfigBuilder("spark.python.worker.tracebackDumpIntervalSeconds")
+      .doc("The interval (in seconds) for Python workers to dump their tracebacks. " +
+        "If it's positive, the Python worker will periodically dump the traceback into " +
+        "its executor's \\\`stderr\\\`. The default is \\\`0\\\` that means it is disabled.")
+      .version("4.1.0")
+      .timeConf(TimeUnit.SECONDS)
+      .checkValue(_ >= 0, "The interval should be 0 or positive.")
+      .createWithDefault(0)
 }
diff --git a/python/pyspark/worker.py b/python/pyspark/worker.py
index 67cf25cff6e6a..3454c9855a582 100644
--- a/python/pyspark/worker.py
+++ b/python/pyspark/worker.py
@@ -2347,6 +2347,9 @@ def func(_, it):
 
 def main(infile, outfile):
     faulthandler_log_path = os.environ.get("PYTHON_FAULTHANDLER_DIR", None)
+    tracebackDumpIntervalSeconds = os.environ.get("PYTHON_TRACEBACK_DUMP_INTERVAL_SECONDS", None)
+    if tracebackDumpIntervalSeconds is not None:
+        tracebackDumpIntervalSeconds = int(tracebackDumpIntervalSeconds)
     try:
         if faulthandler_log_path:
             faulthandler_log_path = os.path.join(faulthandler_log_path, str(os.getpid()))
@@ -2358,6 +2361,9 @@ def main(infile, outfile):
         if split_index == -1:  # for unit tests
             sys.exit(-1)
 
+        if tracebackDumpIntervalSeconds is not None and tracebackDumpIntervalSeconds > 0:
+            faulthandler.dump_traceback_later(tracebackDumpIntervalSeconds, repeat=True)
+
         check_python_version(infile)
 
         # read inputs only for a barrier task
@@ -2465,6 +2471,9 @@ def process():
         write_int(SpecialLengths.END_OF_DATA_SECTION, outfile)
         sys.exit(-1)
 
+    # Force to cancel dump_traceback_later
+    faulthandler.cancel_dump_traceback_later()
+
 
 if __name__ == "__main__":
     # Read information about how to connect back to the JVM from the environment.
diff --git a/sql/catalyst/src/main/scala/org/apache/spark/sql/internal/SQLConf.scala b/sql/catalyst/src/main/scala/org/apache/spark/sql/internal/SQLConf.scala
index 48feb26d653b4..c921f9d9c08b5 100644
--- a/sql/catalyst/src/main/scala/org/apache/spark/sql/internal/SQLConf.scala
+++ b/sql/catalyst/src/main/scala/org/apache/spark/sql/internal/SQLConf.scala
@@ -3549,6 +3549,14 @@ object SQLConf {
       .version("4.1.0")
       .fallbackConf(Python.PYTHON_WORKER_KILL_ON_IDLE_TIMEOUT)
 
+  val PYTHON_UDF_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS =
+    buildConf("spark.sql.execution.pyspark.udf.tracebackDumpIntervalSeconds")
+      .doc(
+        s"Same as \\\${Python.PYTHON_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS.key} " +
+          "for Python execution with DataFrame and SQL. It can change during runtime.")
+      .version("4.1.0")
+      .fallbackConf(Python.PYTHON_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS)
+
   val PYSPARK_PLOT_MAX_ROWS =
     buildConf("spark.sql.pyspark.plotting.max_rows")
       .doc("The visual limit on plots. If set to 1000 for top-n-based plots (pie, bar, barh), " +
@@ -6731,6 +6739,9 @@ class SQLConf extends Serializable with Logging with SqlApiConf {
 
   def pythonUDFWorkerKillOnIdleTimeout: Boolean = getConf(PYTHON_UDF_WORKER_KILL_ON_IDLE_TIMEOUT)
 
+  def pythonUDFWorkerTracebackDumpIntervalSeconds: Long =
+    getConf(PYTHON_UDF_WORKER_TRACEBACK_DUMP_INTERVAL_SECONDS)
+
   def pythonUDFArrowConcurrencyLevel: Option[Int] = getConf(PYTHON_UDF_ARROW_CONCURRENCY_LEVEL)
 
   def pythonUDFArrowFallbackOnUDT: Boolean = getConf(PYTHON_UDF_ARROW_FALLBACK_ON_UDT)
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonRunner.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonRunner.scala
index 9a9fb574b87fb..555be307cd810 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonRunner.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonRunner.scala
@@ -49,6 +49,8 @@ abstract class BaseArrowPythonRunner(
   override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
   override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
   override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+  override val tracebackDumpIntervalSeconds: Long =
+    SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
   override val errorOnDuplicatedFieldNames: Boolean = true
 
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonUDTFRunner.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonUDTFRunner.scala
index ae875c777b434..86136e444d436 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonUDTFRunner.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/ArrowPythonUDTFRunner.scala
@@ -58,6 +58,8 @@ class ArrowPythonUDTFRunner(
   override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
   override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
   override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+  override val tracebackDumpIntervalSeconds: Long =
+    SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
   override val errorOnDuplicatedFieldNames: Boolean = true
 
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/CoGroupedArrowPythonRunner.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/CoGroupedArrowPythonRunner.scala
index 27d6f7dc1c66b..8b160accd7a4d 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/CoGroupedArrowPythonRunner.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/CoGroupedArrowPythonRunner.scala
@@ -62,6 +62,8 @@ class CoGroupedArrowPythonRunner(
   override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
   override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
   override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+  override val tracebackDumpIntervalSeconds: Long =
+    SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
   override val hideTraceback: Boolean = SQLConf.get.pysparkHideTraceback
   override val simplifiedTraceback: Boolean = SQLConf.get.pysparkSimplifiedTraceback
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/PythonUDFRunner.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/PythonUDFRunner.scala
index 4baddcd4d9e77..3f30519e95210 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/PythonUDFRunner.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/PythonUDFRunner.scala
@@ -48,6 +48,8 @@ abstract class BasePythonUDFRunner(
   override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
   override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
   override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+  override val tracebackDumpIntervalSeconds: Long =
+    SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
   override val bufferSize: Int = SQLConf.get.getConf(SQLConf.PYTHON_UDF_BUFFER_SIZE)
   override val batchSizeForPythonUDF: Int =
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/ApplyInPandasWithStatePythonRunner.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/ApplyInPandasWithStatePythonRunner.scala
index 0de937df05f4a..6f2c1a986c279 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/ApplyInPandasWithStatePythonRunner.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/ApplyInPandasWithStatePythonRunner.scala
@@ -78,6 +78,8 @@ class ApplyInPandasWithStatePythonRunner(
   override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
   override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
   override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+  override val tracebackDumpIntervalSeconds: Long =
+    SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
   private val sqlConf = SQLConf.get
 
diff --git a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/PythonForeachWriter.scala b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/PythonForeachWriter.scala
index 04c51c859baca..01643af9cf30d 100644
--- a/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/PythonForeachWriter.scala
+++ b/sql/core/src/main/scala/org/apache/spark/sql/execution/python/streaming/PythonForeachWriter.scala
@@ -102,6 +102,8 @@ class PythonForeachWriter(func: PythonFunction, schema: StructType)
       override val faultHandlerEnabled: Boolean = SQLConf.get.pythonUDFWorkerFaulthandlerEnabled
       override val idleTimeoutSeconds: Long = SQLConf.get.pythonUDFWorkerIdleTimeoutSeconds
       override val killOnIdleTimeout: Boolean = SQLConf.get.pythonUDFWorkerKillOnIdleTimeout
+      override val tracebackDumpIntervalSeconds: Long =
+        SQLConf.get.pythonUDFWorkerTracebackDumpIntervalSeconds
 
       override val hideTraceback: Boolean = SQLConf.get.pysparkHideTraceback
       override val simplifiedTraceback: Boolean = SQLConf.get.pysparkSimplifiedTraceback
`

export const FACEBOOK_REACT_33665_DIFF = `
diff --git a/packages/react-client/src/ReactFlightClient.js b/packages/react-client/src/ReactFlightClient.js
index 96b73374bd24d..610dd05633e89 100644
--- a/packages/react-client/src/ReactFlightClient.js
+++ b/packages/react-client/src/ReactFlightClient.js
@@ -10,11 +10,10 @@
 import type {
   Thenable,
   ReactDebugInfo,
+  ReactDebugInfoEntry,
   ReactComponentInfo,
-  ReactEnvironmentInfo,
   ReactAsyncInfo,
   ReactIOInfo,
-  ReactTimeInfo,
   ReactStackTrace,
   ReactFunctionLocation,
   ReactErrorInfoDev,
@@ -168,6 +167,7 @@ type PendingChunk<T> = {
   value: null | Array<InitializationReference | (T => mixed)>,
   reason: null | Array<InitializationReference | (mixed => mixed)>,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -176,6 +176,7 @@ type BlockedChunk<T> = {
   value: null | Array<InitializationReference | (T => mixed)>,
   reason: null | Array<InitializationReference | (mixed => mixed)>,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -184,6 +185,7 @@ type ResolvedModelChunk<T> = {
   value: UninitializedModel,
   reason: Response,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -192,6 +194,7 @@ type ResolvedModuleChunk<T> = {
   value: ClientReference<T>,
   reason: null,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -200,6 +203,7 @@ type InitializedChunk<T> = {
   value: T,
   reason: null | FlightStreamController,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -210,6 +214,7 @@ type InitializedStreamChunk<
   value: T,
   reason: FlightStreamController,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (ReadableStream) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -218,6 +223,7 @@ type ErroredChunk<T> = {
   value: null,
   reason: mixed,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -226,6 +232,7 @@ type HaltedChunk<T> = {
   value: null,
   reason: null,
   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only
+  _blockedDebugInfo?: any, // DEV-only
   _debugInfo?: null | ReactDebugInfo, // DEV-only
   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,
 };
@@ -247,6 +254,7 @@ function ReactPromise(status: any, value: any, reason: any) {
     this._children = [];
   }
   if (__DEV__) {
+    this._blockedDebugInfo = null;
     this._debugInfo = null;
   }
 }
@@ -356,6 +364,7 @@ export type Response = {
   _debugRootTask?: null | ConsoleTask, // DEV-only
   _debugFindSourceMapURL?: void | FindSourceMapURLCallback, // DEV-only
   _debugChannel?: void | DebugChannelCallback, // DEV-only
+  _blockedConsole?: null | SomeChunk<ConsoleEntry>, // DEV-only
   _replayConsole: boolean, // DEV-only
   _rootEnvironmentName: string, // DEV-only, the requested environment name.
 };
@@ -713,6 +722,17 @@ function initializeModelChunk<T>(chunk: ResolvedModelChunk<T>): void {
     initializingChunk = cyclicChunk;
   }
 
+  if (__DEV__) {
+    const blockingDebugChunk = chunk._blockedDebugInfo;
+    if (
+      blockingDebugChunk != null &&
+      (blockingDebugChunk.status === BLOCKED ||
+        blockingDebugChunk.status === PENDING)
+    ) {
+      waitForReference(blockingDebugChunk, {}, '', response, () => {}, ['']);
+    }
+  }
+
   try {
     const value: T = parseModel(response, resolvedModel);
     // Invoke any listeners added while resolving this model. I.e. cyclic
@@ -2057,6 +2077,7 @@ function ResponseInstance(
     }
     this._debugFindSourceMapURL = findSourceMapURL;
     this._debugChannel = debugChannel;
+    this._blockedConsole = null;
     this._replayConsole = replayConsole;
     this._rootEnvironmentName = rootEnv;
   }
@@ -2229,6 +2250,22 @@ function resolveStream<T: ReadableStream | $AsyncIterable<any, any, void>>(
     chunks.set(id, createInitializedStreamChunk(response, stream, controller));
     return;
   }
+  if (__DEV__) {
+    const blockedDebugInfo = chunk._blockedDebugInfo;
+    if (blockedDebugInfo != null) {
+      // If we're blocked on debug info, wait until it has loaded before we resolve.
+      const unblock = resolveStream.bind(
+        null,
+        response,
+        id,
+        stream,
+        controller,
+      );
+      blockedDebugInfo.then(unblock, unblock);
+      return;
+    }
+  }
+
   if (chunk.status !== PENDING) {
     // We already resolved. We didn't expect to see this.
     return;
@@ -2612,6 +2649,41 @@ function resolvePostponeDev(
   }
 }
 
+function resolveErrorModel(
+  response: Response,
+  id: number,
+  row: UninitializedModel,
+): void {
+  const chunks = response._chunks;
+  const chunk = chunks.get(id);
+  if (__DEV__ && chunk) {
+    if (__DEV__) {
+      const blockedDebugInfo = chunk._blockedDebugInfo;
+      if (blockedDebugInfo != null) {
+        // If we're blocked on debug info, wait until it has loaded before we resolve.
+        // TODO: Handle cycle if that model depends on this one.
+        const unblock = resolveErrorModel.bind(null, response, id, row);
+        blockedDebugInfo.then(unblock, unblock);
+        return;
+      }
+    }
+  }
+  const errorInfo = JSON.parse(row);
+  let error;
+  if (__DEV__) {
+    error = resolveErrorDev(response, errorInfo);
+  } else {
+    error = resolveErrorProd(response);
+  }
+  (error: any).digest = errorInfo.digest;
+  const errorWithDigest: ErrorWithDigest = (error: any);
+  if (!chunk) {
+    chunks.set(id, createErrorChunk(response, errorWithDigest));
+  } else {
+    triggerErrorOnChunk(chunk, errorWithDigest);
+  }
+}
+
 function resolveHint<Code: HintCode>(
   response: Response,
   code: Code,
@@ -3009,12 +3081,8 @@ function initializeFakeStack(
 
 function resolveDebugInfo(
   response: Response,
-  id: number,
-  debugInfo:
-    | ReactComponentInfo
-    | ReactEnvironmentInfo
-    | ReactAsyncInfo
-    | ReactTimeInfo,
+  chunk: SomeChunk<any>,
+  debugInfo: ReactDebugInfoEntry,
 ): void {
   if (!__DEV__) {
     // These errors should never make it into a build so we don't need to encode them in codes.json
@@ -3064,12 +3132,39 @@ function resolveDebugInfo(
     }
   }
 
-  const chunk = getChunk(response, id);
   const chunkDebugInfo: ReactDebugInfo =
     chunk._debugInfo || (chunk._debugInfo = []);
   chunkDebugInfo.push(debugInfo);
 }
 
+function resolveDebugModel(
+  response: Response,
+  id: number,
+  json: UninitializedModel,
+): void {
+  const parentChunk = getChunk(response, id);
+  // If we're not blocked on any other chunks, we can try to eagerly initialize
+  // this as a fast-path to avoid awaiting them.
+  const chunk: ResolvedModelChunk<ReactDebugInfoEntry> =
+    createResolvedModelChunk(response, json);
+  // The previous blocked chunk is now blocking this one.
+  chunk._blockedDebugInfo = parentChunk._blockedDebugInfo;
+  initializeModelChunk(chunk);
+  const initializedChunk: SomeChunk<ReactDebugInfoEntry> = chunk;
+  if (initializedChunk.status === INITIALIZED) {
+    resolveDebugInfo(response, parentChunk, initializedChunk.value);
+    parentChunk._blockedDebugInfo = null;
+  } else {
+    chunk.then(
+      v => resolveDebugInfo(response, parentChunk, v),
+      e => {
+        // Ignore debug info errors for now. Unnecessary noise.
+      },
+    );
+    parentChunk._blockedDebugInfo = chunk;
+  }
+}
+
 let currentOwnerInDEV: null | ReactComponentInfo = null;
 function getCurrentStackInDEV(): string {
   if (__DEV__) {
@@ -3085,12 +3180,14 @@ function getCurrentStackInDEV(): string {
 const replayConsoleWithCallStack = {
   'react-stack-bottom-frame': function (
     response: Response,
-    methodName: string,
-    stackTrace: ReactStackTrace,
-    owner: null | ReactComponentInfo,
-    env: string,
-    args: Array<mixed>,
+    payload: ConsoleEntry,
   ): void {
+    const methodName = payload[0];
+    const stackTrace = payload[1];
+    const owner = payload[2];
+    const env = payload[3];
+    const args = payload.slice(4);
+
     // There really shouldn't be anything else on the stack atm.
     const prevStack = ReactSharedInternals.getCurrentStack;
     ReactSharedInternals.getCurrentStack = getCurrentStackInDEV;
@@ -3128,11 +3225,7 @@ const replayConsoleWithCallStack = {
 
 const replayConsoleWithCallStackInDEV: (
   response: Response,
-  methodName: string,
-  stackTrace: ReactStackTrace,
-  owner: null | ReactComponentInfo,
-  env: string,
-  args: Array<mixed>,
+  payload: ConsoleEntry,
 ) => void = __DEV__
   ? // We use this technique to trick minifiers to preserve the function name.
     (replayConsoleWithCallStack['react-stack-bottom-frame'].bind(
@@ -3140,9 +3233,17 @@ const replayConsoleWithCallStackInDEV: (
     ): any)
   : (null: any);
 
+type ConsoleEntry = [
+  string,
+  ReactStackTrace,
+  null | ReactComponentInfo,
+  string,
+  mixed,
+];
+
 function resolveConsoleEntry(
   response: Response,
-  value: UninitializedModel,
+  json: UninitializedModel,
 ): void {
   if (!__DEV__) {
     // These errors should never make it into a build so we don't need to encode them in codes.json
@@ -3156,27 +3257,47 @@ function resolveConsoleEntry(
     return;
   }
 
-  const payload: [
-    string,
-    ReactStackTrace,
-    null | ReactComponentInfo,
-    string,
-    mixed,
-  ] = parseModel(response, value);
-  const methodName = payload[0];
-  const stackTrace = payload[1];
-  const owner = payload[2];
-  const env = payload[3];
-  const args = payload.slice(4);
-
-  replayConsoleWithCallStackInDEV(
-    response,
-    methodName,
-    stackTrace,
-    owner,
-    env,
-    args,
-  );
+  const blockedChunk = response._blockedConsole;
+  if (blockedChunk == null) {
+    // If we're not blocked on any other chunks, we can try to eagerly initialize
+    // this as a fast-path to avoid awaiting them.
+    const chunk: ResolvedModelChunk<ConsoleEntry> = createResolvedModelChunk(
+      response,
+      json,
+    );
+    initializeModelChunk(chunk);
+    const initializedChunk: SomeChunk<ConsoleEntry> = chunk;
+    if (initializedChunk.status === INITIALIZED) {
+      replayConsoleWithCallStackInDEV(response, initializedChunk.value);
+    } else {
+      chunk.then(
+        v => replayConsoleWithCallStackInDEV(response, v),
+        e => {
+          // Ignore console errors for now. Unnecessary noise.
+        },
+      );
+      response._blockedConsole = chunk;
+    }
+  } else {
+    // We're still waiting on a previous chunk so we can't enqueue quite yet.
+    const chunk: SomeChunk<ConsoleEntry> = createPendingChunk(response);
+    chunk.then(
+      v => replayConsoleWithCallStackInDEV(response, v),
+      e => {
+        // Ignore console errors for now. Unnecessary noise.
+      },
+    );
+    response._blockedConsole = chunk;
+    const unblock = () => {
+      if (response._blockedConsole === chunk) {
+        // We were still the last chunk so we can now clear the queue and return
+        // to synchronous emitting.
+        response._blockedConsole = null;
+      }
+      resolveModelChunk(response, chunk, json);
+    };
+    blockedChunk.then(unblock, unblock);
+  }
 }
 
 function initializeIOInfo(response: Response, ioInfo: ReactIOInfo): void {
@@ -3676,22 +3797,7 @@ function processFullStringRow(
       return;
     }
     case 69 /* "E" */: {
-      const errorInfo = JSON.parse(row);
-      let error;
-      if (__DEV__) {
-        error = resolveErrorDev(response, errorInfo);
-      } else {
-        error = resolveErrorProd(response);
-      }
-      (error: any).digest = errorInfo.digest;
-      const errorWithDigest: ErrorWithDigest = (error: any);
-      const chunks = response._chunks;
-      const chunk = chunks.get(id);
-      if (!chunk) {
-        chunks.set(id, createErrorChunk(response, errorWithDigest));
-      } else {
-        triggerErrorOnChunk(chunk, errorWithDigest);
-      }
+      resolveErrorModel(response, id, row);
       return;
     }
     case 84 /* "T" */: {
@@ -3713,30 +3819,7 @@ function processFullStringRow(
     }
     case 68 /* "D" */: {
       if (__DEV__) {
-        const chunk: ResolvedModelChunk<
-          | ReactComponentInfo
-          | ReactEnvironmentInfo
-          | ReactAsyncInfo
-          | ReactTimeInfo,
-        > = createResolvedModelChunk(response, row);
-        initializeModelChunk(chunk);
-        const initializedChunk: SomeChunk<
-          | ReactComponentInfo
-          | ReactEnvironmentInfo
-          | ReactAsyncInfo
-          | ReactTimeInfo,
-        > = chunk;
-        if (initializedChunk.status === INITIALIZED) {
-          resolveDebugInfo(response, id, initializedChunk.value);
-        } else {
-          // TODO: This is not going to resolve in the right order if there's more than one.
-          chunk.then(
-            v => resolveDebugInfo(response, id, v),
-            e => {
-              // Ignore debug info errors for now. Unnecessary noise.
-            },
-          );
-        }
+        resolveDebugModel(response, id, row);
         return;
       }
       // Fallthrough to share the error with Console entries.
diff --git a/packages/react-server/src/ReactFlightServer.js b/packages/react-server/src/ReactFlightServer.js
index f8926f5d69fd9..61b947946bddf 100644
--- a/packages/react-server/src/ReactFlightServer.js
+++ b/packages/react-server/src/ReactFlightServer.js
@@ -58,11 +58,10 @@ import type {
   FulfilledThenable,
   RejectedThenable,
   ReactDebugInfo,
+  ReactDebugInfoEntry,
   ReactComponentInfo,
-  ReactEnvironmentInfo,
   ReactIOInfo,
   ReactAsyncInfo,
-  ReactTimeInfo,
   ReactStackTrace,
   ReactCallSite,
   ReactFunctionLocation,
@@ -3869,11 +3868,7 @@ function emitDebugHaltChunk(request: Request, id: number): void {
 function emitDebugChunk(
   request: Request,
   id: number,
-  debugInfo:
-    | ReactComponentInfo
-    | ReactAsyncInfo
-    | ReactEnvironmentInfo
-    | ReactTimeInfo,
+  debugInfo: ReactDebugInfoEntry,
 ): void {
   if (!__DEV__) {
     // These errors should never make it into a build so we don't need to encode them in codes.json
diff --git a/packages/shared/ReactTypes.js b/packages/shared/ReactTypes.js
index 64eb0524a41df..33b43a1c8dc39 100644
--- a/packages/shared/ReactTypes.js
+++ b/packages/shared/ReactTypes.js
@@ -258,9 +258,13 @@ export type ReactTimeInfo = {
   +time: number, // performance.now
 };
 
-export type ReactDebugInfo = Array<
-  ReactComponentInfo | ReactEnvironmentInfo | ReactAsyncInfo | ReactTimeInfo,
->;
+export type ReactDebugInfoEntry =
+  | ReactComponentInfo
+  | ReactEnvironmentInfo
+  | ReactAsyncInfo
+  | ReactTimeInfo;
+
+export type ReactDebugInfo = Array<ReactDebugInfoEntry>;
 
 // Intrinsic ViewTransitionInstance. This type varies by Environment whether a particular
 // renderer supports it.
`
