project-foundation — everything else depends on the repo structure and build system
pricing-service — no dependencies on other app services, standalone
spaceport-api — depends on pricing-service being defined
spaceport-frontend — depends on the API contract
demo-experience — depends on all three services being instrumented