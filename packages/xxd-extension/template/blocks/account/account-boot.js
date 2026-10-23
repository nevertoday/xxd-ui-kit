// 首帧前：登录状态（<html data-account>）。真正的来源是 chrome.storage.local，这里读镜像，不闪。
(function () {
  let state = "signed-out";
  try {
    state = localStorage.getItem("__SLUG__-account") === "signed-in" ? "signed-in" : "signed-out";
  } catch {
    /* 存储被禁用：先当没登录 */
  }
  document.documentElement.dataset.account = state;
})();
