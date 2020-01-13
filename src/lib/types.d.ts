/*
 * @Author: hAo
 * @Date: 2020-01-10 10:03:28
 * @LastEditTime : 2020-01-13 17:00:00
 * @LastEditors  : hAo
 * @Description: 类型定义
 * @FilePath: /counselor-react/wec-counselor-attendance-apps/src/utils/hao-http/types.d.ts
 */
import Axios, {
    AxiosRequestConfig,
    Canceler,
    AxiosResponse,
    Method,
    AxiosError
} from "axios";

import { METHODS } from './config'

export type cancelTokenType = { cancelKey: string, cancelExecutor: Canceler }

export type RequestMethods = Extract<Method, 'get' | 'post' | 'put' | 'delete' | 'patch' |
    'option' | 'head'>

export interface HaoBaseHttpRequestConfig extends AxiosRequestConfig {
    beforeRequestCallback?: (request: HaoBaseHttpRequestConfig) => void // 请求发送之前
    beforeResponseCallback?: (response: HaoBaseHttpResoponse) => void // 相应返回之前
}

export interface HaoBaseHttpResoponse extends AxiosResponse {
    config: HaoBaseHttpRequestConfig
}

export interface HaoBaseHttpError extends AxiosError {
    isCancelRequest?: boolean
}