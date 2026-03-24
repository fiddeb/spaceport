# Produced Metrics - spaceport


## Metric `spaceport.booking.active`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.booking.active` | UpDownCounter | `{booking}` | Number of confirmed bookings currently in the system. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.booking.active` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |





## Metric `spaceport.booking.count`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.booking.count` | Counter | `{booking}` | Number of booking attempts processed by the API. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.booking.count` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.booking.status`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Status of the booking. | `confirmed`; `failed` |
| [`spaceport.departure.destination`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Destination of the departure (e.g. planet, station, or sector name). | `Mars Colony Alpha`; `Kepler-442b`; `Deep Space Station 9` |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |

---

`spaceport.booking.status` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `confirmed` | Booking was successfully confirmed. | ![Development](https://img.shields.io/badge/-development-blue) |
| `failed` | Booking failed. | ![Development](https://img.shields.io/badge/-development-blue) |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |





## Metric `spaceport.departure.active`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.departure.active` | UpDownCounter | `{departure}` | Number of departures currently available for booking. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.departure.active` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.departure.destination`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Destination of the departure (e.g. planet, station, or sector name). | `Mars Colony Alpha`; `Kepler-442b`; `Deep Space Station 9` |





## Metric `spaceport.frontend.bookings`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.frontend.bookings` | Counter | `{booking}` | Booking attempts made from the frontend. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.frontend.bookings` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`outcome`](/.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Whether the booking succeeded or failed. | `success`; `failure` |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |





## Metric `spaceport.frontend.exhibit_dwell_time`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.frontend.exhibit_dwell_time` | Histogram | `s` | Time an exhibit remained visible in the viewport. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.frontend.exhibit_dwell_time` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.exhibit.id`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | URL-safe slug identifying the exhibit section. | `strategic-case`; `core-signals`; `semconv-weaver` |





## Metric `spaceport.frontend.exhibit_views`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.frontend.exhibit_views` | Counter | `{view}` | Number of times an exhibit section scrolled into the viewport. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.frontend.exhibit_views` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.exhibit.id`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | URL-safe slug identifying the exhibit section. | `strategic-case`; `core-signals`; `semconv-weaver` |
| [`spaceport.exhibit.title`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Human-readable title of the exhibit. | `The Strategic Case for OpenTelemetry`; `Core Signals` |





## Metric `spaceport.frontend.page_views`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.frontend.page_views` | Counter | `{view}` | Page views counted by page name. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.frontend.page_views` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`page.name`](/.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Identifier for the page being viewed. | `departure_list`; `departure_detail`; `information_desk` |





## Metric `spaceport.pricing.failures.count`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.pricing.failures.count` | Counter | `{failure}` | Number of pricing service call failures from the API. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.pricing.failures.count` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |





## Metric `spaceport.pricing.request.duration`

| Name | Instrument Type | Unit (UCUM) | Description | Stability | Entity Associations |
| -------- | --------------- | ----------- | -------------- | --------- | ------ |
| `spaceport.pricing.request.duration` | Histogram | `ms` | Duration of price calculation requests from the API to the pricing service. | ![Development](https://img.shields.io/badge/-development-blue) | |


### `spaceport.pricing.request.duration` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |
| [`spaceport.pricing.display_currency`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The currency in which the price is displayed to the user. | `UNC`; `REP`; `LAT` |
| [`spaceport.pricing.promo_applied`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | boolean | Whether a promotional discount was applied to the booking. | `true`; `false` |
| [`spaceport.chaos.failure_mode`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | string | The type of failure injected by the chaos module. | `timeout`; `error_500`; `slow_response`; `booking_failure` |

---

`spaceport.pricing.display_currency` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `BZD` | Breen Dilithium | ![Development](https://img.shields.io/badge/-development-blue) |
| `LAT` | Latinum | ![Development](https://img.shields.io/badge/-development-blue) |
| `NIN` | Ningi | ![Development](https://img.shields.io/badge/-development-blue) |
| `QUA` | Quatloos | ![Development](https://img.shields.io/badge/-development-blue) |
| `REP` | Republic Credits | ![Development](https://img.shields.io/badge/-development-blue) |
| `UNC` | Universal Nano Credits | ![Development](https://img.shields.io/badge/-development-blue) |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |



