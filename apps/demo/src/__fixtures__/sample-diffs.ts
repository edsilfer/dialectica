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
