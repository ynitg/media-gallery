// 动态加载瀑布流内容
async function loadContent(type = 'all') {
  const contentGrid = document.querySelector('.content-grid');
  contentGrid.innerHTML = ''; // 清空现有内容

  try {
    // 调用后端API
    const response = await fetch(`http://localhost:3001/content?type=${type}`);
    const { data } = await response.json();

    // 生成瀑布流内容
    data.forEach(item => {
      const contentItem = document.createElement('div');
      contentItem.className = 'content-item';
      contentItem.innerHTML = `
        <div class="item-container">
          ${item.type === 'image' 
            ? `<img src="${item.url}" alt="图片">` 
            : `<video controls><source src="${item.url}" type="video/mp4"></video>`}
        </div>
      `;
      contentGrid.appendChild(contentItem);
    });
  } catch (error) {
    console.error('加载内容失败:', error);
  }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 绑定按钮事件
  const buttons = document.querySelectorAll('.switch-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadContent(btn.dataset.type);
    });
  });

  // 加载初始内容
  loadContent();
});