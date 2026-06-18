export interface Container {
  readonly bootedAt: Date;
}

export function createContainer(): Container {
  return {
    bootedAt: new Date()
  };
}
