import { HaoBaseHttpRequestConfig } from "./types.d";

/*
 * @Author:  hAo
 * @Date: 2020-01-08 15:11:18
 * @LastEditTime : 2020-01-13 16:55:42
 * @LastEditors  : hAo
 * @Description: 工具类
 * @FilePath: /counselor-react/wec-counselor-attendance-apps/src/utils/hao-http/utils.ts
 */

export function excludeProps<T extends { [key: string]: any }>(
  origin: T,
  prop: string
): { [key: string]: T } {
  return Object.keys(origin)
    .filter(key => !prop.includes(key))
    .reduce((res, key) => {
      res[key] = origin[key];
      return res;
    }, {} as { [key: string]: T });
}

export function transformConfigByMethod(
  params: any,
  config: HaoBaseHttpRequestConfig
): HaoBaseHttpRequestConfig {
  const { method } = config;
  const props = ["delete", "get", "head", "options"].includes(
    method!.toLocaleLowerCase()
  )
    ? "params"
    : "data";
  return {
    ...config,
    [props]: params
  };
}
