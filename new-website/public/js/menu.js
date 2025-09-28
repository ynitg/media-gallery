// 菜单展开/收起功能
function toggleMenu(menuId) {
    const submenu = document.getElementById(menuId + '-submenu');
    const arrow = document.getElementById(menuId + '-arrow');
    
    if (submenu.style.display === 'none') {
        submenu.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        submenu.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// 页面加载完成后初始化菜单状态
document.addEventListener('DOMContentLoaded', function() {
    // 可以根据当前页面自动展开相关菜单
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('ip-management')) {
        // 自动展开资源管理和IP管理菜单
        const resourceSubmenu = document.getElementById('resource-submenu');
        const ipSubmenu = document.getElementById('ip-submenu');
        const resourceArrow = document.getElementById('resource-arrow');
        const ipArrow = document.getElementById('ip-arrow');
        
        if (resourceSubmenu) {
            resourceSubmenu.style.display = 'block';
            resourceArrow.style.transform = 'rotate(180deg)';
        }
        
        if (ipSubmenu) {
            ipSubmenu.style.display = 'block';
            ipArrow.style.transform = 'rotate(180deg)';
        }
    }
});


