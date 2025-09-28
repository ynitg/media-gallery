import os
import sys
import threading
import queue
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

# GUI
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Plotting
import matplotlib
matplotlib.use("Agg")  # Switch to non-interactive backend; we'll embed via TkAgg canvas
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import squarify


@dataclass
class NodeSize:
    path: str
    size: int


def format_bytes(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(num_bytes)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.2f} {unit}"
        size /= 1024


def safe_stat(path: str) -> Optional[os.stat_result]:
    try:
        return os.stat(path, follow_symlinks=False)
    except Exception:
        return None


def iter_dir(path: str):
    try:
        with os.scandir(path) as it:
            for entry in it:
                yield entry
    except Exception:
        return


def compute_directory_sizes(root_path: str, cancel_event: threading.Event,
                            progress: "ProgressTracker") -> List[NodeSize]:
    total_sizes: Dict[str, int] = {}
    dir_stack: List[str] = [root_path]

    while dir_stack and not cancel_event.is_set():
        current = dir_stack.pop()
        subtotal = 0
        for entry in iter_dir(current):
            if cancel_event.is_set():
                break
            if entry.is_symlink():
                continue
            try:
                if entry.is_file(follow_symlinks=False):
                    st = entry.stat(follow_symlinks=False)
                    size = int(st.st_size)
                    subtotal += size
                    progress.add_file(size)
                elif entry.is_dir(follow_symlinks=False):
                    dir_stack.append(entry.path)
            except Exception:
                continue
        total_sizes[current] = total_sizes.get(current, 0) + subtotal

    if cancel_event.is_set():
        return []

    # Aggregate folder sizes: ensure parent directories include child folder sizes
    items: List[Tuple[str, int]] = sorted(total_sizes.items(), key=lambda x: len(x[0]), reverse=True)
    aggregated: Dict[str, int] = dict(items)
    for path, size in items:
        parent = os.path.dirname(path.rstrip(os.sep))
        if parent and parent.startswith(root_path):
            aggregated[parent] = aggregated.get(parent, 0) + size

    # Build leaf-level file/folder contributions by listing direct children of root
    children: List[NodeSize] = []
    for entry in iter_dir(root_path):
        if cancel_event.is_set():
            return []
        try:
            if entry.is_file(follow_symlinks=False):
                st = entry.stat(follow_symlinks=False)
                children.append(NodeSize(entry.path, int(st.st_size)))
            elif entry.is_dir(follow_symlinks=False):
                size = aggregated.get(entry.path, 0)
                children.append(NodeSize(entry.path, size))
        except Exception:
            continue

    return children


class ProgressTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self.bytes_seen = 0
        self.files_seen = 0
        self.start_time = time.time()

    def add_file(self, file_size: int) -> None:
        with self._lock:
            self.bytes_seen += file_size
            self.files_seen += 1

    def snapshot(self) -> Tuple[int, int, float]:
        with self._lock:
            elapsed = max(0.001, time.time() - self.start_time)
            return self.bytes_seen, self.files_seen, elapsed


class DiskTreemapApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Disk Space Treemap")
        self.geometry("1000x700")

        self.selected_path = tk.StringVar()
        self.status_var = tk.StringVar(value="请选择一个文件夹进行扫描")
        self.cancel_event = threading.Event()
        self.worker_thread: Optional[threading.Thread] = None
        self.progress = ProgressTracker()
        self.result_queue: "queue.Queue[List[NodeSize]]" = queue.Queue()

        self._build_ui()
        self._poll_worker()

    def _build_ui(self) -> None:
        top = ttk.Frame(self)
        top.pack(fill=tk.X, padx=10, pady=10)

        path_entry = ttk.Entry(top, textvariable=self.selected_path)
        path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)

        ttk.Button(top, text="浏览...", command=self._choose_folder).pack(side=tk.LEFT, padx=5)
        self.scan_btn = ttk.Button(top, text="开始扫描", command=self._start_scan)
        self.scan_btn.pack(side=tk.LEFT, padx=5)
        self.cancel_btn = ttk.Button(top, text="取消", command=self._cancel_scan, state=tk.DISABLED)
        self.cancel_btn.pack(side=tk.LEFT)

        self.status_lbl = ttk.Label(self, textvariable=self.status_var)
        self.status_lbl.pack(fill=tk.X, padx=10)

        # Matplotlib Figure embedded in Tk
        self.figure = plt.Figure(figsize=(10, 6), dpi=100)
        self.ax = self.figure.add_subplot(111)
        self.ax.axis('off')
        container = ttk.Frame(self)
        container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.canvas = FigureCanvasTkAgg(self.figure, master=container)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    def _choose_folder(self) -> None:
        path = filedialog.askdirectory()
        if path:
            self.selected_path.set(path)

    def _start_scan(self) -> None:
        path = self.selected_path.get().strip()
        if not path:
            messagebox.showwarning("提示", "请先选择一个文件夹")
            return
        if not os.path.isdir(path):
            messagebox.showerror("错误", "无效的文件夹路径")
            return

        if self.worker_thread and self.worker_thread.is_alive():
            messagebox.showinfo("提示", "扫描正在进行中")
            return

        self.cancel_event.clear()
        self.progress = ProgressTracker()
        self.status_var.set("正在扫描...")
        self.scan_btn.config(state=tk.DISABLED)
        self.cancel_btn.config(state=tk.NORMAL)
        self.ax.clear()
        self.ax.axis('off')
        self.canvas.draw_idle()

        def worker():
            try:
                result = compute_directory_sizes(path, self.cancel_event, self.progress)
                self.result_queue.put(result)
            except Exception as exc:
                self.result_queue.put(exc)

        self.worker_thread = threading.Thread(target=worker, daemon=True)
        self.worker_thread.start()

    def _cancel_scan(self) -> None:
        if self.worker_thread and self.worker_thread.is_alive():
            self.cancel_event.set()
            self.status_var.set("取消中...")

    def _poll_worker(self) -> None:
        try:
            item = self.result_queue.get_nowait()
        except queue.Empty:
            item = None

        if item is not None:
            self.scan_btn.config(state=tk.NORMAL)
            self.cancel_btn.config(state=tk.DISABLED)
            if isinstance(item, Exception):
                self.status_var.set(f"扫描失败: {item}")
            elif self.cancel_event.is_set():
                self.status_var.set("已取消")
            else:
                children: List[NodeSize] = item
                self._render_treemap(self.selected_path.get(), children)
        else:
            if self.worker_thread and self.worker_thread.is_alive():
                bytes_seen, files_seen, elapsed = self.progress.snapshot()
                rate = bytes_seen / elapsed
                self.status_var.set(
                    f"扫描中: {files_seen} 个文件, {format_bytes(bytes_seen)} 已计数, 速度 {format_bytes(int(rate))}/s"
                )

        self.after(200, self._poll_worker)

    def _render_treemap(self, root_path: str, nodes: List[NodeSize]) -> None:
        # Filter zero sizes and sort
        filtered = [n for n in nodes if n.size > 0]
        if not filtered:
            self.status_var.set("没有可显示的数据（可能是空目录或权限受限）")
            return

        filtered.sort(key=lambda n: n.size, reverse=True)

        # Limit to top N and group the rest as "Other"
        max_items = 60
        top = filtered[:max_items]
        others = filtered[max_items:]
        if others:
            other_sum = sum(n.size for n in others)
            top.append(NodeSize(path=os.path.join(root_path, "(Other)"), size=other_sum))

        sizes = [n.size for n in top]
        labels = [os.path.basename(n.path) or n.path for n in top]
        human = [format_bytes(s) for s in sizes]

        self.ax.clear()
        self.ax.axis('off')

        # Normalize sizes to area and plot
        normed = squarify.normalize_sizes(sizes, 100, 100)
        rects = squarify.squarify(normed, 0, 0, 100, 100)

        colors = plt.cm.tab20.colors
        for idx, r in enumerate(rects):
            color = colors[idx % len(colors)]
            self.ax.add_patch(plt.Rectangle((r['x'], r['y']), r['dx'], r['dy'], color=color, alpha=0.8))
            label = f"{labels[idx]}\n{human[idx]}"
            cx = r['x'] + r['dx'] / 2
            cy = r['y'] + r['dy'] / 2
            # Only draw text if rectangle big enough
            if r['dx'] > 5 and r['dy'] > 5:
                self.ax.text(cx, cy, label, va='center', ha='center', fontsize=8, color='white', wrap=True)

        self.ax.set_xlim(0, 100)
        self.ax.set_ylim(0, 100)
        self.ax.invert_yaxis()
        self.ax.set_title(f"空间占用 - {root_path}")
        self.canvas.draw_idle()
        total = sum(sizes)
        self.status_var.set(f"完成: 总计 {format_bytes(total)}，项目数 {len(nodes)}")


def main() -> None:
    app = DiskTreemapApp()
    app.mainloop()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)



