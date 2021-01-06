declare namespace NodeJS {
  interface ProcessEnv {
    BOATS_TOKEN?: string;
    NODE_ENV: 'development' | 'production';
    OWNERS: string;
    TOKEN: string;
  }
}
