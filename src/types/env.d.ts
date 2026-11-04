declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
  exit(code?: number): never;
};

