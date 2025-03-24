build-image:
	docker build -t registry.xignature.co.id/xignature/public-placement:$(version) .
	docker push registry.xignature.co.id/xignature/public-placement:$(version)