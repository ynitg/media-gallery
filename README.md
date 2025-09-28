# Disk Treemap (Windows/Linux/macOS)

A small Python GUI that scans a selected folder/drive and visualizes space usage with a treemap.

## Features
- Choose any folder/drive to scan
- Progress updates during scanning
- Treemap visualization with sizes
- Cancel scan at any time

## Requirements
- Python 3.9+
- pip

## Install
```bash
pip install -r requirements.txt
```

## Run
```bash
python disk_treemap.py
```
- Click "浏览..." to pick a folder or drive (e.g., C:\\, D:\\)
- Click "开始扫描" to start
- Treemap appears after scan completes; large files/folders show larger blocks

## Notes
- Some folders may be inaccessible; they are skipped silently
- Symlinks are not followed
- Treemap shows immediate children of the selected root; deep sizes are aggregated up to their parent folder

## Troubleshooting
- If you see no blocks: the directory might be empty or access denied
- If the UI freezes: close and relaunch; very large folders may take time
- For best performance, scan specific folders rather than entire system drive


