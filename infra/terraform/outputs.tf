output "vm_external_ip" {
  description = "Публичный IP демо-VM"
  value       = yandex_vpc_address.demo.external_ipv4_address[0].address
}

output "vm_internal_ip" {
  description = "Внутренний IP демо-VM"
  value       = yandex_compute_instance.demo.network_interface[0].ip_address
}

output "ssh_command" {
  description = "Команда для подключения по SSH"
  value       = "ssh ${var.admin_username}@${yandex_vpc_address.demo.external_ipv4_address[0].address}"
}

output "dns_zone_id" {
  description = "ID DNS-зоны в Yandex Cloud (используем для просмотра NS через CLI/консоль)"
  value       = yandex_dns_zone.primary.id
}

output "registry_id" {
  description = "ID Container Registry"
  value       = yandex_container_registry.demo.id
}

output "app_url" {
  description = "URL приложения после настройки Ingress/TLS"
  value       = "https://${var.app_hostname}"
}
