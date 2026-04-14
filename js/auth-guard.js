import { auth, onAuthStateChanged } from "./firebase-auth.js";

(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem('user_id', user.uid);
      return;
    }

    localStorage.removeItem('user_id');
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split("/").pop() || "main.html";
    const safeNext = encodeURIComponent(currentPage);
    window.location.replace(`login.html?next=${safeNext}`);
  });
})();
