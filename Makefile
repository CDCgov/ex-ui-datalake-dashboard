docker-pull:
	echo "Nothing to pull at this time"

build-app:
	mkdir -p dist
	npm i
	PUBLIC_URL=/datahub/ui/ npm run build
	cd build && tar -czvf ../dist/bundle.tar.gz *

docker-build:
	docker build \
		-t datahub-ui-dashboard \
		--rm \
		--build-arg SECURE_MODE=false \
		--build-arg REPORTING_URL="/reporting/" \
		--build-arg INDEXING_URL="/indexing/" \
		--build-arg STORAGE_URL="/storage/" \
		--build-arg DATAHUB_URL="/datahub/" \
		--build-arg CONSENT_URL="https://localhost:9443" \
		.

docker-start:
	docker run -d \
	-p 5000:80 \
	--name datahub-ui-dashboard_main \
	datahub-ui-dashboard

docker-stop:
	docker stop datahub-ui-dashboard_main
	docker rm datahub-ui-dashboard_main

docker-restart:
	make docker-stop 2>/dev/null || true
	make docker-start