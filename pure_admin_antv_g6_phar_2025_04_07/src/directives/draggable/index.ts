// directives/draggable.js
export const draggable = {
  mounted(el, binding) {
    console.log("ddddddd");

    const dialogHeader = el.querySelector(".el-dialog__header");
    const dialog = el.querySelector(".el-dialog");

    if (!dialogHeader || !dialog) {
      console.warn(
        "v-draggable directive requires an element with .el-dialog__header and .el-dialog"
      );
      return;
    }

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseDown = e => {
      console.log("ddddd");

      isDragging = true;
      offsetX = e.clientX - dialog.offsetLeft;
      offsetY = e.clientY - dialog.offsetTop;
    };

    const onMouseMove = e => {
      if (isDragging) {
        dialog.style.left = `${e.clientX - offsetX}px`;
        dialog.style.top = `${e.clientY - offsetY}px`;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    dialogHeader.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // 清理事件监听器
    el._onMouseDown = onMouseDown;
    el._onMouseMove = onMouseMove;
    el._onMouseUp = onMouseUp;
  },
  unmounted(el) {
    const dialogHeader = el.querySelector(".el-dialog__header");
    if (dialogHeader) {
      dialogHeader.removeEventListener("mousedown", el._onMouseDown);
    }
    document.removeEventListener("mousemove", el._onMouseMove);
    document.removeEventListener("mouseup", el._onMouseUp);
  }
};
