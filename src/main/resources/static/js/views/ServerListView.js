const ServerListView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-server"></i> 服务器列表</h2>
      <p>以下是当前正在运行的服务器列表。</p>
      <div id="serverListContainer">正在加载服务器列表...</div>
      <div style="margin-top: 20px; display: flex; gap: 15px;">
        <button id="refreshServerListBtn">
          <i class="fas fa-sync-alt"></i> 刷新列表
        </button>
        <button id="backToCreateBtn">
          <i class="fas fa-plus"></i> 创建新服务器
        </button>
      </div>
    </div>
  `,
  init: function() {
    const container = document.getElementById('serverListContainer');
    const refreshBtn = document.getElementById('refreshServerListBtn');
    const createBtn = document.getElementById('backToCreateBtn');

    const loadServerList = () => {
      container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在加载服务器列表...</p>';

      fetch('/manage/serverlist')
        .then(response => {
          if (!response.ok) {
            console.warn('无法连接到服务器，将使用模拟数据。');
            // 更新模拟数据以匹配新的字符串数组格式
            return ["tmodloader-20250715", "我的测试服务器"];
          }
          // 解析服务器返回的 JSON 数组
          return response.json();
        })
        .then(serverList => {
          if (!serverList || serverList.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 30px;"><p>当前没有正在运行的服务器。</p><i class="fas fa-server" style="font-size: 3em; color: #ced4da; margin-top: 20px;"></i></div>';
            return;
          }

          let listHtml = '';
          // *** 关键修改在这里 ***
          // 我们现在遍历的是一个字符串数组，所以循环变量 `serverName` 就是服务器名称本身。
          serverList.forEach(serverName => {
            // 生成列表项的 HTML，直接使用 serverName
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
          container.innerHTML = `<p style="color: red; text-align: center; padding: 20px;"><i class="fas fa-exclamation-circle"></i> 加载服务器列表失败: ${err.message}</p>`;
        });
    };

    // 初始加载
    loadServerList();

    // 刷新按钮事件
    refreshBtn.addEventListener('click', () => {
      loadServerList();
    });

    // 创建新服务器按钮事件
    createBtn.addEventListener('click', () => {
      loadView(InitialView);
    });

    // 事件委托处理服务器操作按钮
    container.addEventListener('click', (event) => {
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
            loadServerList(); // 重新加载列表
          })
          .catch(err => {
            alert(`停止失败: ${err.message}`);
          });
        }
      }
    });
  }
};