.PHONY: build test fmt snapshot deploy-alfajores deploy-celo heartbeat journal

build:        ; forge build
test:         ; forge test -vv
fmt:          ; forge fmt
snapshot:     ; forge snapshot

# Deploy the full stack (reads .env: PRIVATE_KEY, AGENT_ADDRESS, TREASURY, CELOSCAN_API_KEY)
deploy-alfajores: ; forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
deploy-celo:      ; forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify

# Autonomous ops (reads ops/.env)
heartbeat:    ; cd ops && npm install && npm run heartbeat
journal:      ; cd ops && npm install && npm run journal
