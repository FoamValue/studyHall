package com.studyhall.plants.model;

/**
 * 三语名称：中文 / 拼音 / 英文 / 音标。
 * audioZh / audioEn 为可选预生成音频相对路径（如 /audio/apple-zh.m4a），可空表示无音频，后端仅透传。
 */
public record I18nName(String zh, String pinyin, String en, String ipa,
                       String audioZh, String audioEn) {
}
