FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /spaceport-api .
RUN CGO_ENABLED=0 go build -o /healthcheck ./cmd/healthcheck

FROM gcr.io/distroless/static:nonroot
COPY --from=builder /spaceport-api /spaceport-api
COPY --from=builder /healthcheck /healthcheck
USER nonroot:nonroot
ENTRYPOINT ["/spaceport-api"]
