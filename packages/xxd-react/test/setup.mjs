// Node 26 自带的 localStorage（没有 --localstorage-file 时是 undefined）挡住了 happy-dom 的实现，这里补一个内存版。
class MemoryStorage {
  #m = new Map();
  get length() { return this.#m.size; }
  key(i) { return [...this.#m.keys()][i] ?? null; }
  getItem(k) { return this.#m.has(String(k)) ? this.#m.get(String(k)) : null; }
  setItem(k, v) { this.#m.set(String(k), String(v)); }
  removeItem(k) { this.#m.delete(String(k)); }
  clear() { this.#m.clear(); }
}
for (const name of ["localStorage", "sessionStorage"]) {
  if (!globalThis[name]) Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true, writable: true });
}
