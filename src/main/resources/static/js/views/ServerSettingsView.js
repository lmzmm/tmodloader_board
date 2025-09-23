const ServerSettingsView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-cogs"></i> 服务器设置</h2>
      <p>请配置您的服务器参数。</p>
      <div class="form-group">
        <label for="maxPlayers">
          <i class="fas fa-users"></i> 最大玩家数
        </label>
        <input type="number" id="maxPlayers" value="8" min="1" max="255">
      </div>
      <div class="form-group">
        <label for="serverPort">
          <i class="fas fa-network-wired"></i> 服务器端口
        </label>
        <input type="number" id="serverPort" value="7777" min="1" max="65535">
      </div>
      <div class="form-group">
        <label for="serverPassword">
          <i class="fas fa-lock"></i> 服务器密码 (可选)
        </label>
        <input type="password" id="serverPassword" placeholder="留空则无密码">
      </div>
      <div id="actionButtons" style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
        <button id="createBtn" style="flex: 1; min-width: 200px; padding: 15px;">
          <i class="fas fa-check"></i> 确认创建
        </button>
        <button id="backToStartBtn" style="flex: 1; min-width: 200px; padding: 15px; display: none;">
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

    backToStartBtn.addEventListener('click', () => {
      loadView(InitialView);
    });

    createBtn.addEventListener('click', () => {
      serverConfig.maxPlayers = document.getElementById('maxPlayers').value;
      serverConfig.port = document.getElementById('serverPort').value;
      serverConfig.password = document.getElementById('serverPassword').value;

      console.log('最终配置, 提交到 /create:', serverConfig);

      createBtn.disabled = true;
      statusElement.style.color = '#2c3e50';
      statusElement.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在创建服务器，请稍候...</p>';

      fetch('/create/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverConfig)
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(text || '服务器返回错误，但没有提供具体信息。');
          });
        }
        return res.text();
      })
      .then(text => {
        if (text.trim().toUpperCase() === 'OK') {
          statusElement.style.color = '#27ae60';
          statusElement.innerHTML = '<p style="padding: 15px; border-radius: 10px; background-color: rgba(42, 157, 143, 0.1);"><i class="fas fa-check-circle"></i> ✅ 服务器创建完成！</p>';
          createBtn.style.display = 'none';
          backToStartBtn.style.display = 'inline-block';
        } else {
          throw new Error(`创建失败: ${text}`);
        }
      })
      .catch(err => {
        statusElement.style.color = '#c0392b';
        statusElement.innerHTML = `<p style="padding: 15px; border-radius: 10px; background-color: rgba(230, 57, 70, 0.1);"><i class="fas fa-exclamation-circle"></i> ❌ 创建失败: ${err.message}</p>`;
        createBtn.disabled = false;
      });
    });
  }
};