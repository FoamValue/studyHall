package com.studyhall.plants.config;

/**
 * 业务异常：携带统一响应码（40001 非法分类、40401 植物不存在等）。
 */
public class ApiException extends RuntimeException {

    private final int code;

    public ApiException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
