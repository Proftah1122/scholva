export class ApplicationError extends Error {
  readonly status: number;
  readonly type: string;
  readonly title: string;

  constructor(params: { readonly status: number; readonly type: string; readonly title: string; readonly detail: string }) {
    super(params.detail);
    this.name = "ApplicationError";
    this.status = params.status;
    this.type = params.type;
    this.title = params.title;
  }
}
