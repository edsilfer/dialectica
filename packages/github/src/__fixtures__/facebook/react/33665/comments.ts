export const COMMENTS = [
  {
    url: 'https://api.github.com/repos/apache/spark/pulls/comments/682317335',
    pull_request_review_id: 721897266,
    id: 682317335,
    node_id: 'MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDY4MjMxNzMzNQ==',
    diff_hunk:
      '@@ -10,6 +10,7 @@ object MimaExcludes {\n \n   // Exclude rules for 3.2.x from 3.1.0 after 3.1.0 release\n   lazy val v32excludes = v31excludes ++ Seq(\n+    ProblemFilters.exclude[IncompatibleResultTypeProblem]("org.apache.spark.sql.expressions.MutableAggregationBuffer.jsonValue"),\n     ProblemFilters.exclude[IncompatibleMethTypeProblem]("org.apache.spark.ml.param.FloatParam.jValueDecode"),\n     ProblemFilters.exclude[IncompatibleMethTypeProblem]("org.apache.spark.mllib.tree.model.TreeEnsembleModel#SaveLoadV1_0.readMetadata"),\n     ProblemFilters.exclude[IncompatibleResultTypeProblem]("org.apache.spark.sql.expressions.MutableAggregationBuffer.jsonValue")',
    path: 'packages/react-client/src/ReactFlightClient.js',
    commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    original_commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    user: {
      login: 'fake-user',
      id: 12345678,
      node_id: 'MDQ6VXNlcjEyMzQ1Njc4',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/fake-user',
      html_url: 'https://github.com/fake-user',
      followers_url: 'https://api.github.com/users/fake-user/followers',
      following_url: 'https://api.github.com/users/fake-user/following{/other_user}',
      gists_url: 'https://api.github.com/users/fake-user/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/fake-user/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/fake-user/subscriptions',
      organizations_url: 'https://api.github.com/users/fake-user/orgs',
      repos_url: 'https://api.github.com/users/fake-user/repos',
      events_url: 'https://api.github.com/users/fake-user/events{/privacy}',
      received_events_url: 'https://api.github.com/users/fake-user/received_events',
      type: 'User',
      user_view_type: 'public',
      site_admin: false,
    },
    body: 'This is a fake comment added for testing purposes. It should appear on line 13 right side.\n ## Example of header\n Here we will **test out** some _markdown_ rendering:\n ```json\n{\n  "name": "John",\n  "age": 30\n}\n```',
    created_at: '2021-08-04T06:10:00Z',
    updated_at: '2021-08-04T06:10:00Z',
    html_url: 'https://github.com/apache/spark/pull/33630#discussion_r682317335',
    pull_request_url: 'https://api.github.com/repos/apache/spark/pulls/33630',
    author_association: 'CONTRIBUTOR',
    _links: {
      self: {
        href: 'https://api.github.com/repos/apache/spark/pulls/comments/682317335',
      },
      html: {
        href: 'https://github.com/apache/spark/pull/33630#discussion_r682317335',
      },
      pull_request: {
        href: 'https://api.github.com/repos/apache/spark/pulls/33630',
      },
    },
    reactions: {
      url: 'https://api.github.com/repos/apache/spark/pulls/comments/682317335/reactions',
      total_count: 0,
      '+1': 0,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    start_line: null,
    original_start_line: null,
    start_side: null,
    line: 13,
    original_line: 13,
    side: 'RIGHT',
    original_position: 3,
    position: 3,
    subject_type: 'line',
  },
  {
    url: 'https://api.github.com/repos/apache/spark/pulls/comments/682317336',
    pull_request_review_id: 721897267,
    id: 682317336,
    node_id: 'MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDY4MjMxNzMzNg==',
    diff_hunk:
      '@@ -167,6 +167,7 @@ type PendingChunk<T> = {\n   value: null | Array<InitializationReference | (T => mixed)>,\n   reason: null | Array<InitializationReference | (mixed => mixed)>,\n   _children: Array<SomeChunk<any>> | ProfilingResult, // Profiling-only\n+  _blockedDebugInfo?: any, // DEV-only\n   _debugInfo?: null | ReactDebugInfo, // DEV-only\n   then(resolve: (T) => mixed, reject?: (mixed) => mixed): void,\n };',
    path: 'packages/react-client/src/ReactFlightClient.js',
    commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    original_commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    user: {
      login: 'dongjoon-hyun',
      id: 9700541,
      node_id: 'MDQ6VXNlcjk3MDA1NDE=',
      avatar_url: 'https://avatars.githubusercontent.com/u/9700541?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/dongjoon-hyun',
      html_url: 'https://github.com/dongjoon-hyun',
      followers_url: 'https://api.github.com/users/dongjoon-hyun/followers',
      following_url: 'https://api.github.com/users/dongjoon-hyun/following{/other_user}',
      gists_url: 'https://api.github.com/users/dongjoon-hyun/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/dongjoon-hyun/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/dongjoon-hyun/subscriptions',
      organizations_url: 'https://api.github.com/users/dongjoon-hyun/orgs',
      repos_url: 'https://api.github.com/users/dongjoon-hyun/repos',
      events_url: 'https://api.github.com/users/dongjoon-hyun/events{/privacy}',
      received_events_url: 'https://api.github.com/users/dongjoon-hyun/received_events',
      type: 'User',
      user_view_type: 'public',
      site_admin: false,
    },
    body: '`MutableAggregationBuffer` itself seems to be used in our API. Is `jsonValue` incompatibility okay?\r\n\r\n```scala\r\n  /**\r\n   * Initializes the given aggregation buffer, i.e. the zero value of the aggregation buffer.\r\n   *\r\n   * The contract should be that applying the merge function on two initial buffers should just\r\n   * return the initial buffer itself, i.e.\r\n   * `merge(initialBuffer, initialBuffer)` should equal `initialBuffer`.\r\n   *\r\n   * @since 1.5.0\r\n   */\r\n  def initialize(buffer: MutableAggregationBuffer): Unit\r\n```\r\n\r\ncc @HyukjinKwon , @cloud-fan ',
    created_at: '2021-08-04T06:15:31Z',
    updated_at: '2021-08-04T06:16:09Z',
    html_url: 'https://github.com/apache/spark/pull/33630#discussion_r682317336',
    pull_request_url: 'https://api.github.com/repos/apache/spark/pulls/33630',
    author_association: 'MEMBER',
    _links: {
      self: {
        href: 'https://api.github.com/repos/apache/spark/pulls/comments/682317336',
      },
      html: {
        href: 'https://github.com/apache/spark/pull/33630#discussion_r682317336',
      },
      pull_request: {
        href: 'https://api.github.com/repos/apache/spark/pulls/33630',
      },
    },
    reactions: {
      url: 'https://api.github.com/repos/apache/spark/pulls/comments/682317336/reactions',
      total_count: 3,
      '+1': 2,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 1,
      rocket: 0,
      eyes: 0,
    },
    start_line: null,
    original_start_line: null,
    start_side: null,
    line: 167,
    original_line: 167,
    side: 'RIGHT',
    original_position: 7,
    position: 7,
    subject_type: 'line',
  },
  {
    url: 'https://api.github.com/repos/apache/spark/pulls/comments/682326873',
    pull_request_review_id: 721909143,
    id: 682326873,
    node_id: 'MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDY4MjMyNjg3Mw==',
    diff_hunk:
      '@@ -58,11 +58,10 @@ import type {\n   FulfilledThenable,\n   RejectedThenable,\n   ReactDebugInfo,\n+  ReactDebugInfoEntry,\n   ReactComponentInfo,\n-  ReactEnvironmentInfo,\n   ReactIOInfo,\n   ReactAsyncInfo,\n-  ReactTimeInfo,\n   ReactStackTrace,\n   ReactCallSite,\n   ReactFunctionLocation,',
    path: 'packages/react-server/src/ReactFlightServer.js',
    commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    original_commit_id: '02782040e91b9ba38d72f43d016727b94efd405d',
    user: {
      login: 'sarutak',
      id: 4736016,
      node_id: 'MDQ6VXNlcjQ3MzYwMTY=',
      avatar_url: 'https://avatars.githubusercontent.com/u/4736016?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/sarutak',
      html_url: 'https://github.com/sarutak',
      followers_url: 'https://api.github.com/users/sarutak/followers',
      following_url: 'https://api.github.com/users/sarutak/following{/other_user}',
      gists_url: 'https://api.github.com/users/sarutak/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/sarutak/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/sarutak/subscriptions',
      organizations_url: 'https://api.github.com/users/sarutak/orgs',
      repos_url: 'https://api.github.com/users/sarutak/repos',
      events_url: 'https://api.github.com/users/sarutak/events{/privacy}',
      received_events_url: 'https://api.github.com/users/sarutak/received_events',
      type: 'User',
      user_view_type: 'public',
      site_admin: false,
    },
    body: "`MutableAggregationBuffer.jsonValue` is marked as `private[sql]` so I thought it's OK. But if I'm missing something, please let me know.\r\nMaybe, users need to re-compile their applications due to the binary compatibility of `MutableAggregationBuffer` will break?",
    created_at: '2021-08-04T06:34:54Z',
    updated_at: '2021-08-04T06:34:55Z',
    html_url: 'https://github.com/apache/spark/pull/33630#discussion_r682326873',
    pull_request_url: 'https://api.github.com/repos/apache/spark/pulls/33630',
    author_association: 'MEMBER',
    _links: {
      self: {
        href: 'https://api.github.com/repos/apache/spark/pulls/comments/682326873',
      },
      html: {
        href: 'https://github.com/apache/spark/pull/33630#discussion_r682326873',
      },
      pull_request: {
        href: 'https://api.github.com/repos/apache/spark/pulls/33630',
      },
    },
    reactions: {
      url: 'https://api.github.com/repos/apache/spark/pulls/comments/682326873/reactions',
      total_count: 2,
      '+1': 0,
      '-1': 0,
      laugh: 1,
      hooray: 1,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    start_line: null,
    original_start_line: null,
    start_side: null,
    line: 59,
    original_line: 58,
    side: 'LEFT',
    in_reply_to_id: 682317336,
    original_position: 7,
    position: 7,
    subject_type: 'line',
  },
]
