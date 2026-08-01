variable "service_account_key_file" {
  description = "Путь до JSON-файла авторизованного ключа сервисного аккаунта (не коммитится)"
  type        = string
}

variable "cloud_id" {
  description = "ID облака в Yandex Cloud"
  type        = string
}

variable "folder_id" {
  description = "ID каталога (folder) в Yandex Cloud"
  type        = string
}

variable "zone" {
  description = "Зона доступности"
  type        = string
  default     = "ru-central1-b"
}

variable "subnet_id" {
  description = "ID существующей подсети (уже создана вручную в консоли)"
  type        = string
}

variable "vm_name" {
  description = "Имя и hostname VM"
  type        = string
  default     = "forms-assistant-demo"
}

variable "vm_cores" {
  description = "Количество vCPU"
  type        = number
  default     = 2
}

variable "vm_memory_gb" {
  description = "Объём RAM, ГБ"
  type        = number
  default     = 4
}

variable "vm_core_fraction" {
  description = "Гарантированная доля vCPU (%), 100 = без ограничения"
  type        = number
  default     = 100
}

variable "vm_disk_size_gb" {
  description = "Размер загрузочного диска, ГБ"
  type        = number
  default     = 20
}

variable "vm_image_id" {
  description = "ID образа ОС (Ubuntu 24.04 LTS)"
  type        = string
  default     = "fd8020c5t6gei8d1rpi1"
}

variable "admin_username" {
  description = "Имя пользователя для SSH-доступа на VM"
  type        = string
  default     = "alexey_sdv"
}

variable "ssh_public_key" {
  description = "Публичный SSH-ключ для доступа на VM"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "CIDR-блоки, которым разрешён SSH (22) и доступ к Kubernetes API (6443)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "domain" {
  description = "Корневой домен, купленный вручную (DNS переносим на Yandex Cloud DNS)"
  type        = string
}

variable "app_hostname" {
  description = "Полное доменное имя приложения (поддомен)"
  type        = string
}
