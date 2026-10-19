// 自定义标签栏是一个组件：组件缺省样式隔离，App 的样式（@xxd/mini 的组件样式在 common.wxss 里）进不来，这里放开
export default { component: true, styleIsolation: "apply-shared" };
