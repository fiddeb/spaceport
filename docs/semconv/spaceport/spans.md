# Spans - spaceport


## Span `span.spaceport.booking.create.server`

**Status:** ![Development](https://img.shields.io/badge/-development-blue)

Handles an incoming booking creation request in the API.

**Span kind** SHOULD be `SERVER`.

**Span status** SHOULD follow the [Recording Errors](/docs/general/recording-errors.md) document.




### `span.spaceport.booking.create.server` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.booking.id`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Unique identifier for the booking. | `BKG-001`; `BKG-9999-URGNT` |
| [`spaceport.booking.status`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Status of the booking. | `confirmed`; `failed` |
| [`spaceport.departure.id`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | Unique identifier for the departure. | `DEP-2350-ALPHA`; `DEP-0042` |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |
| [`spaceport.pricing.error`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Conditionally Required` if the pricing service call failed | string | Error message returned by the pricing service on failure. | `pricing unavailable`; `chaos mode: random failure` |
| [`spaceport.departure.destination`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Destination of the departure (e.g. planet, station, or sector name). | `Mars Colony Alpha`; `Kepler-442b`; `Deep Space Station 9` |
| [`spaceport.pricing.display_currency`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The currency in which the price is displayed to the user. | `UNC`; `REP`; `LAT` |
| [`spaceport.pricing.total`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | double | Total price of the booking in Universal Nano Credits (UNC). | `1500.0`; `42000.75` |

---

`spaceport.booking.status` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `confirmed` | Booking was successfully confirmed. | ![Development](https://img.shields.io/badge/-development-blue) |
| `failed` | Booking failed. | ![Development](https://img.shields.io/badge/-development-blue) |

---

`spaceport.pricing.display_currency` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `BZD` | Breen Dilithium | ![Development](https://img.shields.io/badge/-development-blue) |
| `COIN` | Space Coin | ![Development](https://img.shields.io/badge/-development-blue) |
| `LAT` | Latinum | ![Development](https://img.shields.io/badge/-development-blue) |
| `NIN` | Ningi | ![Development](https://img.shields.io/badge/-development-blue) |
| `QUA` | Quatloos | ![Development](https://img.shields.io/badge/-development-blue) |
| `REP` | Republic Credits | ![Development](https://img.shields.io/badge/-development-blue) |
| `TKN` | Token | ![Development](https://img.shields.io/badge/-development-blue) |
| `UNC` | Universal Nano Credits | ![Development](https://img.shields.io/badge/-development-blue) |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |





## Span `span.spaceport.booking.list.server`

**Status:** ![Development](https://img.shields.io/badge/-development-blue)

Handles a request to list all bookings from the API.

**Span kind** SHOULD be `SERVER`.

**Span status** SHOULD follow the [Recording Errors](/docs/general/recording-errors.md) document.




### `span.spaceport.booking.list.server` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.booking.status`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | string | Status of the booking. | `confirmed`; `failed` |

---

`spaceport.booking.status` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `confirmed` | Booking was successfully confirmed. | ![Development](https://img.shields.io/badge/-development-blue) |
| `failed` | Booking failed. | ![Development](https://img.shields.io/badge/-development-blue) |





## Span `span.spaceport.departure.list.server`

**Status:** ![Development](https://img.shields.io/badge/-development-blue)

Handles a request to list available departures from the API.

**Span kind** SHOULD be `SERVER`.

**Span status** SHOULD follow the [Recording Errors](/docs/general/recording-errors.md) document.




### `span.spaceport.departure.list.server` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.recommendations.error`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Conditionally Required` if the recommendations service call failed | string | Error message returned by the recommendations service on failure. | `recommendations unavailable`; `service timeout` |
| [`spaceport.departure.destination`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | string | Destination of the departure (e.g. planet, station, or sector name). | `Mars Colony Alpha`; `Kepler-442b`; `Deep Space Station 9` |





## Span `span.spaceport.pricing.calculate.client`

**Status:** ![Development](https://img.shields.io/badge/-development-blue)

Outbound call from the API to the pricing service to calculate a fare.

**Span kind** SHOULD be `CLIENT`.

**Span status** SHOULD follow the [Recording Errors](/docs/general/recording-errors.md) document.




### `span.spaceport.pricing.calculate.client` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.seat.class`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | The seat class selected for the booking. | `economy-cryosleep`; `business-warp`; `first-class-nebula` |
| [`spaceport.pricing.error`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Conditionally Required` if the pricing service call failed | string | Error message returned by the pricing service on failure. | `pricing unavailable`; `chaos mode: random failure` |
| [`spaceport.departure.destination`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Destination of the departure (e.g. planet, station, or sector name). | `Mars Colony Alpha`; `Kepler-442b`; `Deep Space Station 9` |
| [`spaceport.pricing.base_currency`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The base currency used for pricing. Always "UNC". | `UNC` |
| [`spaceport.pricing.display_currency`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | The currency in which the price is displayed to the user. | `UNC`; `REP`; `LAT` |
| [`spaceport.pricing.promo_applied`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | boolean | Whether a promotional discount was applied to the booking. | `true`; `false` |
| [`spaceport.pricing.total`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | double | Total price of the booking in Universal Nano Credits (UNC). | `1500.0`; `42000.75` |
| [`spaceport.chaos.failure_mode`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | string | The type of failure injected by the chaos module. | `timeout`; `error_500`; `slow_response`; `booking_failure` |
| [`spaceport.chaos.latency_ms`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Opt-In` | int | Artificial latency injected by the chaos module in milliseconds. | `100`; `500`; `2000` |

---

`spaceport.pricing.display_currency` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `BZD` | Breen Dilithium | ![Development](https://img.shields.io/badge/-development-blue) |
| `COIN` | Space Coin | ![Development](https://img.shields.io/badge/-development-blue) |
| `LAT` | Latinum | ![Development](https://img.shields.io/badge/-development-blue) |
| `NIN` | Ningi | ![Development](https://img.shields.io/badge/-development-blue) |
| `QUA` | Quatloos | ![Development](https://img.shields.io/badge/-development-blue) |
| `REP` | Republic Credits | ![Development](https://img.shields.io/badge/-development-blue) |
| `TKN` | Token | ![Development](https://img.shields.io/badge/-development-blue) |
| `UNC` | Universal Nano Credits | ![Development](https://img.shields.io/badge/-development-blue) |

---

`spaceport.seat.class` has the following list of well-known values. If one of them applies, then the respective value MUST be used; otherwise, a custom value MAY be used.

| Value | Description | Stability |
| --- | --- | --- |
| `business-warp` | Business class with warp-lounge access. | ![Development](https://img.shields.io/badge/-development-blue) |
| `economy-cryosleep` | Economy class with cryosleep pod. | ![Development](https://img.shields.io/badge/-development-blue) |
| `first-class-nebula` | First class nebula suite. | ![Development](https://img.shields.io/badge/-development-blue) |




