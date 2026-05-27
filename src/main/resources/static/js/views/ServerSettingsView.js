const ServerSettingsView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-cogs"></i> 服务器设置</h2>
      <p>请配置您的服务器参数。</p>
      <div class="form-group">
        <label for="maxPlayers"><i class="fas fa-users"></i> 最大玩家数</label>
        <input type="number" id="maxPlayers" value="8" min="1" max="255">
      </div>
      <div class="form-group">
        <label for="serverPort"><i class="fas fa-network-wired"></i> 服务器端口</label>
        <input type="number" id="serverPort" value="7777" min="1" max="65535">
      </div>
      <div class="form-group">
        <label for="serverPassword"><i class="fas fa-lock"></i> 服务器密码 (可选)</label>
        <input type="password" id="serverPassword" placeholder="留空则无密码">
      </div>
      <div class="actions-bar">
        <button id="createBtn" class="btn-primary" style="flex: 1; min-width: 200px;">
          <i class="fas fa-check"></i> 确认创建
        </button>
        <button id="backToStartBtn" class="btn-back" style="flex: 1; min-width: 200px; display: none;">
          <i class="fas fa-home"></i> 返回首页
        </button>
      </div>
      <div id="creationStatus" style="margin-top: 20px;"></div>
    </div>
  `,
  init: () => {
    const createBtn = document.getElementById('createBtn');
    const backToStartBtn = document.getElementById('backToStartBtn');
    const statusElement = document.getElementById('creationStatus');

    backToStartBtn.addEventListener('click', () => { loadView(InitialView); });

    createBtn.addEventListener('click', () => {
      serverConfig.maxPlayers = document.getElementById('maxPlayers').value;
      serverConfig.port = document.getElementById('serverPort').value;
      serverConfig.password = document.getElementById('serverPassword').value;

      createBtn.disabled = true;
      statusElement.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在创建服务器，请稍候...</p>';

      authFetch('/create/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverConfig)
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => { throw new Error(text || '服务器返回错误'); });
        }
        return res.text();
      })
      .then(text => {
        if (text.trim().toUpperCase() === 'OK') {
          statusElement.innerHTML = '<p class="status-success">服务器创建完成！</p>';
          createBtn.style.display = 'none';
          backToStartBtn.style.display = 'inline-flex';
        } else {
          throw new Error(`创建失败: ${text}`);
        }
      })
      .catch(err => {
        statusElement.innerHTML = `<p class="status-fail">创建失败: ${err.message}</p>`;
        createBtn.disabled = false;
      });
    });
  }
};