// 图标的分类和搜索关键词（中文为主，带几个英文同义词）。只给展示站、命令行搜索用，不打进 icons.js。
// 每个图标恰好在一个分类里（test/meta.test.mjs 检查）。关键词用空格分开。
export const ICON_GROUPS = [
  {
    id: "arrows", zh: "箭头与方向", en: "Arrows",
    icons: {
      ArrowUp: "向上 上移 上箭头", ArrowDown: "向下 下移 下箭头", ArrowLeft: "向左 返回 后退 back", ArrowRight: "向右 前进 下一步 next",
      ArrowUpRight: "右上 跳转 打开", ArrowUpLeft: "左上", ArrowDownLeft: "左下", ArrowDownRight: "右下",
      ArrowLeftRight: "左右 交换 互换 swap", ArrowUpDown: "上下 排序 交换 sort",
      ArrowLeftToLine: "到最左 到开头 收起", ArrowRightToLine: "到最右 到结尾 展开", ArrowUpToLine: "置顶 到顶部 top", ArrowDownToLine: "置底 到底部 bottom",
      ArrowDownWideNarrow: "降序 排序 从大到小 sort", ArrowUpNarrowWide: "升序 排序 从小到大 sort", ArrowDownAZ: "按字母排序 A-Z 排序",
      ChevronDown: "下拉 展开 向下 折叠", ChevronUp: "收起 向上", ChevronLeft: "上一个 向左 返回", ChevronRight: "下一个 向右 进入",
      ChevronsUpDown: "上下 选择 下拉 切换", ChevronsLeft: "最前 第一页 双左", ChevronsRight: "最后 末页 双右", ChevronsUp: "全部收起 双上", ChevronsDown: "全部展开 双下",
      CornerDownLeft: "回车 确认 enter", CornerDownRight: "缩进 子项 转到", CornerUpLeft: "返回 撤回", CornerUpRight: "转发 跳转",
      Move: "移动 拖动 四向", Maximize: "全屏 最大化 fullscreen", Minimize: "退出全屏 最小化", Maximize2: "放大 展开 弹出", Minimize2: "缩小 收起 合并",
      RefreshCw: "刷新 重新加载 同步 reload", RotateCcw: "逆时针 重置 撤销 恢复", RotateCw: "顺时针 旋转 重做", Repeat: "循环 重复 loop", Shuffle: "随机 打乱",
      Undo: "撤销 undo", Redo: "重做 redo", Reply: "回复 reply", ReplyAll: "全部回复", Forward: "转发 forward",
      TrendingUp: "上涨 增长 趋势", TrendingDown: "下跌 下降 趋势", Navigation: "导航 方向 定位箭头", MousePointer2: "鼠标 指针 光标 选择",
      MousePointerClick: "点击 鼠标 click",
    },
  },
  {
    id: "actions", zh: "常用操作", en: "Actions",
    icons: {
      Plus: "加 添加 新建 add", Minus: "减 删除一项 收起", X: "关闭 取消 删除 close", Check: "对 完成 确认 勾选 done", CheckCheck: "已读 全部完成 双勾",
      Search: "搜索 查找 放大镜 find", SearchX: "清空搜索 无结果", ZoomIn: "放大 zoom", ZoomOut: "缩小 zoom",
      Copy: "复制 拷贝 copy", CopyCheck: "已复制", ClipboardPaste: "粘贴 paste", Clipboard: "剪贴板", ClipboardCheck: "已粘贴 核对 清单完成", ClipboardList: "清单 任务列表",
      Scissors: "剪切 剪刀 cut", Trash: "删除 垃圾桶 回收站 delete", Trash2: "删除 垃圾桶", Delete: "退格 删除字符 backspace",
      Download: "下载 保存到本地", Upload: "上传", Import: "导入", ExternalLink: "外部链接 新窗口打开", Send: "发送 提交", Share: "分享 导出", Share2: "分享 社交",
      LogOut: "退出 登出 注销", LogIn: "登录 进入 sign in", Save: "保存 存盘", Archive: "归档 收起来", Pin: "置顶 固定 钉住", Paperclip: "附件 回形针",
      Filter: "筛选 过滤 漏斗", FilterX: "清除筛选", ListFilter: "筛选 排序", SlidersHorizontal: "调节 设置 参数", SlidersVertical: "调节 均衡器 参数",
      Settings: "设置 偏好 选项", Settings2: "设置", Cog: "设置 齿轮 gear 配置", Menu: "菜单 汉堡", Ellipsis: "更多 省略 ...", EllipsisVertical: "更多 竖排",
      GripVertical: "拖动 把手 排序", Grip: "拖动 把手", GripHorizontal: "拖动 横向把手",
      Pencil: "编辑 修改 铅笔 edit", Pen: "编辑 写", PencilLine: "编辑 签名 书写", SquarePen: "编辑 写新的 compose",
      Eraser: "橡皮 擦除 清除", Highlighter: "荧光笔 高亮 标记", Paintbrush: "刷子 画笔 样式", Pipette: "取色 吸管", Ruler: "尺子 测量 尺寸", Crop: "裁剪 crop",
      Eye: "显示 查看 可见 预览", EyeOff: "隐藏 不可见", ScanEye: "检查 审阅 预览",
      Bookmark: "书签 收藏 稍后看", BookmarkPlus: "加书签 收藏", BookmarkCheck: "已收藏", BookmarkX: "取消收藏",
      Heart: "喜欢 收藏 爱心 like", Star: "星标 收藏 评分 favorite", ThumbsUp: "赞 点赞 好评 like", ThumbsDown: "踩 差评 不喜欢", Flag: "旗帜 举报 标记",
      Power: "电源 开关 关机", ToggleLeft: "开关 关闭 off", ToggleRight: "开关 打开 on",
      Link: "链接 网址 link", Unlink: "取消链接 断开", Command: "命令 快捷键 cmd", Keyboard: "键盘 快捷键 输入",
      CirclePlus: "添加 新增", CircleMinus: "移除 减少", SquarePlus: "添加 新增", SquareMinus: "移除 折叠", SquareX: "关闭 删除",
      Sparkle: "星光 魔法 AI", Sparkles: "AI 智能 魔法 闪光 生成", WandSparkles: "魔法棒 自动 AI 一键",
    },
  },
  {
    id: "status", zh: "状态与提示", en: "Status",
    icons: {
      CircleCheck: "成功 完成 通过", CircleAlert: "警告 注意 出错", CircleX: "失败 错误 关闭", CirclePause: "暂停 挂起", Info: "信息 说明 提示", CircleHelp: "帮助 问号 疑问 help",
      TriangleAlert: "警告 危险 注意 warning", OctagonAlert: "严重 停止 错误", OctagonX: "禁止 停止 错误", Octagon: "停止 八边形",
      BadgeCheck: "认证 已验证 官方 verified", Ban: "禁止 不可用 屏蔽", Loader: "加载 等待 转圈 loading", LoaderCircle: "加载 等待 转圈",
      Bell: "通知 提醒 消息", BellRing: "响铃 新通知", BellPlus: "添加提醒 订阅", BellOff: "关闭通知 静音 免打扰", BellDot: "未读 新通知 红点",
      Activity: "活动 心率 状态 监控", Zap: "闪电 快速 即时 电", Flame: "热门 火 hot", Lightbulb: "灵感 提示 想法 idea", Award: "奖章 荣誉 成就", Trophy: "奖杯 冠军 第一", Crown: "皇冠 会员 VIP 高级",
      Gem: "宝石 会员 高级 钻石", Rocket: "发布 上线 启动 加速", Target: "目标 瞄准 goal", Crosshair: "瞄准 准星 定位",
      CircleDashed: "草稿 未开始 待定", CircleDot: "进行中 选中 单选", Circle: "圆 未选 空", Dot: "点 状态点", Contrast: "对比度 外观 主题 跟随系统",
      Smile: "笑脸 满意 表情 emoji", Frown: "难过 不满意 表情", Meh: "一般 无感 表情",
    },
  },
  {
    id: "text", zh: "文本与编辑器", en: "Text",
    icons: {
      Text: "文本 正文 段落", Type: "字体 文字 排版", Bold: "加粗 粗体 B", Italic: "斜体 I", Underline: "下划线 U", Strikethrough: "删除线 划掉",
      Heading: "标题 H", Heading1: "一级标题 H1", Heading2: "二级标题 H2", Heading3: "三级标题 H3", Quote: "引用 引号", Pilcrow: "段落 换行符",
      AlignLeft: "左对齐", AlignCenter: "居中", AlignRight: "右对齐", AlignJustify: "两端对齐",
      List: "列表 无序", ListOrdered: "有序列表 编号", ListChecks: "待办 清单 复选", ListTree: "树 层级 目录",
      IndentIncrease: "增加缩进", IndentDecrease: "减少缩进", WrapText: "自动换行 折行", RemoveFormatting: "清除格式", SpellCheck: "拼写检查 校对",
      CaseSensitive: "大小写 区分大小写 Aa", TextCursorInput: "输入框 文本框 光标", SeparatorHorizontal: "分隔线 分割",
      Languages: "语言 翻译 多语言 i18n", Hash: "井号 话题 标签 编号 #", AtSign: "提及 @ 邮箱", Asterisk: "星号 必填 *", Sigma: "求和 公式 合计",
      Percent: "百分比 % 折扣", Equal: "等于 =", Divide: "除 ÷", Infinity: "无限 无穷 不限",
    },
  },
  {
    id: "files", zh: "文件与存储", en: "Files",
    icons: {
      File: "文件 文档 空白", FileText: "文档 文章 文本文件", FilePlus2: "新建文件", FileDown: "下载文件 导出", FileUp: "上传文件 导入", Files: "多个文件 文件组",
      FileCode: "代码文件 源码", FileImage: "图片文件", FileVideo: "视频文件", FileAudio: "音频文件 音乐", FileArchive: "压缩包 zip", FileSpreadsheet: "表格 Excel csv",
      FileJson: "JSON 配置文件", FileCheck: "已审核 文件通过", FileX: "文件删除 文件错误", FileMinus: "移除文件", FileSearch: "查找文件", FilePen: "编辑文件 签字",
      FileLock: "加密文件 私密", FileClock: "文件历史 最近文件",
      Folder: "文件夹 目录", FolderOpen: "打开文件夹", FolderPlus: "新建文件夹", FolderInput: "移入文件夹 导入", FolderUp: "上传到文件夹", FolderCog: "文件夹设置",
      Folders: "多个文件夹", FolderMinus: "移除文件夹", FolderX: "删除文件夹", FolderCheck: "文件夹完成", FolderDown: "下载到文件夹 保存位置", FolderSearch: "在文件夹里查找",
      FolderLock: "私密文件夹 加密",
      Image: "图片 照片 image", Images: "多张图片 相册 图库", ImagePlus: "添加图片", ImageUp: "上传图片", ImageOff: "无图 图片加载失败",
      HardDrive: "硬盘 磁盘 存储", Database: "数据库 存储 数据", Server: "服务器 主机", Cloud: "云 云端", CloudUpload: "上传到云 备份", CloudDownload: "从云下载",
      CloudCheck: "已同步 已备份", CloudOff: "离线 未同步",
      Inbox: "收件箱 待处理", Layers: "图层 层级 堆叠", Library: "资料库 书库 收藏", Book: "书 手册 文档", BookOpen: "阅读 书 打开", BookOpenText: "阅读 文档 教程",
      BookMarked: "书签 读到这里", Notebook: "笔记本 记事", NotebookTabs: "笔记 分类", StickyNote: "便签 便利贴 备注", Newspaper: "新闻 资讯 文章",
      Package: "包裹 安装包 模块", PackageCheck: "已签收 安装完成", PackageX: "包裹异常 卸载",
    },
  },
  {
    id: "layout", zh: "布局与界面", en: "Layout",
    icons: {
      LayoutGrid: "网格 宫格 卡片视图", LayoutDashboard: "仪表盘 控制台 概览", LayoutList: "列表视图", LayoutTemplate: "模板 布局",
      Columns2: "两栏", Columns3: "三栏", Rows2: "两行", Rows3: "三行", Grid3x3: "九宫格 表格", Table: "表格 数据表",
      PanelsTopLeft: "布局 顶栏侧栏", PanelLeft: "侧栏 左侧面板", PanelLeftClose: "收起侧栏", PanelLeftOpen: "展开侧栏", PanelRight: "右侧面板",
      PanelRightOpen: "展开右侧面板 侧边栏", PanelRightClose: "收起右侧面板", PanelTop: "顶栏 标题栏", PanelBottom: "底栏 底部面板", AppWindow: "窗口 应用 浏览器",
      Square: "方块 方形", Square2: "停止 小方块", CheckSquare: "复选框 已勾选", SquareDashed: "选区 框选 占位", Ratio: "比例 尺寸 宽高比",
      Kanban: "看板 任务板", Frame: "画框 画板", Component: "组件 模块", Blocks: "区块 组件 模块", Puzzle: "插件 扩展 拼图 extension",
      Shapes: "形状 图形", Triangle: "三角形", Hexagon: "六边形", Diamond: "菱形",
      Workflow: "流程 工作流", Network: "网络 结构 组织 层级",
      Presentation: "演示 幻灯片 PPT",
    },
  },
  {
    id: "communication", zh: "通讯与社交", en: "Communication",
    icons: {
      Mail: "邮件 邮箱 信 email", MailCheck: "邮件已发送 已读", MailSearch: "搜索邮件", MailOpen: "已读邮件 打开的信", MailPlus: "写邮件 新邮件", MailX: "删除邮件 退信",
      Mails: "多封邮件 群发", MessageCircle: "消息 聊天 评论 对话框 圆", MessageSquare: "消息 聊天 评论 方形气泡", MessageSquareText: "评论 留言 消息", MessageSquarePlus: "发起对话 添加评论",
      MessageSquareWarning: "反馈 投诉 报错", MessagesSquare: "群聊 讨论 对话",
      Phone: "电话 打电话 手机号", PhoneCall: "来电 通话中", Video: "视频 摄像 会议", VideoOff: "关闭摄像头", Mic: "麦克风 录音 语音", MicOff: "静音 关闭麦克风",
      Headphones: "耳机 客服 收听", Megaphone: "公告 广播 推广 通知", Rss: "订阅 RSS 资讯源", Radio: "广播 直播 信号",
      Bot: "机器人 AI 助手 bot", Contact: "联系人 名片 通讯录",
      Globe: "网站 全球 地球 互联网 language", QrCode: "二维码 扫码", Barcode: "条形码 商品码",
    },
  },
  {
    id: "people", zh: "人物与账号", en: "People",
    icons: {
      User: "用户 账号 个人", UserRound: "用户 头像", UserPlus: "添加用户 邀请 注册", UserMinus: "移除用户", UserRoundCheck: "已认证用户 已关注", UserRoundX: "移除用户 拉黑",
      UserRoundPen: "编辑资料", UserSearch: "查找用户", Users: "多人 团队 群组 成员", CircleUser: "头像 个人中心 我的", SquareUser: "头像 资料卡",
      PersonStanding: "人 无障碍 站立",
    },
  },
  {
    id: "media", zh: "媒体与播放", en: "Media",
    icons: {
      Play: "播放 开始", Pause: "暂停", CirclePlay: "播放", CircleStop: "停止", SkipBack: "上一首 上一个", SkipForward: "下一首 下一个", Rewind: "快退", FastForward: "快进",
      Volume: "音量 声音", Volume1: "小音量", Volume2: "音量 声音 喇叭", VolumeX: "静音",
      Music: "音乐 歌曲", ListMusic: "播放列表 歌单", Film: "电影 视频 胶片", Clapperboard: "视频 剪辑 拍摄", Captions: "字幕", Tv: "电视 直播 节目", Disc: "光盘 唱片",
      Camera: "相机 拍照 摄影", Webcam: "摄像头", Palette: "调色板 颜色 主题", Blend: "混合 叠加", Droplets: "颜色 液体 主色", Rainbow: "彩虹 多彩 主色",
    },
  },
  {
    id: "devices", zh: "设备与连接", en: "Devices",
    icons: {
      Smartphone: "手机 移动端", Tablet: "平板", Laptop: "笔记本电脑", Monitor: "显示器 电脑 桌面端", MonitorPlay: "屏幕播放 投屏", Watch: "手表 穿戴",
      Printer: "打印 打印机", Mouse: "鼠标", Gamepad: "游戏 手柄", Cpu: "芯片 处理器 性能", Plug: "插头 连接 接入", PlugZap: "已连接 充电 接入", Unplug: "断开连接 拔出",
      Wifi: "无线 网络 WiFi", WifiOff: "断网 离线", Bluetooth: "蓝牙", Signal: "信号 强度", Cast: "投屏 投射",
      Battery: "电池 电量", BatteryLow: "电量低", BatteryMedium: "电量一半", BatteryFull: "满电", BatteryCharging: "充电中",
    },
  },
  {
    id: "commerce", zh: "购物与金钱", en: "Commerce",
    icons: {
      ShoppingCart: "购物车 加购", ShoppingBag: "购物袋 下单 商城", Store: "商店 店铺", CreditCard: "银行卡 信用卡 支付", Wallet: "钱包 余额", WalletCards: "钱包 卡包 会员卡",
      Banknote: "钞票 现金 收入", Coins: "硬币 积分 零钱", CircleDollarSign: "金额 价格 美元 付费", Receipt: "收据 发票 账单 订单", Calculator: "计算器 计算",
      Ticket: "票 优惠券 兑换", TicketCheck: "已核销 已使用", TicketPlus: "领券 添加优惠券", Gift: "礼物 礼品 赠送", Tag: "标签 价签", Tags: "多个标签 分类",
      Truck: "物流 配送 快递 发货", Scale: "天平 比较 公平 法律", BadgePercent: "折扣 优惠 促销",
    },
  },
  {
    id: "charts", zh: "图表与数据", en: "Charts",
    icons: {
      ChartColumn: "柱状图 统计 数据", ChartBar: "条形图 排行", ChartLine: "折线图 趋势", ChartArea: "面积图", ChartPie: "饼图 占比", ChartNoAxesCombined: "增长 数据 趋势 组合图",
      Gauge: "仪表 速度 性能 评分", FlaskConical: "实验 测试 试验 beta",
    },
  },
  {
    id: "time", zh: "时间与日历", en: "Time",
    icons: {
      Clock: "时钟 时间", Clock3: "时间 三点", History: "历史 最近 记录", Timer: "计时 秒表 倒计时", TimerOff: "停止计时 取消定时", AlarmClock: "闹钟 提醒", Hourglass: "沙漏 等待 限时",
      Calendar: "日历 日期", CalendarCheck: "已预约 完成日期", CalendarPlus: "添加日程", CalendarX: "取消日程", CalendarDays: "日历 每天 月视图", CalendarClock: "定时 计划 排期",
      Sun: "白天 亮色 浅色 light", Moon: "夜间 暗色 深色 dark", MoonStar: "夜间 晚安", Sunrise: "日出 早上", Sunset: "日落 傍晚",
    },
  },
  {
    id: "security", zh: "安全与隐私", en: "Security",
    icons: {
      Shield: "安全 保护 防护", ShieldCheck: "安全 已保护 已验证", ShieldAlert: "安全警告 风险", ShieldX: "不安全 拦截",
      Lock: "锁 加密 私密 上锁", LockKeyhole: "锁 密码", LockOpen: "解锁 公开 打开", Key: "钥匙 密钥 API key 密码",
      Fingerprint: "指纹 生物识别 身份", ScanFace: "人脸识别 面容", Scan: "扫描 扫一扫", ScanLine: "扫描 扫码", Focus: "对焦 聚焦 专注",
    },
  },
  {
    id: "places", zh: "地点与交通", en: "Places",
    icons: {
      House: "首页 主页 家 home", Building: "公司 办公楼 企业", Building2: "公司 楼 机构", Landmark: "银行 机构 政府 博物馆", Factory: "工厂 生产", Warehouse: "仓库 库存",
      MapPin: "位置 地点 定位 地址", Map: "地图", Compass: "指南针 发现 探索", Locate: "定位 当前位置", LocateFixed: "已定位", Route: "路线 路径 行程",
      Car: "汽车 开车 出行", Bus: "公交 巴士", Train: "火车 地铁 高铁", Plane: "飞机 航班 旅行", Bike: "自行车 骑行", Anchor: "锚 港口 固定",
      Mountain: "山 户外 风景", TreePine: "树 森林 自然", Tent: "帐篷 露营",
    },
  },
  {
    id: "nature", zh: "天气与自然", en: "Weather",
    icons: {
      CloudRain: "下雨 雨天", CloudSnow: "下雪 雪天", CloudLightning: "雷雨 闪电", Wind: "风 刮风", Snowflake: "雪花 冷 冬天 冻结", Thermometer: "温度 体温 气温",
      Umbrella: "雨伞 保险 保护", Droplet: "水滴 液体 湿度", Leaf: "叶子 环保 自然", Sprout: "发芽 成长 新手", Waves: "波浪 水 海",
    },
  },
  {
    id: "dev", zh: "开发", en: "Developer",
    icons: {
      Code: "代码 开发 HTML", SquareCode: "代码块 嵌入", Terminal: "终端 命令行 shell", SquareTerminal: "终端 控制台", Braces: "花括号 JSON 对象", Brackets: "方括号 数组",
      Bug: "错误 bug 调试", Wrench: "扳手 工具 维修 修复", Hammer: "锤子 构建 build 工具", Magnet: "磁铁 吸附 吸引",
      GitBranch: "分支 git branch", GitCommit: "提交 commit", GitMerge: "合并 merge", GitPullRequest: "合并请求 PR", GitFork: "复刻 fork 分叉",
    },
  },
  {
    id: "misc", zh: "其他", en: "Other",
    icons: {
      Coffee: "咖啡 休息 赞助", PartyPopper: "庆祝 恭喜 派对",
    },
  },
];

/** 图标名 → 关键词字符串 */
export const ICON_KEYWORDS = Object.fromEntries(ICON_GROUPS.flatMap((g) => Object.entries(g.icons)));
/** 图标名 → 分类 id */
export const ICON_GROUP_OF = Object.fromEntries(ICON_GROUPS.flatMap((g) => Object.keys(g.icons).map((n) => [n, g.id])));
