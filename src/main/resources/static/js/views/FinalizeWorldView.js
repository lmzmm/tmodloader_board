const FinalizeWorldView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-seedling"></i> 最后一步: 输入地图种子 (5/5)</h2>
        <div class="form-group">
            <label for="mapSeed">地图种子 (可选)</label>
            <input type="text" id="mapSeed" placeholder="留空则为随机种子">
        </div>
        <button id="createWorldBtn"><i class="fas fa-check"></i> 确认并开始创建</button>
        <div id="stepStatus" class="step-status"></div>
    </div>
  `,
  init: () => {
    const createBtn = document.getElementById('createWorldBtn');
    const statusEl = document.getElementById('stepStatus');
    const seedInput = document.getElementById('mapSeed');

    createBtn.addEventListener('click', () => {
      const mapSeed = seedInput.value.trim();

      // 禁用按钮并显示加载状态
      createBtn.disabled = true;
      statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在向服务器发送最终指令...';

      // 假设 postCreatorStep 发送最终指令后，后端就会开始生成
      // 我们不需要等待 postCreatorStep 完成，而是立即跳转
      fetch('/create/worldconfig', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: mapSeed // 发送最后一个参数
      })
      .then(response => {
        if (!response.ok) {
            // 如果发送最终指令失败，则报错并停留在当前页面
            return response.text().then(text => { throw new Error(text) });
        }
        console.log("最终指令已发送，立即加载进度视图。");
        // 指令发送成功后，立即加载进度条视图
        loadView(WorldCreationProgressView);
      })
      .catch(err => {
        statusEl.innerHTML = `<span class="status-fail">❌ 启动失败: ${err.message}</span>`;
        createBtn.disabled = false; // 允许重试
      });
    });
  }
};