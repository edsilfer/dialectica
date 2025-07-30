export const DIFF = `diff --git a/packages/react-client/src/ReactFlightClient.js b/packages/react-client/src/ReactFlightClient.js
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
+
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
