const ServerSettingsView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-cogs"></i> 第三步: 服务器设置</h2>
      <div class="form-group"><label for="maxPlayers">最大玩家数</label><input type="number" id="maxPlayers" value="8"></div>
      <div class="form-group"><label for="serverPort">服务器端口</label><input type="number" id="serverPort" value="7777"></div>
      <div class="form-group"><label for="serverPassword">服务器密码 (可选)</label><input type="password" id="serverPassword" placeholder="留空则无密码"></div>
      <div id="actionButtons" style="margin-top: 20px;">
        <button id="createBtn"><i class="fas fa-check"></i> 确认创建</button>
        <button id="backToStartBtn" style="display: none;"><i class="fas fa-home"></i> 返回首页</button>
      </div>
      <div id="creationStatus" style="margin-top: 15px;"></div>
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
      statusElement.textContent = '正在创建服务器，请稍候...';

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
          statusElement.textContent = '✅ 服务器创建完成！';
          createBtn.style.display = 'none';
          backToStartBtn.style.display = 'inline-block';
        } else {
          throw new Error(`创建失败: ${text}`);
        }
      })
      .catch(err => {
        statusElement.style.color = '#c0392b';
        statusElement.textContent = `❌ 创建失败: ${err.message}`;
        createBtn.disabled = false;
      });
    });
  }
};