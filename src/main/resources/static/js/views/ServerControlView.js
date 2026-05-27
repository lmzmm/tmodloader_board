const ServerControlView = {
  html: `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
      <h2 style="margin: 0;">
        <i class="fas fa-cogs"></i> 管理服务器:
        <span id="serverNameTitle" style="color: var(--gold-bright);"></span>
      </h2>
      <button id="backToServerListBtn" class="btn-back"><i class="fas fa-arrow-left"></i> 返回列表</button>
    </div>

    <div class="card">
      <h3><i class="fas fa-bullhorn"></i> 全服通报</h3>
      <div class="control-group" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <input type="text" id="broadcastMessage" placeholder="输入要发送的消息..." style="flex-grow: 1; min-width: 200px;">
        <button id="sendBroadcastBtn"><i class="fas fa-paper-plane"></i> 发送</button>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;"><i class="fas fa-users"></i> 在线玩家 (<span id="playerCount">0</span>)</h3>
        <button id="refreshPlayerListBtn" class="btn-back" style="padding:6px 14px; font-size:0.82rem;"><i class="fas fa-sync-alt"></i> 刷新</button>
      </div>
      <div id="playerListContainer"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在加载玩家列表...</p></div></div>
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
      playerListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在刷新玩家列表...</p></div>';
      authFetch(`/manage/playerlist?sessionName=${sessionName}`)
        .then(res => {
          if (!res.ok) return [];
          return res.json();
        })
        .then(players => {
          playerCount.textContent = players.length;
          if (players.length === 0) {
            playerListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-user"></i><p>当前没有在线玩家</p></div>';
            return;
          }
          let listHtml = '';
          players.forEach(playerFullName => {
            listHtml += `
              <div class="player-item">
                <span><i class="fas fa-user" style="margin-right: 10px; color: var(--gold-dim);"></i>${playerFullName}</span>
                <div class="actions">
                  <button class="btn-kick" data-player="${playerFullName}"><i class="fas fa-shoe-prints"></i> 踢出</button>
                  <button class="btn-ban" data-player="${playerFullName}"><i class="fas fa-gavel"></i> 封禁</button>
                </div>
              </div>
            `;
          });
          playerListContainer.innerHTML = listHtml;
        })
        .catch(err => {
          playerListContainer.innerHTML = `<p class="status-fail" style="text-align:center; padding:20px;">${err.message}</p>`;
        });
    };

    const handlePlayerAction = (action, playerName) => {
      if (!confirm(`确定要 ${action === 'kick' ? '踢出' : '封禁'} 玩家 "${playerName}" 吗？`)) return;
      statusElement.textContent = `正在发送 ${action} 指令...`;
      authFetch(`/manage/kickOrban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, playerName, action })
      })
      .then(res => res.text().then(text => { if (!res.ok) throw new Error(text); return text; }))
      .then(() => {
        statusElement.innerHTML = `<span class="status-success">指令执行成功</span>`;
        setTimeout(renderPlayerList, 1000);
      })
      .catch(err => {
        statusElement.innerHTML = `<span class="status-fail">指令失败: ${err.message}</span>`;
      });
    };

    backBtn.addEventListener('click', () => loadView(ServerListView));
    refreshPlayersBtn.addEventListener('click', renderPlayerList);

    playerListContainer.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      const player = target.dataset.player;
      if (!player) return;
      if (target.classList.contains('btn-kick')) { handlePlayerAction('kick', player); }
      else if (target.classList.contains('btn-ban')) { handlePlayerAction('ban', player); }
    });

    broadcastBtn.addEventListener('click', () => {
      const message = broadcastInput.value.trim();
      if (!message) { alert('消息不能为空！'); return; }
      statusElement.textContent = '正在发送通报...';
      authFetch('/manage/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, message })
      })
      .then(res => res.text().then(text => { if (!res.ok) throw new Error(text); return text; }))
      .then(() => {
        statusElement.innerHTML = `<span class="status-success">通报成功发送！</span>`;
        broadcastInput.value = '';
      })
      .catch(err => {
        statusElement.innerHTML = `<span class="status-fail">通报失败: ${err.message}</span>`;
      });
    });

    renderPlayerList();
  }
};