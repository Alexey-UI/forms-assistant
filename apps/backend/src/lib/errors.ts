export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Некорректный запрос', details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Требуется авторизация') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Не найдено') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфликт данных') {
    super(409, message);
  }
}
