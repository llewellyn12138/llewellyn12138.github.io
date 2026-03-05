---
title: Windows CMD & PowerShell 常用命令大全       # 文章标题
date: 2026-03-05 10:00:00        # 创建日期 (YYYY-MM-DD HH:mm:ss)
updated: 2026-03-05 10:00:00      # 更新日期 (可选)
tags:         # 标签 (数组格式)
  - Windows
  - CMD
  - PowerShell
  - 效率工具
categories: coding  # 分类
keywords: Windows, CMD, PowerShell, 命令行, 常用命令, 脚本, 教程    # 关键词 (SEO)
description: Windows 命令行（CMD）和 PowerShell 常用命令速查表，包含文件操作、网络、系统管理及脚本语法。 # 文章摘要
image: images/project-4-1200x800-original.jpg       # 代表图/缩略图

# --- Butterfly 主题特有属性 ---
cover: images/project-4-1200x800-original.jpg       # 首页显示的缩略图 (若不设置则取 image)
top_img:      # 文章顶部的背景图 (若为 false 则不显示)
sticky:       # 置顶权重 (数字越大越靠前)
comments:     # 是否显示评论 (true/false)
toc:          # 是否显示目录 (true/false)
toc_number:   # 目录是否显示编号
toc_expand:   # 目录是否默认展开
copyright:    # 是否显示版权文章 (true/false)
copyright_author:  # 版权作者
copyright_author_href: # 版权作者链接
copyright_url:     # 版权文章链接
copyright_info:    # 版权声明内容
mathjax:      # 是否开启 MathJax
katex:        # 是否开启 KaTeX
aplayer:      # 是否开启 APlayer
highlight_shrink:  # 代码块是否收缩 (true/false)
aside:        # 是否显示侧边栏 (true/false)
ai:           # 是否显示 AI 摘要 (部分插件支持)
---

# Windows CMD & PowerShell 常用命令大全

本文档整理了 Windows 命令行（CMD）和 PowerShell 中**最常用**的指令。

> **说明**：Windows 系统包含成千上万个命令（尤其是 PowerShell，可以通过安装模块无限扩展），要列出“所有”命令是不现实且不便于查询的。本文档精选了日常开发、运维和系统管理中 **95% 场景** 下会用到的核心命令。

为了区分适用环境，本文使用以下标签进行标识：

- <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> : 仅能在 CMD (命令提示符) 中使用。
- <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> : 仅能在 PowerShell 中使用。
- <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> : 在 CMD 和 PowerShell 中均可直接使用。

## 1. 目录与文件操作 (File & Directory)

| 适用性 | 命令 | 描述 | 常用参数 (CMD/通用) | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `cd` | 切换当前目录 | `/d`: 跨盘符切换 (仅CMD) | `cd /d D:\Work` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `dir` | 列出目录内容 | `/a`: 显示隐藏文件<br>`/s`: 递归子目录<br>`/b`: 仅显示文件名 | `dir /s /b *.txt` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `md` | 创建新目录 | (无常用参数) | `md new_folder` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `rd` | 删除目录 | `/s`: 删除目录树(含文件)<br>`/q`: 安静模式(不确认) | `rd /s /q temp_dir` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `del` | 删除文件 | `/f`: 强制删除只读文件<br>`/s`: 递归子目录<br>`/q`: 安静模式 | `del /f /q *.log` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `copy` | 复制文件 | `/y`: 不提示直接覆盖 | `copy /y a.txt b.txt` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `xcopy` | 复制文件和目录树 | `/s`: 复制非空目录<br>`/e`: 包含空目录<br>`/y`: 覆盖不提示 | `xcopy /s /e src dest` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `robocopy` | 健壮的文件复制工具 | `/mir`: 镜像同步<br>`/z`: 断点续传<br>`/mt`: 多线程 | `robocopy src dest /mir` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `move` | 移动/重命名 | `/y`: 不提示直接覆盖 | `move /y old.txt new/` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `ren` | 重命名文件 | (无常用参数) | `ren old.txt new.txt` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `type` | 查看文本内容 | (无常用参数) | `type readme.md` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `tree` | 树状图显示 | `/f`: 显示文件名 | `tree /f` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `New-Item` | 创建文件/目录 | `-ItemType File/Directory`: 指定类型<br>`-Force`: 强制创建 | `ni -ItemType File test.txt` |

