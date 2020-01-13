/*
 * @Author: hAo
 * @Date: 2020-01-08 14:59:42
 * @LastEditTime : 2020-01-13 16:56:13
 * @LastEditors  : hAo
 * @Description: 配置
 * @FilePath: /counselor-react/wec-counselor-attendance-apps/src/utils/hao-http/config.ts
 */
import { AxiosRequestConfig } from "axios";
import { excludeProps } from "./utils";
/**
 * 默认配置
 */
export const defaultConfig: AxiosRequestConfig = {
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  }
};

export function genConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
  if (!config) {
    return defaultConfig;
  }

  const { headers } = config;
  if (headers && typeof headers === "object") {
    defaultConfig.headers = {
      ...defaultConfig.headers,
      ...headers
    };
  }
  return { ...excludeProps(config!, "headers"), ...defaultConfig };
}

export const METHODS = ["post", "get", "put", "delete", "option", "patch"];
