export {};
declare global {
  var noop: () => void;

  namespace NodeJS {
    interface Global {
      noop: () => void
    }
  }
}