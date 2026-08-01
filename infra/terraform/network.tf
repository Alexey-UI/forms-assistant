data "yandex_vpc_subnet" "existing" {
  subnet_id = var.subnet_id
}

resource "yandex_vpc_security_group" "demo" {
  name       = "${var.vm_name}-sg"
  network_id = data.yandex_vpc_subnet.existing.network_id

  ingress {
    protocol       = "TCP"
    description    = "SSH"
    port           = 22
    v4_cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    protocol       = "TCP"
    description    = "HTTP"
    port           = 80
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol       = "TCP"
    description    = "HTTPS"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol       = "TCP"
    description    = "Kubernetes API (k3s)"
    port           = 6443
    v4_cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    protocol       = "ANY"
    description    = "Весь исходящий трафик"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "yandex_vpc_address" "demo" {
  name = "${var.vm_name}-ip"

  external_ipv4_address {
    zone_id = var.zone
  }
}
