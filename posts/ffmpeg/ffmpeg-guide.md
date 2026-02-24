---
title: FFmpeg 基础命令指南
category: ffmpeg
date: 2023-01-02
description: FFmpeg 常用视频转码、剪辑、合并命令详解。
image: images/project-2-1200x800-original.jpg
---

# FFmpeg 基础命令指南

FFmpeg 是一款强大的多媒体处理工具。

## 1. 视频转码
将 MP4 转换为 AVI：
```bash
ffmpeg -i input.mp4 output.avi
```

## 2. 提取音频
从视频中提取 MP3 音频：
```bash
ffmpeg -i video.mp4 -vn -acodec libmp3lame -q:a 2 audio.mp3
```

## 3. 视频剪切
从第 10 秒开始，剪切 20 秒：
```bash
ffmpeg -ss 00:00:10 -t 00:00:20 -i input.mp4 -c copy output.mp4
```

## 4. 视频合并
将多个视频合并为一个（需创建 filelist.txt）：
```bash
ffmpeg -f concat -i filelist.txt -c copy output.mp4
```
