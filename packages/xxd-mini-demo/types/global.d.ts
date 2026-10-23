/// <reference types="@tarojs/taro" />
declare module "*.css";
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    TARO_ENV: "weapp" | "h5" | "alipay" | "tt" | "swan" | "qq" | "jd";
  }
}
