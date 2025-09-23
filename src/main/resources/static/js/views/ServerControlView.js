const ServerControlView = {
  html: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">
        <i class="fas fa-cogs"></i> 管理服务器: 
        <span id="serverNameTitle" style="color: var(--primary-color);"></span>
      </h2>
      <button id="backToServerListBtn" style="padding: 10px 20px;">
        <i class="fas fa-arrow-left"></i> 返回列表
      </button>
    </div>
    
    <div class="card">
        <h3><i class="fas fa-bullhorn"></i> 全服通报</h3>
        <div class="control-group" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <input type="text" id="broadcastMessage" placeholder="输入要发送的消息..." style="flex-grow: 1; min-width: 200px;">
          <button id="sendBroadcastBtn" style="padding: 12px 25px;">
            <i class="fas fa-paper-plane"></i> 发送
          </button>
        </div>
    </div>

    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">
            <i class="fas fa-users"></i> 在线玩家 
            (<span id="playerCount">0</span>)
          </h3>
          <button id="refreshPlayerListBtn" style="padding: 8px 15px; font-size: 0.9em;">
            <i class="fas fa-sync-alt"></i> 刷新
          </button>
        </div>
        <div id="playerListContainer"><p>正在加载玩家列表...</p></div>
    </div>

    <div id="controlPanelStatus" style="margin-bottom: 15px; min-height: 24px;"></div>
  `,
  init: function(params) {
    const { sessionName } = params;

    const title = document.getElementById('serverNameTitle');
    const playerCount = document.getElementById('playerCount');
    const playerListContainer = document.getElementById('playerListContainer');
    const backBtn = document.getElementById('backToServerListBtn');
    const broadcastInput = document.getElementById('broadcastMessage');
    const broadcastBtn = document.getElementById('sendBroadcastBtn');
    const statusElement = document.getElementById('controlPanelStatus');
    const refreshPlayersBtn = document.getElementById('refreshPlayerListBtn');

    title.textContent = sessionName;

    const renderPlayerList = () => {
      playerListContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在刷新玩家列表...</p>';
      fetch(`/manage/playerlist?sessionName=${sessionName}`)
        .then(res => {
          if (!res.ok) {
            console.warn('无法获取玩家列表，将使用模拟数据。');
            return ['PlayerOne_123', 'AnotherGamer', 'Steve', 'MinecraftFan99']; // 模拟数据
          }
          return res.json();
        })
        .then(players => {
          playerCount.textContent = players.length;
          if (players.length === 0) {
            playerListContainer.innerHTML = '<div style="text-align: center; padding: 20px;"><p>当前没有在线玩家。</p><i class="fas fa-user" style="font-size: 3em; color: #ced4da; margin-top: 15px;"></i></div>';
            return;
          }
          let listHtml = '';
          players.forEach(playerFullName => {
            // 使用新的、美化后的HTML模板
            listHtml += `
              <div class="player-item">
                <span>
                  <i class="fas fa-user" style="margin-right: 10px; color: var(--text-secondary);"></i>
                  ${playerFullName}
                </span>
                <div class="actions">
                  <button class="btn-kick" data-player="${playerFullName}" style="margin-right: 5px;">
                    <i class="fas fa-shoe-prints"></i> 踢出
                  </button>
                  <button class="btn-ban" data-player="${playerFullName}">
                    <i class="fas fa-gavel"></i> 封禁
                  </button>
                </div>
              </div>
            `;
          });
          playerListContainer.innerHTML = listHtml;
        })
        .catch(err => {
          playerListContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;"><i class="fas fa-exclamation-circle"></i> ${err.message}</p>`;
        });
    };

    const handlePlayerAction = (action, playerName) => {
      if (!confirm(`确定要 ${action === 'kick' ? '踢出' : '封禁'} 玩家 "${playerName}" 吗？`)) return;

      statusElement.textContent = `正在发送 ${action} 指令...`;
      fetch(`/manage/kickOrban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, playerName, action })
      })
      .then(res => res.text().then(text => { if (!res.ok) throw new Error(text); return text; }))
      .then(message => {
        statusElement.innerHTML = `<span class="status-success">✅ 指令成功: ${message}</span>`;
        setTimeout(renderPlayerList, 1000); // 延迟后刷新列表
      })
      .catch(err => {
        statusElement.innerHTML = `<span class="status-fail">❌ 指令失败: ${err.message}</span>`;
      });
    };

    backBtn.addEventListener('click', () => loadView(ServerListView));
    refreshPlayersBtn.addEventListener('click', renderPlayerList);

    playerListContainer.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      const player = target.dataset.player;
      if (!player) return;

      if (target.classList.contains('btn-kick')) {
        handlePlayerAction('kick', player);
      } else if (target.classList.contains('btn-ban')) {
        handlePlayerAction('ban', player);
      }
    });

    broadcastBtn.addEventListener('click', () => {
      const message = broadcastInput.value.trim();
      if (!message) {
        alert('消息不能为空！');
        return;
      }
      statusElement.textContent = '正在发送通报...';
      fetch('/manage/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, message })
      })
      .then(res => res.text().then(text => { if (!res.ok) throw new Error(text); return text; }))
      .then(text => {
        statusElement.innerHTML = `<span class="status-success">✅ 通报成功发送！</span>`;
        broadcastInput.value = '';
      })
      .catch(err => {
        statusElement.innerHTML = `<span class="status-fail">❌ 通报失败: ${err.message}</span>`;
      });
    });

    // 初始加载玩家列表
    renderPlayerList();
  }
};