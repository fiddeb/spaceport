package before_resolution
import rego.v1

# Policy to enforce OpenTelemetry metric naming conventions
# Based on: https://opentelemetry.io/docs/specs/semconv/general/naming/
#
# NOTE: This policy only applies to local registry files.
# Metrics from external dependencies (e.g., OTel semconv) are excluded.

# Helper to check if provenance is from external dependencies
is_external_dependency(provenance) if {
    contains(provenance, "github.com/open-telemetry")
}

is_external_dependency(provenance) if {
    contains(provenance, "semantic-conventions/archive")
}

# Helper to create metric naming violations
metric_naming_violation(description, group_id, metric_name, provenance) = violation if {
    violation := {
        "id": description,
        "type": "semconv_attribute",
        "category": "metric_naming",
        "group": group_id,
        "attr": metric_name,
        "provenance": provenance,
    }
}

# Rule 1: Names MUST be lowercase
# https://opentelemetry.io/docs/specs/semconv/general/naming/#general-naming-considerations
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    lower(group.metric_name) != group.metric_name
    
    description := sprintf(
        "Metric name '%s' contains uppercase letters. Names MUST be lowercase per OpenTelemetry naming conventions. Suggested: '%s'",
        [group.metric_name, lower(group.metric_name)]
    )
}

# Rule 2: Must start with a letter
# https://opentelemetry.io/docs/specs/semconv/general/naming/#recommendations-for-opentelemetry-authors
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    not regex.match(`^[a-z]`, group.metric_name)
    
    description := sprintf(
        "Metric name '%s' must start with a letter (a-z) per OpenTelemetry naming conventions.",
        [group.metric_name]
    )
}

# Rule 3: Must end with alphanumeric character
# https://opentelemetry.io/docs/specs/semconv/general/naming/#recommendations-for-opentelemetry-authors
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    not regex.match(`[a-z0-9]$`, group.metric_name)
    
    description := sprintf(
        "Metric name '%s' must end with an alphanumeric character per OpenTelemetry naming conventions.",
        [group.metric_name]
    )
}

# Rule 4: Must not contain consecutive delimiters (dots or underscores)
# https://opentelemetry.io/docs/specs/semconv/general/naming/#recommendations-for-opentelemetry-authors
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    regex.match(`[._]{2,}`, group.metric_name)
    
    description := sprintf(
        "Metric name '%s' contains consecutive delimiters (dots or underscores). Names must not contain consecutive delimiters per OpenTelemetry naming conventions.",
        [group.metric_name]
    )
}

# Rule 5: Must only contain lowercase letters, numbers, dots, and underscores
# https://opentelemetry.io/docs/specs/semconv/general/naming/#recommendations-for-opentelemetry-authors
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    not regex.match(`^[a-z][a-z0-9._]*[a-z0-9]$`, group.metric_name)
    not regex.match(`^[a-z]$`, group.metric_name)
    
    description := sprintf(
        "Metric name '%s' contains invalid characters. Names must only contain lowercase letters (a-z), digits (0-9), dots (.) for namespacing, and underscores (_) for snake_case.",
        [group.metric_name]
    )
}

# Rule 6: Must include namespace (contain at least one dot)
# https://opentelemetry.io/docs/specs/semconv/general/naming/#recommendations-for-opentelemetry-authors
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    not contains(group.metric_name, ".")
    
    description := sprintf(
        "Metric name '%s' must include a namespace. Use dot notation for namespacing (e.g., 'namespace.metric_name').",
        [group.metric_name]
    )
}

# Rule 7: Counter names SHOULD NOT use '_total' suffix
# https://opentelemetry.io/docs/specs/semconv/general/naming/#do-not-use-total
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    group.instrument
    not is_external_dependency(group.provenance)
    
    # Check if this is a counter or updowncounter
    group.instrument in ["counter", "updowncounter"]
    
    # Check if name ends with _total
    endswith(group.metric_name, "_total")
    
    description := sprintf(
        "Metric name '%s' uses '_total' suffix. Counters and UpDownCounters SHOULD NOT use '_total' suffix per OpenTelemetry naming conventions.",
        [group.metric_name]
    )
}

# Rule 8: UpDownCounter names SHOULD NOT be pluralized
# https://opentelemetry.io/docs/specs/semconv/general/naming/#do-not-pluralize-updowncounter-names
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    group.instrument == "updowncounter"
    not is_external_dependency(group.provenance)
    
    # Check if the metric name ends with common plural suffixes
    # This is a heuristic check for common English plurals
    regex.match(`\.(processes|instances|runs|connections|sessions|operations|requests|items|entries)$`, group.metric_name)
    
    description := sprintf(
        "UpDownCounter metric name '%s' appears to be pluralized. UpDownCounter names SHOULD NOT be pluralized per OpenTelemetry naming conventions. Consider using 'count' instead (e.g., 'system.process.count').",
        [group.metric_name]
    )
}

# Rule 9: Metric namespaces SHOULD NOT be pluralized
# https://opentelemetry.io/docs/specs/semconv/general/naming/#pluralization
deny contains metric_naming_violation(description, group.id, group.metric_name, group.provenance) if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name != null
    not is_external_dependency(group.provenance)
    
    # Extract namespace parts (everything except the last segment)
    parts := split(group.metric_name, ".")
    count(parts) > 1
    
    # Check namespace parts (all but the last) for plural forms
    namespace_parts := array.slice(parts, 0, count(parts) - 1)
    namespace_part := namespace_parts[_]
    
    # Common plural patterns in namespaces
    regex.match(`^(processes|instances|connections|sessions|operations|requests|items|entries|databases|systems|services|hosts|containers)$`, namespace_part)
    
    description := sprintf(
        "Metric name '%s' contains pluralized namespace segment '%s'. Metric namespaces SHOULD NOT be pluralized per OpenTelemetry naming conventions.",
        [group.metric_name, namespace_part]
    )
}
