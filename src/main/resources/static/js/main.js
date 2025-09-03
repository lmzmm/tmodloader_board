let serverConfig = {};      // 存储“创建服务器”流程的配置信息。
let worldCreatorConfig = {};// 存储“创建世界”流程的配置信息。
let currentWorkflow = '';   // 追踪当前的用户工作流程 ('createServer' 或 'createWorld')。

/**
 * 动态加载一个视图到主内容区域。
 * @param {object} view - 视图对象，包含 .html 和 .init() 属性。
 * @param {object} [params={}] - (可选) 传递给视图 init 函数的参数。
 */
function loadView(view, params = {}) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = view.html;
    if (typeof view.init === 'function') {
        view.init.bind(view)(params);
    }
}

/**
 * 辅助函数：向世界创建后端发送单步配置（纯文本）。
 * @param {string} dataToSend - 要发送的字符串 (例如 "1", "我的世界")。
 * @param {object | null} nextView - 成功后要加载的下一个视图。如果为 null，则表示这是最后一步。
 * @param {HTMLElement} buttonElement - 被点击的按钮元素。
 * @param {HTMLElement} statusElement - 用于显示状态消息的元素。
 * @param {string} [successMessage] - (可选) 在最后一步显示的成功消息。
 */
async function postCreatorStep(dataToSend, nextView, buttonElement, statusElement, successMessage) {
    buttonElement.disabled = true;
    statusElement.style.color = 'var(--text-secondary)';
    statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在发送配置...';

    try {
        const response = await fetch('/create/worldonfig', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: dataToSend
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '服务器返回错误');
        }

        await response.text();
        console.log(`成功发送: '${dataToSend}'`);

        if (nextView) {
            loadView(nextView);
        } else {
            statusElement.innerHTML = `<span class="status-success">✅ ${successMessage || '操作成功！'}</span>`;
            buttonElement.style.display = 'none';
        }

    } catch (err) {
        statusElement.innerHTML = `<span class="status-fail">❌ 发送失败: ${err.message}</span>`;
        buttonElement.disabled = false;
    }
}


// --- 2. 应用启动逻辑 ---
// 这部分代码需要等待DOM加载完成后执行。

document.addEventListener('DOMContentLoaded', () => {

    // DOM元素选择
    const btnCreateServer = document.getElementById('btnCreateServer');
    const btnCreateWorld = document.getElementById('btnCreateWorld');
    const btnList = document.getElementById('btnServerList');

    /**
     * 在被选中的侧边栏按钮上设置 'active' 类。
     */
    const setActive = (selectedBtn) => {
        [btnCreateServer, btnCreateWorld, btnList].forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    };

    // 导航栏事件监听
    btnCreateServer.addEventListener('click', () => {
        setActive(btnCreateServer);
        currentWorkflow = 'createServer';
        serverConfig = {};
        loadView(InitialView);
    });

    btnCreateWorld.addEventListener('click', () => {
        setActive(btnCreateWorld);
        currentWorkflow = 'createWorld';
        worldCreatorConfig = {};
        loadView(SelectModView);
    });

    btnList.addEventListener('click', () => {
        setActive(btnList);
        currentWorkflow = '';
        loadView(ServerListView);
    });

    // 应用初始化
    setActive(btnCreateServer);
    currentWorkflow = 'createServer';
    loadView(InitialView);
});