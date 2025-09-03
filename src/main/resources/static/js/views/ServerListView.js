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
          // 更新模拟数据以匹配新的字符串数组格式
          return ["tmodloader-20250715", "我的测试服务器"];
        }
        // 解析服务器返回的 JSON 数组
        return response.json();
      })
      .then(serverList => {
        if (!serverList || serverList.length === 0) {
          container.innerHTML = '<p>当前没有正在运行的服务器。</p>';
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
                <button class="btn-enter" data-session="${serverName}"><i class="fas fa-sign-in-alt"></i> 进入管理</button>
                <button class="btn-stop" data-session="${serverName}"><i class="fas fa-stop-circle"></i> 停止</button>
              </div>
            </div>
          `;
        });

        container.innerHTML = listHtml;

        // 事件监听器部分保持不变，它能正常工作
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