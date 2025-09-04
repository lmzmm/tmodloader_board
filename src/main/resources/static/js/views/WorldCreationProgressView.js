const WorldCreationProgressView = {
  html: `
    <div class="terraria-background">
        <div class="terraria-progress-wrapper" id="progress-wrapper">
            <!-- 进度条上方的文本 -->
            <div id="terraria-text-overlay" class="terraria-text-overlay">正在初始化...</div>

            <!-- 两个进度条的容器 -->
            <div class="terraria-bars-wrapper">
                <div class="terraria-bar-container">
                    <div id="terraria-overall-bar" class="terraria-bar-fill terraria-overall-fill"></div>
                </div>
                <div class="terraria-bar-container">
                    <div id="terraria-task-bar" class="terraria-bar-fill terraria-task-fill"></div>
                </div>
            </div>
            
            <!-- 新增：取消按钮 -->
            <button id="cancelCreationBtn" class="terraria-text-button">取消</button>
        </div>

        <!-- 新增：完成后的提示信息，默认隐藏 -->
        <div id="completion-message" class="terraria-completion-message" style="display: none;">
            <div id="completion-text"></div>
            <button id="backToListBtn" class="terraria-button">返回服务器列表</button>
        </div>
    </div>
  `,
  init: function() {
    const overallBar = document.getElementById('terraria-overall-bar');
    const taskBar = document.getElementById('terraria-task-bar');
    const progressText = document.getElementById('terraria-text-overlay');
    const progressWrapper = document.getElementById('progress-wrapper');
    const cancelBtn = document.getElementById('cancelCreationBtn');

    const completionMessage = document.getElementById('completion-message');
    const completionText = document.getElementById('completion-text');
    const backToListBtn = document.getElementById('backToListBtn');

    let previousTaskName = '';
    const eventSource = new EventSource('/create/worldprogress-stream');

    eventSource.onopen = () => console.log("成功连接到进度流服务器。");

    eventSource.onmessage = (event) => { /* ... (这部分逻辑保持不变) ... */ };

    // (为了简洁，onmessage 逻辑与上一版完全相同，此处省略)
    eventSource.onmessage = (event) => {
        const line = event.data;
        const match = line.match(/^(\d+\.?\d*)%\s*-\s*(.+?)(?:\s*-\s*(\d+\.?\d*)%)?$/);
        if (match) {
            const overallProgress = parseFloat(match[1]);
            const taskName = match[2].trim();
            const taskProgress = match[3] ? parseFloat(match[3]) : null;
            overallBar.style.width = overallProgress + '%';
            progressText.textContent = taskName;
            if (taskName !== previousTaskName) {
                taskBar.style.transition = 'none';
                taskBar.style.width = '0%';
                taskBar.offsetHeight;
                taskBar.style.transition = 'width 0.2s linear';
                previousTaskName = taskName;
            }
            if (taskProgress !== null) {
                taskBar.style.width = taskProgress + '%';
            }
        } else if (line) {
            progressText.textContent = line;
        }
    };


    // 监听 'complete' 事件
    eventSource.addEventListener('complete', (event) => {
        console.log("收到完成信号:", event.data);
        overallBar.style.width = '100%';
        taskBar.style.width = '100%';
        progressWrapper.style.display = 'none'; // 隐藏整个进度条区域

        completionText.innerHTML = `✅ 世界创建成功！<br>"${event.data}"`;
        completionMessage.style.display = 'flex'; // 显示完成信息
        eventSource.close();
    });

    // 监听错误事件
    eventSource.onerror = (err) => {
        console.error("EventSource 发生错误:", err);
        progressWrapper.style.display = 'none'; // 隐藏整个进度条区域

        completionText.innerHTML = `❌ 操作失败<br>连接已中断或发生错误。`;
        completionMessage.style.display = 'flex'; // 显示错误信息
        eventSource.close();
    };

    // 为“取消”按钮添加点击事件
    cancelBtn.addEventListener('click', () => {
        cancelBtn.disabled = true;
        cancelBtn.textContent = '正在取消...';

        fetch('/create/cancelworldcreation', { method: 'POST' })
            .then(res => {
                if(res.ok) {
                    console.log("成功发送取消请求。");
                    // 后端会处理进程并关闭 SSE，onerror 事件会被触发
                } else {
                    throw new Error('取消请求失败');
                }
            })
            .catch(err => {
                console.error(err);
                cancelBtn.disabled = false;
                cancelBtn.textContent = '取消';
            });
    });

    // 为“返回列表”按钮添加点击事件
    backToListBtn.addEventListener('click', () => {
        loadView(ServerListView);
    });
  }
};