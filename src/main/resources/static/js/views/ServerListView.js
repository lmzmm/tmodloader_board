const ServerListView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-server"></i> 服务器列表</h2>
      <p>以下是当前正在运行的服务器列表。</p>
      <div id="serverListContainer"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在加载服务器列表...</p></div></div>
      <div class="actions-bar">
        <button id="refreshServerListBtn" class="btn-back"><i class="fas fa-sync-alt"></i> 刷新列表</button>
        <button id="backToCreateBtn" class="btn-primary"><i class="fas fa-plus"></i> 创建新服务器</button>
      </div>
    </div>
  `,
  init: function() {
    const container = document.getElementById('serverListContainer');
    const refreshBtn = document.getElementById('refreshServerListBtn');
    const createBtn = document.getElementById('backToCreateBtn');

    const loadServerList = () => {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在加载服务器列表...</p></div>';

      authFetch('/manage/serverlist')
        .then(response => {
          if (!response.ok) return [];
          return response.json();
        })
        .then(serverList => {
          if (!serverList || serverList.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-server"></i><p>当前没有正在运行的服务器</p></div>';
            return;
          }
          let listHtml = '';
          serverList.forEach(serverName => {
            listHtml += `
              <div class="server-item">
                <div>
                  <span class="status" title="运行中"></span>
                  <span>${serverName}</span>
                </div>
                <div class="actions">
                  <button class="btn-enter" data-session="${serverName}">
                    <i class="fas fa-sign-in-alt"></i> 进入管理
                  </button>
                  <button class="btn-stop" data-session="${serverName}">
                    <i class="fas fa-stop-circle"></i> 停止
                  </button>
                </div>
              </div>
            `;
          });
          container.innerHTML = listHtml;
        })
        .catch(err => {
          container.innerHTML = `<p class="status-fail" style="text-align:center; padding:20px;"><i class="fas fa-exclamation-circle"></i> 加载失败: ${err.message}</p>`;
        });
    };

    loadServerList();

    refreshBtn.addEventListener('click', () => { loadServerList(); });
    createBtn.addEventListener('click', () => {
      serverConfig = {};
      currentWorkflow = 'createServer';
      loadView(InitialView);
    });

    container.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      const sessionName = target.dataset.session;
      if (!sessionName) return;

      if (target.classList.contains('btn-enter')) {
        loadView(ServerControlView, { sessionName });
      } else if (target.classList.contains('btn-stop')) {
        if (confirm(`确定要停止服务器 "${sessionName}" 吗？`)) {
          authFetch(`/manage/stop?sessionName=${encodeURIComponent(sessionName)}`, { method: 'POST' })
          .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text || '操作失败'); });
            return res.text();
          })
          .then(() => { loadServerList(); })
          .catch(err => { alert(`停止失败: ${err.message}`); });
        }
      }
    });
  }
};