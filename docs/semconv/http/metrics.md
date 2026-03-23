# Produced Metrics - http


## Metric `http.server.active_requests`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `http.server.active_requests` | UpDownCounter | `{request}` | Number of active HTTP server requests. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `http.server.active_requests` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`http.request.method`](/http.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Required` | string | HTTP request method. [1] | `GET`; `POST`; `HEAD` |
| [`url.scheme`](/url.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Required` | string | The [URI scheme](https://www.rfc-editor.org/rfc/rfc3986#section-3.1) component identifying the used protocol. | `http`; `https` |
| [`server.address`](/server.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Opt-In` | string | Name of the local HTTP server that received the request. [2] | `example.com`; `10.1.2.80`; `/tmp/my.sock` |
| [`server.port`](/server.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Opt-In` | int | Port of the local HTTP server that received the request. [3] | `80`; `8080`; `443` |

**[1] `http.request.method`:** HTTP request method value SHOULD be "known" to the instrumentation.
By default, this convention defines "known" methods as the ones listed in [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-methods),
the PATCH method defined in [RFC5789](https://www.rfc-editor.org/rfc/rfc5789.html)
and the QUERY method defined in [httpbis-safe-method-w-body](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/?include_text=1).

If the HTTP request method is not known to instrumentation, it MUST set the `http.request.method` attribute to `_OTHER`.

If the HTTP instrumentation could end up converting valid HTTP request methods to `_OTHER`, then it MUST provide a way to override
the list of known HTTP methods. If this override is done via environment variable, then the environment variable MUST be named
OTEL_INSTRUMENTATION_HTTP_KNOWN_METHODS and support a comma-separated list of case-sensitive known HTTP methods.

![Development](https://img.shields.io/badge/-development-blue)
If this override is done via declarative configuration, then the list MUST be configurable via the `known_methods` property
(an array of case-sensitive strings with minimum items 0) under `.instrumentation/development.general.http.client` and/or
`.instrumentation/development.general.http.server`.

In either case, this list MUST be a full override of the default known methods,
it is not a list of known methods in addition to the defaults.

HTTP method names are case-sensitive and `http.request.method` attribute value MUST match a known HTTP method name exactly.
Instrumentations for specific web frameworks that consider HTTP methods to be case insensitive, SHOULD populate a canonical equivalent.
Tracing instrumentations that do so, MUST also set `http.request.method_original` to the original value.

**[2] `server.address`:** See [Setting `server.address` and `server.port` attributes](/docs/http/http-spans.md#setting-serveraddress-and-serverport-attributes).

> [!WARNING]
> Since this attribute is based on HTTP headers, opting in to it may allow an attacker
> to trigger cardinality limits, degrading the usefulness of the metric.

**[3] `server.port`:** See [Setting `server.address` and `server.port` attributes](/docs/http/http-spans.md#setting-serveraddress-and-serverport-attributes).

> [!WARNING]
> Since this attribute is based on HTTP headers, opting in to it may allow an attacker
> to trigger cardinality limits, degrading the usefulness of the metric.

---

`http.request.method` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `_OTHER` | Any HTTP method that the instrumentation has no prior knowledge of. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `CONNECT` | CONNECT method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `DELETE` | DELETE method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `GET` | GET method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `HEAD` | HEAD method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `OPTIONS` | OPTIONS method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `PATCH` | PATCH method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `POST` | POST method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `PUT` | PUT method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `QUERY` | QUERY method. | ![Development](https://img.shields.io/badge/-development-blue) |
| `TRACE` | TRACE method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |





## Metric `http.server.request.duration`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `http.server.request.duration` | Histogram | `s` | Duration of HTTP server requests. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | |


### `http.server.request.duration` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`http.request.method`](/http.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Required` | string | HTTP request method. [4] | `GET`; `POST`; `HEAD` |
| [`url.scheme`](/url.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Required` | string | The [URI scheme](https://www.rfc-editor.org/rfc/rfc3986#section-3.1) component identifying the used protocol. [5] | `http`; `https` |
| [`error.type`](/error.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Conditionally Required` If request has ended with an error. | string | Describes a class of error the operation ended with. [6] | `timeout`; `java.net.UnknownHostException`; `server_certificate_invalid`; `500` |
| [`http.response.status_code`](/http.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Conditionally Required` If and only if one was received/sent. | int | [HTTP response status code](https://tools.ietf.org/html/rfc7231#section-6). | `200` |
| [`http.route`](/http.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Conditionally Required` If and only if it's available | string | The matched route template for the request. This MUST be low-cardinality and include all static path segments, with dynamic path segments represented with placeholders. [7] | `/users/:userID?`; `my-controller/my-action/{id?}` |
| [`network.protocol.name`](/network.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Conditionally Required` [8] | string | [OSI application layer](https://wikipedia.org/wiki/Application_layer) or non-OSI equivalent. [9] | `http`; `spdy` |
| [`network.protocol.version`](/network.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Recommended` | string | The actual version of the protocol used for network communication. [10] | `1.0`; `1.1`; `2`; `3` |
| [`server.address`](/server.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Opt-In` | string | Name of the local HTTP server that received the request. [11] | `example.com`; `10.1.2.80`; `/tmp/my.sock` |
| [`server.port`](/server.md) | ![Stable](https://img.shields.io/badge/-stable-lightgreen) | `Opt-In` | int | Port of the local HTTP server that received the request. [12] | `80`; `8080`; `443` |
| [`user_agent.synthetic.type`](/user-agent.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | string | Specifies the category of synthetic traffic, such as tests or bots. [13] | `bot`; `test` |

**[4] `http.request.method`:** HTTP request method value SHOULD be "known" to the instrumentation.
By default, this convention defines "known" methods as the ones listed in [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-methods),
the PATCH method defined in [RFC5789](https://www.rfc-editor.org/rfc/rfc5789.html)
and the QUERY method defined in [httpbis-safe-method-w-body](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/?include_text=1).

If the HTTP request method is not known to instrumentation, it MUST set the `http.request.method` attribute to `_OTHER`.

If the HTTP instrumentation could end up converting valid HTTP request methods to `_OTHER`, then it MUST provide a way to override
the list of known HTTP methods. If this override is done via environment variable, then the environment variable MUST be named
OTEL_INSTRUMENTATION_HTTP_KNOWN_METHODS and support a comma-separated list of case-sensitive known HTTP methods.

![Development](https://img.shields.io/badge/-development-blue)
If this override is done via declarative configuration, then the list MUST be configurable via the `known_methods` property
(an array of case-sensitive strings with minimum items 0) under `.instrumentation/development.general.http.client` and/or
`.instrumentation/development.general.http.server`.

In either case, this list MUST be a full override of the default known methods,
it is not a list of known methods in addition to the defaults.

HTTP method names are case-sensitive and `http.request.method` attribute value MUST match a known HTTP method name exactly.
Instrumentations for specific web frameworks that consider HTTP methods to be case insensitive, SHOULD populate a canonical equivalent.
Tracing instrumentations that do so, MUST also set `http.request.method_original` to the original value.

**[5] `url.scheme`:** The scheme of the original client request, if known (e.g. from [Forwarded#proto](https://developer.mozilla.org/docs/Web/HTTP/Headers/Forwarded#proto), [X-Forwarded-Proto](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Forwarded-Proto), or a similar header). Otherwise, the scheme of the immediate peer request.

**[6] `error.type`:** If the request fails with an error before response status code was sent or received,
`error.type` SHOULD be set to exception type (its fully-qualified class name, if applicable)
or a component-specific low cardinality error identifier.

If response status code was sent or received and status indicates an error according to [HTTP span status definition](/docs/http/http-spans.md),
`error.type` SHOULD be set to the status code number (represented as a string), an exception type (if thrown) or a component-specific error identifier.

The `error.type` value SHOULD be predictable and SHOULD have low cardinality.
Instrumentations SHOULD document the list of errors they report.

The cardinality of `error.type` within one instrumentation library SHOULD be low, but
telemetry consumers that aggregate data from multiple instrumentation libraries and applications
should be prepared for `error.type` to have high cardinality at query time, when no
additional filters are applied.

If the request has completed successfully, instrumentations SHOULD NOT set `error.type`.

**[7] `http.route`:** MUST NOT be populated when this is not supported by the HTTP server framework as the route attribute should have low-cardinality and the URI path can NOT substitute it.
SHOULD include the [application root](/docs/http/http-spans.md#http-server-definitions) if there is one.

A static path segment is a part of the route template with a fixed, low-cardinality value. This includes literal strings like `/users/` and placeholders that
are constrained to a finite, predefined set of values, e.g. `{controller}` or `{action}`.

A dynamic path segment is a placeholder for a value that can have high cardinality and is not constrained to a predefined list like static path segments.

Instrumentations SHOULD use routing information provided by the corresponding web framework. They SHOULD pick the most precise source of routing information and MAY
support custom route formatting. Instrumentations SHOULD document the format and the API used to obtain the route string.

**[8] `network.protocol.name`:** If not `http` and `network.protocol.version` is set.

**[9] `network.protocol.name`:** The value SHOULD be normalized to lowercase.

**[10] `network.protocol.version`:** If protocol version is subject to negotiation (for example using [ALPN](https://www.rfc-editor.org/rfc/rfc7301.html)), this attribute SHOULD be set to the negotiated version. If the actual protocol version is not known, this attribute SHOULD NOT be set.

**[11] `server.address`:** See [Setting `server.address` and `server.port` attributes](/docs/http/http-spans.md#setting-serveraddress-and-serverport-attributes).

> [!WARNING]
> Since this attribute is based on HTTP headers, opting in to it may allow an attacker
> to trigger cardinality limits, degrading the usefulness of the metric.

**[12] `server.port`:** See [Setting `server.address` and `server.port` attributes](/docs/http/http-spans.md#setting-serveraddress-and-serverport-attributes).

> [!WARNING]
> Since this attribute is based on HTTP headers, opting in to it may allow an attacker
> to trigger cardinality limits, degrading the usefulness of the metric.

**[13] `user_agent.synthetic.type`:** This attribute MAY be derived from the contents of the `user_agent.original` attribute. Components that populate the attribute are responsible for determining what they consider to be synthetic bot or test traffic. This attribute can either be set for self-identification purposes, or on telemetry detected to be generated as a result of a synthetic request. This attribute is useful for distinguishing between genuine client traffic and synthetic traffic generated by bots or tests.

---

`error.type` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `_OTHER` | A fallback error value to be used when the instrumentation doesn't define a custom value. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |

---

`http.request.method` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `_OTHER` | Any HTTP method that the instrumentation has no prior knowledge of. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `CONNECT` | CONNECT method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `DELETE` | DELETE method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `GET` | GET method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `HEAD` | HEAD method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `OPTIONS` | OPTIONS method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `PATCH` | PATCH method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `POST` | POST method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `PUT` | PUT method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |
| `QUERY` | QUERY method. | ![Development](https://img.shields.io/badge/-development-blue) |
| `TRACE` | TRACE method. | ![Stable](https://img.shields.io/badge/-stable-lightgreen) |

---

`user_agent.synthetic.type` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `bot` | Bot source. | ![Development](https://img.shields.io/badge/-development-blue) |
| `test` | Synthetic test source. | ![Development](https://img.shields.io/badge/-development-blue) |



