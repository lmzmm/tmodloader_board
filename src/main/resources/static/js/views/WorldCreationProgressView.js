const WorldCreationProgressView = {
  html: `
    <div class="terraria-background">
        <div class="terraria-progress-wrapper">
            <!-- 进度条上方的文本 -->
            <div id="terraria-text-overlay" class="terraria-text-overlay">正在初始化...</div>

            <!-- 两个进度条的容器 -->
            <div class="terraria-bars-wrapper">
                <!-- 总进度条 (顶部) -->
                <div class="terraria-bar-container">
                    <div id="terraria-overall-bar" class="terraria-bar-fill terraria-overall-fill"></div>
                </div>
                <!-- 当前任务进度条 (底部) -->
                <div class="terraria-bar-container">
                    <div id="terraria-task-bar" class="terraria-bar-fill terraria-task-fill"></div>
                </div>
            </div>
        </div>

        <!-- 完成后的状态显示 -->
        <div id="finalStatus" class="step-status terraria-final-status"></div>
    </div>
  `,
  init: function() {
    const overallBar = document.getElementById('terraria-overall-bar');
    const taskBar = document.getElementById('terraria-task-bar');
    const progressText = document.getElementById('terraria-text-overlay');
    const finalStatus = document.getElementById('finalStatus');

    // 追踪上一个任务名称，用于在新任务开始时重置任务进度条
    let previousTaskName = '';

    const eventSource = new EventSource('/create/worldprogress-stream');

    eventSource.onopen = () => {
        console.log("成功连接到进度流服务器。");
    };

    eventSource.onmessage = (event) => {
        const line = event.data;

        // 升级版正则表达式，可以捕获总进度(1)、任务名(2)和可选的任务进度(3)
        // 示例: "1.1% - Putting dirt behind dirt - 0.3%"
        const match = line.match(/^(\d+\.?\d*)%\s*-\s*(.+?)(?:\s*-\s*(\d+\.?\d*)%)?$/);

        if (match) {
            const overallProgress = parseFloat(match[1]);
            const taskName = match[2].trim();
            // 如果捕获组3存在，则解析任务进度，否则为null
            const taskProgress = match[3] ? parseFloat(match[3]) : null;

            // 更新总进度条和文本
            overallBar.style.width = overallProgress + '%';
            progressText.textContent = taskName;

            // 检查是否是新任务
            if (taskName !== previousTaskName) {
                // 是新任务，重置任务进度条
                taskBar.style.transition = 'none'; // 立即重置，避免动画
                taskBar.style.width = '0%';
                // 强制浏览器重新渲染
                taskBar.offsetHeight;
                taskBar.style.transition = 'width 0.2s linear'; // 重新启用动画
                previousTaskName = taskName;
            }

            // 如果当前任务有自己的进度，则更新任务进度条
            if (taskProgress !== null) {
                taskBar.style.width = taskProgress + '%';
            }

        } else if (line) {
            // 如果日志不含百分比 (例如 "正在生成丛林")，只更新文本
            progressText.textContent = line;
        }
    };

    eventSource.addEventListener('complete', (event) => {
        console.log("收到完成信号:", event.data);
        overallBar.style.width = '100%';
        taskBar.style.width = '100%';
        progressText.textContent = "创建完成！";
        finalStatus.innerHTML = `✅ ${event.data}`;
        eventSource.close();
    });

    eventSource.onerror = (err) => {
        console.error("EventSource 发生错误:", err);
        progressText.textContent = "错误！";
        finalStatus.innerHTML = `❌ 连接中断或发生错误。`;
        eventSource.close();
    };
  }
};