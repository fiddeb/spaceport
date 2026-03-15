package before_resolution
import rego.v1

# Simple test policy
deny contains "Test violation" if {
    group := input.groups[_]
    group.type == "metric"
    group.metric_name == "MsalDurationInL1CacheInUs.1B"
}
