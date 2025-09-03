document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM元素选择 ---
    const contentArea = document.getElementById('contentArea');
    const btnCreateServer = document.getElementById('btnCreateServer');
    const btnCreateWorld = document.getElementById('btnCreateWorld');
    const btnList = document.getElementById('btnServerList');

    // --- 2. 全局状态管理 ---
    let serverConfig = {};      // 存储“创建服务器”流程的配置信息。
    let worldCreatorConfig = {};// 存储“创建世界”流程的配置信息。
    let currentWorkflow = '';   // 追踪当前的用户工作流程 ('createServer' 或 'createWorld')。

    // --- 3. 核心功能函数 ---

    /**
     * 动态加载一个视图到主内容区域。
     * @param {object} view - 视图对象，包含 .html 和 .init() 属性。
     * @param {object} [params={}] - (可选) 传递给视图 init 函数的参数。
     */
    const loadView = (view, params = {}) => {
        contentArea.innerHTML = view.html;
        if (typeof view.init === 'function') {
            // 使用 .bind(view) 确保 init 函数内部的 'this' 指向视图对象本身。
            view.init.bind(view)(params);
        }
    };

    /**
     * 在被选中的侧边栏按钮上设置 'active' 类。
     * @param {HTMLElement} selectedBtn - 被点击的按钮元素。
     */
    const setActive = (selectedBtn) => {
        [btnCreateServer, btnCreateWorld, btnList].forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    };

    /**
     * 辅助函数：向世界创建后端发送单步配置。
     * 发送纯文本格式的数据。
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
            const response = await fetch('/create/worldconfig', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain' // 关键：指定内容类型为纯文本
                },
                body: dataToSend // 关键：直接发送字符串，不进行 JSON 封装
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '服务器返回错误');
            }

            await response.text(); // 读取响应体，确保连接被正确处理
            console.log(`成功发送: '${dataToSend}'`);

            if (nextView) {
                loadView(nextView);
            } else {
                // 这是流程的最后一步
                statusElement.innerHTML = `<span class="status-success">✅ ${successMessage || '操作成功！'}</span>`;
                buttonElement.style.display = 'none'; // 完成后隐藏按钮
            }

        } catch (err) {
            statusElement.innerHTML = `<span class="status-fail">❌ 发送失败: ${err.message}</span>`;
            buttonElement.disabled = false; // 重新启用按钮，允许用户重试
        }
    }


    // --- 4. 导航栏事件监听 ---

    btnCreateServer.addEventListener('click', () => {
        setActive(btnCreateServer);
        currentWorkflow = 'createServer'; // 设置工作流上下文
        serverConfig = {}; // 重置服务器配置
        loadView(InitialView);
    });

    btnCreateWorld.addEventListener('click', () => {
        setActive(btnCreateWorld);
        currentWorkflow = 'createWorld'; // 设置工作流上下文
        worldCreatorConfig = {}; // 重置世界配置
        // “创建世界”流程从复用“选择模组”视图开始
        loadView(SelectModView);
    });

    btnList.addEventListener('click', () => {
        setActive(btnList);
        // 查看服务器列表不需要特定的工作流
        currentWorkflow = '';
        loadView(ServerListView);
    });


    // --- 5. 应用初始化 ---
    // 默认在“创建服务器”页面启动应用。
    setActive(btnCreateServer);
    currentWorkflow = 'createServer';
    loadView(InitialView);
});