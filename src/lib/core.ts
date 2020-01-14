/*
 * @Author:  hAo
 * @Date: 2020-01-08 22:01:37
 * @LastEditTime : 2020-01-14 17:31:25
 * @LastEditors  : hAo
 * @Description:  核心类
 * @FilePath: /counselor-react/wec-counselor-attendance-apps/src/utils/hao-http/core.ts
 */
import Axios, {
  AxiosRequestConfig,
  CancelTokenStatic,
  AxiosInstance,
  Canceler
} from "axios";

import { genConfig } from "./config";

import { transformConfigByMethod } from "./utils";

import {
  cancelTokenType,
  RequestMethods,
  HaoBaseHttpRequestConfig,
  HaoBaseHttpResoponse,
  HaoBaseHttpError
} from "./types.d";

class HaoBaseHttp {
  // 初始化配置对象
  private static initConfig: HaoBaseHttpRequestConfig = {};

  // 保存当前Axios实例对象
  private static axiosInstance: AxiosInstance;

  // 保存 HaoBaseHttp实例
  private static HaoBaseHttpInstance: HaoBaseHttp;

  // axios取消对象
  private CancelToken: CancelTokenStatic = Axios.CancelToken;

  // 取消的凭证数组
  private sourceTokenList: Array<cancelTokenType> = [];

  // 记录当前这一次cancelToken的key
  private currentCancelTokenKey = "";

  private beforeRequestCallback: HaoBaseHttpRequestConfig["beforeRequestCallback"] = undefined;

  private beforeResponseCallback: HaoBaseHttpRequestConfig["beforeResponseCallback"] = undefined;

  public get cancelTokenList(): Array<cancelTokenType> {
    return this.sourceTokenList;
  }

  // eslint-disable-next-line class-methods-use-this
  public set cancelTokenList(value) {
    throw new Error("cancelTokenList不允许赋值");
  }

  /**
   * @description 私有构造不允许实例化
   * @returns void 0
   */
  // constructor() {}

  /**
   * @description 生成唯一取消key
   * @param config axios配置
   * @returns string
   */
  // eslint-disable-next-line class-methods-use-this
  private genUniqueKey(config: HaoBaseHttpRequestConfig): string {
    return `${config.url}--${JSON.stringify(config.data)}`;
  }

  /**
   * @description 取消重复请求
   * @returns void 0
   */
  private cancelRepeatRequest(): void {
    const temp: { [key: string]: boolean } = {};

    this.sourceTokenList = this.sourceTokenList.reduce<Array<cancelTokenType>>(
      (res: Array<cancelTokenType>, cancelToken: cancelTokenType) => {
        const { cancelKey, cancelExecutor } = cancelToken;
        if (!temp[cancelKey]) {
          temp[cancelKey] = true;
          res.push(cancelToken);
        } else {
          cancelExecutor();
        }
        return res;
      },
      []
    );
  }

  /**
   * @description 删除指定的CancelToken
   * @returns void 0
   */
  private deleteCancelTokenByCancelKey(cancelKey: string): void {
    this.sourceTokenList =
      this.sourceTokenList.length < 1
        ? this.sourceTokenList.filter(
          cancelToken => cancelToken.cancelKey !== cancelKey
        )
        : [];
  }

  /**
   * @description 拦截请求
   * @returns void 0
   */

  private httpInterceptorsRequest(): void {
    HaoBaseHttp.axiosInstance.interceptors.request.use(
      (config: HaoBaseHttpRequestConfig) => {
        const $config = config;

        const cancelKey = this.genUniqueKey($config);

        $config.cancelToken = new this.CancelToken((cancelExecutor: (cancel: any) => void) => {
          this.sourceTokenList.push({ cancelKey, cancelExecutor });
        });

        this.cancelRepeatRequest();

        this.currentCancelTokenKey = cancelKey;
        // 优先判断post/get等方法是否传入回掉，否则执行初始化设置等回掉
        if (typeof this.beforeRequestCallback === "function") {
          this.beforeRequestCallback($config);
          this.beforeRequestCallback = undefined;
          return $config;
        }
        if (HaoBaseHttp.initConfig.beforeRequestCallback) {
          HaoBaseHttp.initConfig.beforeRequestCallback($config);
          return $config;
        }
        return $config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * @description 清空当前cancelTokenList
   * @returns void 0
   */
  public clearCancelTokenList(): void {
    this.sourceTokenList.length = 0;
  }

  /**
   * @description 拦截相应
   * @returns void 0
   */
  private httpInterceptorsResponse(): void {
    const instance = HaoBaseHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: HaoBaseHttpResoponse) => {
        // 请求每次成功一次就删除当前canceltoken标记
        const cancelKey = this.genUniqueKey(response.config);
        this.deleteCancelTokenByCancelKey(cancelKey);
        // 优先判断post/get等方法是否传入回掉，否则执行初始化设置等回掉
        if (typeof this.beforeResponseCallback === "function") {
          this.beforeResponseCallback(response);
          this.beforeResponseCallback = undefined;
          return response.data;
        }
        if (HaoBaseHttp.initConfig.beforeResponseCallback) {
          HaoBaseHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }

        return response.data;
      },
      (error: HaoBaseHttpError) => {
        const $error = error;
        // 判断当前的请求中是否在 取消token数组理存在，如果存在则移除（单次请求流程）
        if (this.currentCancelTokenKey) {
          const haskey = this.sourceTokenList.filter(
            cancelToken => cancelToken.cancelKey === this.currentCancelTokenKey
          ).length;
          if (haskey) {
            this.sourceTokenList = this.sourceTokenList.filter(
              cancelToken =>
                cancelToken.cancelKey !== this.currentCancelTokenKey
            );
            this.currentCancelTokenKey = "";
          }
        }
        $error.isCancelRequest = Axios.isCancel($error);
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /**
   * @description 获取唯一实例
   * @returns HaoBaseHttp实例
   */
  static getInstance(): HaoBaseHttp {
    if (!this.HaoBaseHttpInstance) {
      this.axiosInstance = Axios.create(this.initConfig);
      this.HaoBaseHttpInstance = new HaoBaseHttp();
      this.HaoBaseHttpInstance.httpInterceptorsRequest();
      this.HaoBaseHttpInstance.httpInterceptorsResponse();
    }
    return this.HaoBaseHttpInstance;
  }

  // eslint-disable-next-line class-methods-use-this
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: HaoBaseHttpRequestConfig
  ): Promise<T> {
    const config = transformConfigByMethod(param, {
      method,
      url,
      ...axiosConfig
    } as HaoBaseHttpRequestConfig);

    // 单独处理自定义请求/响应回掉
    if (axiosConfig?.beforeRequestCallback) {
      this.beforeRequestCallback = axiosConfig.beforeRequestCallback;
    }
    if (axiosConfig?.beforeResponseCallback) {
      this.beforeResponseCallback = axiosConfig.beforeResponseCallback;
    }

    return new Promise((resolve, reject) => {
      HaoBaseHttp.axiosInstance
        .request(config)
        .then((response: HaoBaseHttpResoponse) => {
          resolve(response.data);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  public post<T>(
    url: string,
    params?: T,
    config?: HaoBaseHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  public get<T>(
    url: string,
    params?: T,
    config?: HaoBaseHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }

  /**
   * 注入初始化配置
   * @description 私有化方法
   * @param config axios配置
   * @returns void 0
   */
  static install(config?: HaoBaseHttpRequestConfig): void {
    this.initConfig = genConfig(config);
  }
}

export default HaoBaseHttp;
