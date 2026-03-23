# Events - spaceport


## Event `exhibit_viewed`

**Status:** ![Development](https://img.shields.io/badge/-development-blue)

The event name MUST be `exhibit_viewed`.

Fired when an exhibit section first scrolls into the viewport.




### `exhibit_viewed` Attributes

**Attributes:**

| Key | Stability | [Requirement Level](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/) | Value Type | Description | Example Values |
| --- | --- | --- | --- | --- | --- |
| [`spaceport.exhibit.id`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Required` | string | URL-safe slug identifying the exhibit section. | `strategic-case`; `core-signals`; `semconv-weaver` |
| [`spaceport.exhibit.number`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | int | Display order number of the exhibit (1-based). | `1`; `3`; `7` |
| [`spaceport.exhibit.title`](/spaceport.md) | ![Development](https://img.shields.io/badge/-development-blue) | `Recommended` | string | Human-readable title of the exhibit. | `The Strategic Case for OpenTelemetry`; `Core Signals` |






