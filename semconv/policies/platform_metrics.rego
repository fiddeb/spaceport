package after_resolution
import rego.v1

# Enforces constraints on metrics in the 'platform' namespace:
# 1. Must use only counter or histogram instruments
# 2. Must have at least one required attribute

is_platform_metric(group) if {
    group.type == "metric"
    startswith(group.metric_name, "platform.")
}

platform_metric_violation(description, group_id, metric_name) = violation if {
    violation := {
        "id": description,
        "type": "semconv_attribute",
        "category": "platform_metric_policy",
        "group": group_id,
        "attr": metric_name,
    }
}

# platform.* metrics MUST use counter or histogram instruments only
deny contains platform_metric_violation(description, group.id, group.metric_name) if {
    group := input.groups[_]
    is_platform_metric(group)
    not group.instrument in {"counter", "histogram"}
    description := sprintf(
        "Metric '%s' uses instrument '%s'. Platform namespace metrics must use 'counter' or 'histogram' only.",
        [group.metric_name, group.instrument]
    )
}

# platform.* metrics MUST have at least one required attribute
deny contains platform_metric_violation(description, group.id, group.metric_name) if {
    group := input.groups[_]
    is_platform_metric(group)
    not any_required_attribute(group)
    description := sprintf(
        "Metric '%s' has no required attributes. Platform namespace metrics must have at least one attribute with requirement_level: required.",
        [group.metric_name]
    )
}

any_required_attribute(group) if {
    attr := group.attributes[_]
    attr.requirement_level == "required"
}
