BINARY_NAME=api.exe
BUILD_DIR=bin

build:
	@echo "Building..."
	go build -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/api/main.go

run:
	go run cmd/api/main.go

test:
	go test -v ./...

clean:
	@echo "Cleaning..."
	@if [ -d "$(BUILD_DIR)" ]; then rm -rf $(BUILD_DIR); fi

.PHONY: build run test clean
