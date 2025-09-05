const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <!-- 【重要】所有动态内容，包括按钮，都在这个容器里 -->
          <div id="modListContainer">正在加载模-组-列表...</div>
        </div>
        <div id="modUploadArea" class="upload-area">
          <h3>上传模组文件</h3>
          <div id="modDropZone" class="drop-zone"><i class="fas fa-cloud-upload-alt"></i><p>拖动文件到此处，或点击选择</p></div>
          <input type="file" id="modFileInput" multiple style="display: none;">
          <h4>待上传列表：</h4>
          <div id="modFileList" class="file-list-container"></div>
          <div id="modUploadStatus"></div>
          <br><button id="uploadAllModsBtn">开始上传</button>
        </div>
      </div>
      <!-- 这个状态区域现在由事件委托统一管理 -->
      <div id="workflowStatus" class="step-status" style="margin-top: 20px;"></div>
    </div>`,

  /**
   * 初始化函数：只执行一次。
   * 负责初始渲染、设置Uploader和【最重要】绑定唯一的事件监听器。
   */
  init: function() {
    // 1. 初始加载模组列表
    this.renderModList();

    // 2. 设置Uploader，其完成回调仍然是 renderModList，用于刷新列表
    setupUploader({
      dropZoneId: 'modDropZone',
      fileInputId: 'modFileInput',
      fileListId: 'modFileList',
      uploadBtnId: 'uploadAllModsBtn',
      // 注意：showModUploaderBtn 的事件现在也由下面的委托处理
      showUploaderBtnId: 'showModUploaderBtn',
      uploaderAreaId: 'modUploadArea',
      uploadEndpoint: '/create/uploadmod',
      statusContainerId: 'modUploadStatus',
      // 使用 .bind(this) 确保 renderModList 在回调中执行时，'this' 仍然指向 SelectModView 对象
      onUploadComplete: this.renderModList.bind(this)
    });

    // 3. 【核心修复】使用事件委托
    // 将唯一的点击事件监听器绑定到不会被重绘的父容器上
    const container = document.getElementById('modListContainer');
    container.addEventListener('click', (event) => {

      const target = event.target; // 获取被点击的实际元素

      // --- 处理 "下一步" 按钮的点击 ---
      if (target.id === 'submitModsBtn') {
        const submitBtn = target;
        if (submitBtn.disabled) {
          console.warn("按钮已被禁用，点击被忽略。");
          return;
        }

        console.log("Submit button clicked via delegation! Timestamp:", Date.now());

        const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

        if (currentWorkflow === 'createServer') {
          serverConfig.mods = selectedMods;
          alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
          loadView(SelectWorldView);

        } else if (currentWorkflow === 'createWorld') {
          worldCreatorConfig.mods = selectedMods;
          const statusEl = document.getElementById('workflowStatus');

          submitBtn.disabled = true;
          statusEl.style.color = 'var(--text-secondary)';
          statusEl.innerHTML = `
            <i class="fas fa-cog fa-spin"></i> 
            正在初始化世界生成器... 这可能需要几十秒，请耐心等待。
          `;

          fetch('/create/startworldcreator', { method: 'POST' })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || '启动世界生成器失败'); });
              }
              return res.text();
            })
            .then(text => {
              console.log("服务器已准备好接收配置:", text);
              statusEl.style.color = 'var(--success-color)';
              statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;
              setTimeout(() => { loadView(SelectWorldSizeView); }, 500);
            })
            .catch(err => {
              console.error("初始化世界生成器时出错:", err);
              statusEl.style.color = 'var(--danger-color)';
              statusEl.innerHTML = `❌ 初始化失败: ${err.message}`;
              submitBtn.disabled = false; // 允许重试
            });
        }
      }

      // --- 处理 "上传新模组" 按钮的点击 ---
      // 注意：即使这个按钮在 uploader.js 中被引用，我们也可以在这里处理它的点击事件
      if (target.id === 'showModUploaderBtn') {
        document.getElementById('modUploadArea').classList.toggle('visible');
      }
    });
  },

  /**
   * 渲染函数：可能会被多次调用（初始加载、上传后刷新）。
   * 只负责生成HTML内容，【不】再绑定任何事件监听器。
   */
  renderModList: function() {
    const container = document.getElementById('modListContainer');
    const statusEl = document.getElementById('workflowStatus');

    container.innerHTML = '正在刷新模组列表...';
    if (statusEl) {
        statusEl.innerHTML = '';
    }

    fetch('/create/modlist')
      .then(response => {
        if (!response.ok) return ['高清修复', '小地图', '物品整理', '血量显示'];
        return response.json();
      })
      .then(mods => {
        let listHtml = `<h3>可用模组</h3><div class="item-list">`;
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `</div><br>
          <button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>
          <button id="showModUploaderBtn" style="margin-left: 15px;"><i class="fas fa-upload"></i> 上传新模组</button>`;

        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = '加载模组列表失败: ' + err.message;
      });
  }
};