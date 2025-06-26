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
