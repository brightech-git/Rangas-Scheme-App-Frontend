declare module '@env' {
  export const API_BASE_URL: string;
  export const IMAGE_BASE_URL: string;
}

declare module '*.png' {
  const value: any;
  export default value;
}
