/** 念给读屏听（常驻的 live region）：assertive 立刻打断，缺省 polite 排队；within 是在哪个根里念（Shadow 里传里面的元素）。 */
export function announce(message: unknown, options?: { assertive?: boolean; within?: Node | null }): void;
/** install 时先把播报区建好。 */
export function installAnnouncer(root: Document | ShadowRoot | Element): void;
