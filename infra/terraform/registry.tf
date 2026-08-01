resource "yandex_container_registry" "demo" {
  name      = "${var.vm_name}-registry"
  folder_id = var.folder_id
}

resource "yandex_iam_service_account" "ci" {
  name        = "${var.vm_name}-ci"
  description = "Узкие права: только push/pull образов в Container Registry (для GitHub Actions)"
  folder_id   = var.folder_id
}

resource "yandex_resourcemanager_folder_iam_member" "ci_pusher" {
  folder_id = var.folder_id
  role      = "container-registry.images.pusher"
  member    = "serviceAccount:${yandex_iam_service_account.ci.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "ci_puller" {
  folder_id = var.folder_id
  role      = "container-registry.images.puller"
  member    = "serviceAccount:${yandex_iam_service_account.ci.id}"
}

resource "yandex_iam_service_account_key" "ci" {
  service_account_id = yandex_iam_service_account.ci.id
  description        = "Ключ для docker login / imagePullSecret в GitHub Actions"
  key_algorithm      = "RSA_2048"
}

resource "local_sensitive_file" "ci_key" {
  filename = "${path.module}/secrets/ci-sa-key.json"
  content = jsonencode({
    id                 = yandex_iam_service_account_key.ci.id
    service_account_id = yandex_iam_service_account_key.ci.service_account_id
    created_at         = yandex_iam_service_account_key.ci.created_at
    key_algorithm      = yandex_iam_service_account_key.ci.key_algorithm
    public_key         = yandex_iam_service_account_key.ci.public_key
    private_key        = yandex_iam_service_account_key.ci.private_key
  })
}
