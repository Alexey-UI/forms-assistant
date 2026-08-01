resource "yandex_dns_zone" "primary" {
  name        = "${replace(var.domain, ".", "-")}-zone"
  description = "Публичная зона для демо-стенда"
  zone        = "${var.domain}."
  public      = true
}

resource "yandex_dns_recordset" "app" {
  zone_id = yandex_dns_zone.primary.id
  name    = "${var.app_hostname}."
  type    = "A"
  ttl     = 300
  data    = [yandex_vpc_address.demo.external_ipv4_address[0].address]
}
