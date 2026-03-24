## MODIFIED Requirements

### Requirement: Chaos spans include chaos attributes
When chaos mode (failure or latency) is active, the active span SHALL be annotated with `spaceport.chaos.failure_mode` (string) or `spaceport.chaos.latency_ms` (int) as attributes on the span. Chaos events SHALL be emitted as log records with `event.name` attribute (e.g. `chaos.failure_triggered`, `chaos.latency_injected`) via Python logging `extra` kwargs, replacing `span.add_event` calls. The OTel logging bridge SHALL route these to the OTLP collector with trace correlation. The `event.name` lands in OTLP log attributes (the Python logging bridge does not yet expose the top-level `EventName` field; it can be promoted in a future bridge upgrade).

#### Scenario: Failure span has chaos attribute
- **WHEN** simulate-failure is active and a pricing request fails
- **THEN** the span has attribute `spaceport.chaos.failure_mode` set and span status set to ERROR

#### Scenario: Chaos failure event is a log record
- **WHEN** simulate-failure is active and a pricing request fails
- **THEN** a log record with `event.name = "chaos.failure_triggered"` attribute and `spaceport.chaos.failure_mode` is emitted via Python logging, and no `span.add_event` call is made

#### Scenario: Chaos latency event is a log record
- **WHEN** simulate-latency is active and a pricing request is delayed
- **THEN** a log record with `event.name = "chaos.latency_injected"` attribute and `spaceport.chaos.latency_ms` is emitted via Python logging, and no `span.add_event` call is made
