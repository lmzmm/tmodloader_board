const ServerListView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-server"></i> 服务器列表</h2>
      <div id="serverListContainer">正在加载服务器列表...</div>
    </div>
  `,
  init: function() {
    const container = document.getElementById('serverListContainer');

    fetch('/manage/serverlist')
      .then(response => {
        if (!response.ok) {
          console.warn('无法连接到服务器，将使用模拟数据。');
          // 提供包含所有需要属性的模拟数据
          return [
            { sessionName: '我的生存服务器', players: 5, maxPlayers: 10, status: 'Running' },
            { sessionName: '创造模式乐园', players: 2, maxPlayers: 20, status: 'Running' }
          ];
        }
        return response.json();
      })
      .then(serverList => {
        if (serverList.length === 0) {
          container.innerHTML = '<p>当前没有正在运行的服务器。</p>';
          return;
        }
        let listHtml = '';
        serverList.forEach(server => {
          // 使用新的、美化后的HTML模板
          listHtml += `
            <div class="server-item">
              <div>
                <span class="status" title="运行中"></span>
                <span>${server.sessionName} (${server.players}/${server.maxPlayers})</span>
              </div>
              <div class="actions">
                <button class="btn-enter" data-session="${server.sessionName}"><i class="fas fa-sign-in-alt"></i> 进入管理</button>
                <button class="btn-stop" data-session="${server.sessionName}"><i class="fas fa-stop-circle"></i> 停止</button>
              </div>
            </div>
          `;
        });
        container.innerHTML = listHtml;

        container.addEventListener('click', (event) => {
          // 使用 .closest() 确保即使点击图标也能找到按钮
          const target = event.target.closest('button');
          if (!target) return;

          const sessionName = target.dataset.session;
          if (!sessionName) return;

          if (target.classList.contains('btn-enter')) {
            loadView(ServerControlView, { sessionName });
          } else if (target.classList.contains('btn-stop')) {
            if (confirm(`您确定要停止服务器 "${sessionName}" 吗？`)) {
              fetch(`/manage/stop?sessionName=${encodeURIComponent(sessionName)}`, {
                method: 'POST'
              })
              .then(res => {
                if (!res.ok) {
                  return res.text().then(text => { throw new Error(text || '操作失败'); });
                }
                return res.text();
              })
              .then(message => {
                alert(message);
                this.init(); // 重新加载列表
              })
              .catch(err => {
                alert(`停止失败: ${err.message}`);
              });
            }
          }
        });
      })
      .catch(err => {
        container.innerHTML = `<p style="color: red;">加载服务器列表失败: ${err.message}</p>`;
      });
  }
};