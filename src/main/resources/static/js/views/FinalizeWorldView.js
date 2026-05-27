const FinalizeWorldView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-seedling"></i> 最后一步: 输入地图种子 (5/5)</h2>
      <div class="form-group">
        <label for="mapSeed">地图种子 (可选)</label>
        <input type="text" id="mapSeed" placeholder="留空则为随机种子">
      </div>
      <button id="createWorldBtn" class="btn-primary"><i class="fas fa-check"></i> 确认并开始创建</button>
      <div id="stepStatus" class="step-status"></div>
    </div>
  `,
  init: () => {
    const createBtn = document.getElementById('createWorldBtn');
    const statusEl = document.getElementById('stepStatus');
    const seedInput = document.getElementById('mapSeed');

    createBtn.addEventListener('click', () => {
      const mapSeed = seedInput.value.trim();
      createBtn.disabled = true;
      statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在向服务器发送最终指令...';

      authFetch('/create/worldconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: mapSeed
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text) });
        }
        loadView(WorldCreationProgressView);
      })
      .catch(err => {
        statusEl.innerHTML = `<span class="status-fail">启动失败: ${err.message}</span>`;
        createBtn.disabled = false;
      });
    });
  }
};