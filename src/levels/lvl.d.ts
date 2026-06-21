// Vite raw-text import of a .lvl level file → its contents as a string.
declare module '*.lvl?raw' {
  const src: string;
  export default src;
}
