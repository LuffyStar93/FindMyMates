export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string, name = "HttpError") {
    super(message);
    this.status = status;
    this.name = name;
  }
}

export const createHttpError = (status: number, message: string) => new HttpError(status, message);