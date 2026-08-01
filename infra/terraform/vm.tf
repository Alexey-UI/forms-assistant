locals {
  cloud_init = <<-EOT
    #cloud-config
    datasource:
     Ec2:
      strict_id: false
    ssh_pwauth: no
    package_update: true
    packages:
      - curl
    users:
    - name: ${var.admin_username}
      sudo: ALL=(ALL) NOPASSWD:ALL
      shell: /bin/bash
      ssh_authorized_keys:
      - ${var.ssh_public_key}
  EOT
}

resource "yandex_compute_instance" "demo" {
  name        = var.vm_name
  hostname    = var.vm_name
  description = "Демо-стенд для показа Terraform/Docker/Kubernetes"
  platform_id = "standard-v3"
  zone        = var.zone

  resources {
    cores         = var.vm_cores
    memory        = var.vm_memory_gb
    core_fraction = var.vm_core_fraction
  }

  boot_disk {
    initialize_params {
      name     = "${var.vm_name}-boot-disk"
      type     = "network-ssd"
      size     = var.vm_disk_size_gb
      image_id = var.vm_image_id
    }
    auto_delete = true
  }

  network_interface {
    subnet_id          = var.subnet_id
    nat                = true
    nat_ip_address     = yandex_vpc_address.demo.external_ipv4_address[0].address
    security_group_ids = [yandex_vpc_security_group.demo.id]
  }

  scheduling_policy {
    preemptible = false
  }

  metadata = {
    user-data = local.cloud_init
    ssh-keys  = "${var.admin_username}:${var.ssh_public_key}"
  }
}
