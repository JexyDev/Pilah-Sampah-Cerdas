export class DatabaseUnavailableError extends Error {
  constructor(message = "Database is down or unreachable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}