## 2. 网络操作 (Network)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `ping` | 测试连通性 | `-t`: 持续Ping<br>`-n <数字>`: 指定次数<br>`-l <字节>`: 指定包大小 | `ping -t 8.8.8.8` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `ipconfig` | 查看IP配置 | `/all`: 详细信息(含MAC)<br>`/flushdns`: 刷新DNS缓存<br>`/release`: 释放IP | `ipconfig /flushdns` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `netstat` | 端口与连接 | `-a`: 显示所有连接<br>`-n`: 数字形式显示IP/端口<br>`-o`: 显示进程PID | `netstat -ano` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `tracert` | 路由跟踪 | `-d`: 不解析主机名(更快) | `tracert -d 8.8.8.8` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `nslookup` | 域名解析 | `type=mx`: 查询邮件记录<br>`8.8.8.8`: 指定DNS服务器 | `nslookup google.com` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `telnet` | 端口测试 | (无，直接跟IP和端口) | `telnet 127.0.0.1 80` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `ssh` | SSH远程登录 | `-p`: 指定端口 | `ssh user@192.168.1.1` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `scp` | SSH远程复制 | `-P`: 指定端口(注意大写) | `scp local.txt user@host:/tmp` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Test-NetConnection` | 网络测试 | `-Port`: 指定端口<br>`-TraceRoute`: 路由跟踪 | `tnc google.com -Port 443` |

## 3. 进程与服务管理 (Process & Service)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `tasklist` | 列出进程 | `/fi`: 筛选器<br>`/m`: 列出加载的模块 | `tasklist /fi "MEMUSAGE gt 50000"` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `taskkill` | 结束进程 | `/f`: 强制终止<br>`/im`: 按镜像名称<br>`/pid`: 按PID | `taskkill /f /im notepad.exe` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `net start/stop` | 管理服务 | (无) | `net stop "print spooler"` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `sc` | 服务控制 | `query`: 查询状态<br>`config`: 修改配置<br>`delete`: 删除服务 | `sc query state= all` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Process` | 获取进程 | `-Name`: 按名称<br>`-Id`: 按ID | `gps -Name chrome` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Stop-Process` | 结束进程 | `-Force`: 强制<br>`-PassThru`: 输出结果 | `kill -Name notepad -Force` |

## 4. 系统信息与管理 (System Info)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `systeminfo` | 系统详细信息 | `/fo list`: 列表格式输出 | `systeminfo | findstr "OS"` |
| <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> | `ver` | Windows 版本号 | (无) | `ver` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `whoami` | 当前用户 | `/user`: 显示SID<br>`/groups`: 显示用户组 | `whoami /user` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `shutdown` | 关机/重启 | `/s`: 关机<br>`/r`: 重启<br>`/t <秒>`: 倒计时<br>`/a`: 取消 | `shutdown /s /t 60` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `cls` | 清屏 | (无) | `cls` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-ComputerInfo` | 极详尽信息 | `-Property`: 指定属性 | `Get-ComputerInfo -Property Os*` |

## 5. 用户与组管理 (User & Group)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `net user` | 用户管理 | `/add`: 添加用户<br>`/delete`: 删除用户<br>`/active:yes`: 激活 | `net user guest /active:yes` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `net localgroup` | 用户组管理 | `/add`: 添加组或成员<br>`/delete`: 删除 | `net localgroup administrators User /add` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `runas` | 以其他用户身份运行 | `/user:<用户>`: 指定用户 | `runas /user:Administrator cmd` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-LocalUser` | 获取本地用户 | (无) | `Get-LocalUser` |

## 6. 软件包与磁盘管理 (Package & Disk)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `winget` | Windows包管理器 | `search`: 搜索<br>`install`: 安装<br>`upgrade`: 更新 | `winget install Microsoft.PowerToys` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `diskpart` | 磁盘分区工具 | (交互式工具) | `diskpart` -> `list disk` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Disk` | 获取磁盘信息 | (无) | `Get-Disk` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Partition` | 获取分区信息 | (无) | `Get-Partition` |

## 7. 高级系统管理与维护 (Advanced Admin & Maintenance)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `sfc` | 系统文件检查修复 | `/scannow`: 立即扫描并修复系统文件 | `sfc /scannow` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `dism` | 映像部署与管理(修复系统) | `/Online /Cleanup-Image /RestoreHealth`: 修复映像 | `dism /Online /Cleanup-Image /RestoreHealth` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `chkdsk` | 磁盘检查 | `/f`: 修复错误<br>`/r`: 查找坏扇区并恢复 | `chkdsk C: /f` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `icacls` | 文件权限管理(ACL) | `/grant`: 授权<br>`/deny`: 拒绝<br>`/reset`: 重置权限 | `icacls file.txt /grant User:F` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `attrib` | 修改文件属性 | `+h`: 设为隐藏<br>`-h`: 取消隐藏<br>`+r`: 设为只读 | `attrib +h +s secret.txt` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `schtasks` | 计划任务管理 | `/create`: 创建任务<br>`/delete`: 删除任务 | `schtasks /query` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `setx` | 永久设置环境变量 | `/m`: 设置系统变量(需管理员) | `setx /m PATH "%PATH%;C:\Bin"` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `curl` | 发送网络请求 (PS中需用curl.exe) | `-I`: 仅查看Header<br>`-o`: 下载保存 | `curl -I https://google.com` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Invoke-WebRequest` | 发送Web请求 | `-OutFile`: 下载保存<br>`-Method`: 指定方法 | `iwr google.com -OutFile index.html` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-FileHash` | 计算文件哈希值 | `-Algorithm`: 算法(MD5/SHA256) | `Get-FileHash file.iso -Algorithm MD5` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Compress-Archive` | 压缩文件/文件夹 | `-Path`: 源文件<br>`-DestinationPath`: 目标zip | `Compress-Archive -Path src -DestinationPath arc.zip` |

