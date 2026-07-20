variable "TAG" {
  default = "v0.1.0"
}

group "default" {
  targets = ["app"]
}

target "app" {
  context = "."
  tags = [
    "ghcr.io/aaliboyev/sezzle-calculator:latest",
    "ghcr.io/aaliboyev/sezzle-calculator:${TAG}",
  ]
  labels = {
    "org.opencontainers.image.source" = "https://github.com/aaliboyev/sezzle-calculator"
  }
  platforms = ["linux/amd64"]
}
