package com.studyhall.plants.model;

/**
 * 统一响应包装：{code, data, message}，code=0 表示成功。
 */
public record ApiResponse<T>(int code, T data, String message) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, data, "ok");
    }

    public static ApiResponse<Void> error(int code, String message) {
        return new ApiResponse<>(code, null, message);
    }
}