## 8. 其他实用工具 (Other Utilities)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `wsl` | Linux 子系统 | `--install`: 安装<br>`-d`: 指定发行版 | `wsl -d Ubuntu` |
| <span style="background-color: #2ea44f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">通用</span> | `explorer` | 打开资源管理器 | `.` : 打开当前目录 | `explorer .` |
| <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> | `clip` | 复制输出到剪贴板 | (作为管道目标) | `dir | clip` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Set-Clipboard` | 复制到剪贴板 | (作为管道目标) | `ls | Set-Clipboard` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Clipboard` | 读取剪贴板内容 | (无) | `Get-Clipboard` |

## 9. 帮助与策略 (Help & Policy)

| 适用性 | 命令 | 描述 | 常用参数 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> | `/?` | 获取命令帮助 | (跟在命令后) | `dir /?` |
| <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> | `help` | 列出所有命令 | (无) | `help` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Help` | 获取详细帮助 | `-Examples`: 显示示例<br>`-Full`: 完整信息 | `Get-Help Get-Service -Examples` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Command` | 查找命令 | `-Name`: 按名称查找 | `Get-Command *service*` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Get-Member` | 查看对象成员(属性/方法) | (无) | `"hello" | Get-Member` |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `Set-ExecutionPolicy` | 设置脚本执行策略 | `RemoteSigned`: 允许本地脚本 | `Set-ExecutionPolicy RemoteSigned` |

## 10. 脚本编写语法 (Script Syntax)

### 注释 (Comments)
- <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> : `REM` 或 `::`
- <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> : `#` (单行), `<# ... #>` (多行)

### 变量赋值 (Variables)
| 适用性 | 语法 | 示例 |
| :--- | :--- | :--- |
| <span style="background-color: #4d4d4d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">CMD</span> | `set 变量名=值` | `set name=Tom` <br> `set /a age=10+5` (数学运算) |
| <span style="background-color: #012456; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">PowerShell</span> | `$变量名 = 值` | `$name = "Tom"` <br> `$age = 10 + 5` |

### 数据结构 (Data Structures)
**PowerShell (特有)**:
```powershell
# 数组
$arr = 1, 2, 3
$arr += 4
echo $arr[0]

# 哈希表 (字典)
$dict = @{ "Name" = "Tom"; "Age" = 18 }
echo $dict["Name"]
```

### 条件判断 (If/Else)

**CMD**:
```cmd
if exist config.ini (
    echo Config found
) else (
    echo Config missing
)

if %ERRORLEVEL% EQU 0 echo Success
```

**PowerShell**:
```powershell
if (Test-Path config.ini) {
    Write-Host "Config found"
} else {
    Write-Host "Config missing"
}

# 比较运算符: -eq (等于), -ne (不等于), -gt (大于), -lt (小于), -like (通配符), -match (正则)
if ($name -like "T*") { echo "Match!" }
```

### 循环 (Loops)

**CMD (For Loop)**:
```cmd
:: 遍历当前目录下的 .txt 文件
for %%i in (*.txt) do (
    echo Found file: %%i
)

:: 数字循环 (从1到5)
for /L %%i in (1,1,5) do echo %%i
```

**PowerShell**:
```powershell
# Foreach 循环
foreach ($file in Get-ChildItem *.txt) {
    Write-Host "Found file: $($file.Name)"
}

# 管道式循环 (常用)
1..5 | ForEach-Object { echo $_ }
```

### 函数 (Functions)

**CMD**:
```cmd
:MyFunction
echo Hello from function!
echo Param: %1
goto :eof

:: 调用
call :MyFunction World
```

**PowerShell**:
```powershell
function Say-Hello {
    param(
        [string]$Name = "World"
    )
    Write-Host "Hello, $Name!"
}

# 调用
Say-Hello -Name "PowerShell"
```

### 错误处理 (Error Handling)

**CMD**:
```cmd
some_command
if %ERRORLEVEL% NEQ 0 (
    echo Command failed!
    exit /b 1
)
```

**PowerShell**:
```powershell
try {
    # 可能会出错的命令
    Get-Item "non_existent_file.txt" -ErrorAction Stop
} catch {
    Write-Error "Caught an error: $_"
}
```

## 11. 常用快捷键
- **Tab**: 自动补全
- **Ctrl + C**: 中断命令
- **Up/Down**: 历史命令
- **F7**: 查看历史命令列表 (仅 CMD)
