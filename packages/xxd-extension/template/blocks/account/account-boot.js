// 首帧前：登录状态（<html data-account>）。真正的来源是 chrome.storage.local，这里读镜像，不闪。
(function () {
  let state = "signed-out";
  try {
    // signed-in（试用中）和 member（会员）都是登录了
    const saved = localStorage.getItem("__SLUG__-account");
    state = saved === "signed-in" || saved === "member" ? "signed-in" : "signed-out";
  } catch {
    /* 存储被禁用：先当没登录 */
  }
  document.documentElement.dataset.account = state;
})();
