// @xxd/mini 的 Taro 插件：在 config/index.ts 的 plugins 里写 "@xxd/mini/taro-plugin"。
//   1. 读屏属性：Taro 4.2 编微信小程序时，view / text / button 等组件的模板里没有 aria-* 属性，写了也会被丢掉。
//      这里把微信支持的那几个（../aria.json）登记给这些组件，模板里才会带上；
//      再定义一个常量 __XXD_MINI_ARIA__，@xxd/mini 运行时看到它才登记同样的属性（两边一致，Taro 的属性编号才对得上）。
//   2. 提醒 px 不换算：@xxd/mini 的尺寸和网页版是同一组数字（docs/maintainers/MINIPROGRAM-PLAN.md §13 第 2 条）。
const { attributes, components } = require("../aria.json");

const MINI = new Set(["weapp", "qq", "tt", "alipay", "swan", "jd"]);

module.exports = (ctx) => {
  const platform = process.env.TARO_ENV;
  const mini = MINI.has(platform);
  if (mini) {
    // 端平台插件用 @tarojs/shared/dist/template 里那一份组件表生成模板；@tarojs/shared 主入口另有一份。两份都登记
    const tables = [];
    for (const id of ["@tarojs/shared/dist/template", "@tarojs/shared"]) {
      try {
        tables.push(require(require.resolve(id, { paths: [ctx.paths.appPath] })).internalComponents);
      } catch {
        /* 这个版本没有这个入口 */
      }
    }
    if (!tables.some((t) => t && t.View)) console.warn("[@xxd/mini] 认不出这个版本的 Taro，读屏属性没有登记");
    for (const internal of tables) {
      if (!internal || !internal.View) continue;
      for (const name of components) {
        if (!internal[name]) continue;
        for (const attr of attributes) if (!(attr in internal[name])) internal[name][attr] = "";
      }
    }
  }
  ctx.modifyRunnerOpts(({ opts }) => {
    if (!opts) return;
    opts.defineConstants = { ...(opts.defineConstants || {}), __XXD_MINI_ARIA__: JSON.stringify(mini) };
    const px = opts.mini && opts.mini.postcss && opts.mini.postcss.pxtransform;
    if (mini && px && px.enable !== false) console.warn("[@xxd/mini] mini.postcss.pxtransform 没关：你自己写的 px 会被换成 rpx（@xxd/mini 自己的样式不受影响）");
  });
};
