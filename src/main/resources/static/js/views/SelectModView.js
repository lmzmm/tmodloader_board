const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <div id="modListContainer">正在加载模组列表...</div>
        </div>
        <div id="modUploadArea" class="upload-area">
          <h3>上传模组文件</h3>
          <div id="modDropZone" class="drop-zone">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>拖动文件到此处，或点击选择</p>
          </div>
          <input type="file" id="modFileInput" multiple style="display: none;">
          <h4>待上传列表：</h4>
          <div id="modFileList" class="file-list-container"></div>
          <div id="modUploadStatus"></div>
          <br><button id="uploadAllModsBtn">开始上传</button>
        </div>
      </div>
      <!-- 新增：用于显示流程状态的专用区域 -->
      <div id="workflowStatus" class="step-status" style="margin-top: 20px;"></div>
    </div>`,

  init: function() {
    this.renderModList();
    setupUploader({
      dropZoneId: 'modDropZone',
      fileInputId: 'modFileInput',
      fileListId: 'modFileList',
      uploadBtnId: 'uploadAllModsBtn',
      showUploaderBtnId: 'showModUploaderBtn',
      uploaderAreaId: 'modUploadArea',
      uploadEndpoint: '/create/uploadmod',
      statusContainerId: 'modUploadStatus',
      onUploadComplete: () => this.renderModList()
    });
  },

  renderModList: function() {
    const container = document.getElementById('modListContainer');
    const statusEl = document.getElementById('workflowStatus');

    container.innerHTML = '正在刷新模组列表...';
    if (statusEl) statusEl.innerHTML = '';

    fetch('/create/modlist')
      .then(response => response.ok ? response.json() : ['高清修复', '小地图', '物品整理', '血量显示'])
      .then(mods => {
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        let listHtml = `
          <h3>可用模组</h3>
          <div class="item-list">
        `;

        mods.forEach(mod => {
          const isChecked = currentConfig.mods?.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });

        listHtml += `
          </div>
          <br>
          <button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>
          <button id="showModUploaderBtn" style="margin-left: 15px;">
            <i class="fas fa-upload"></i> 上传新模组
          </button>
        `;
        container.innerHTML = listHtml;

        // ---- 确保只绑定一次事件 ----
        const submitBtn = document.getElementById('submitModsBtn');
        const showUploaderBtn = document.getElementById('showModUploaderBtn');

        submitBtn.onclick = () => this.handleSubmit(submitBtn, statusEl);
        showUploaderBtn.onclick = () => {
          document.getElementById('modUploadArea').classList.toggle('visible');
        };
      })
      .catch(err => {
        container.innerHTML = '加载模组列表失败: ' + err.message;
      });
  },

  handleSubmit: function(submitBtn, statusEl) {
    const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

    if (currentWorkflow === 'createWorld') {
      worldCreatorConfig.mods = selectedMods;

      // 禁用按钮
      submitBtn.disabled = true;

      // 显示等待信息
      statusEl.className = 'step-status loading';
      statusEl.innerHTML = `<i class="fas fa-cog fa-spin"></i> 正在初始化世界生成器，请稍候...`;

      fetch('/create/startworldcreator', { method: 'POST' })
        .then(res => res.ok ? res.text() : res.text().then(text => { throw new Error(text || '启动失败'); }))
        .then(() => {
          statusEl.className = 'step-status success';
          statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;

          setTimeout(() => loadView(SelectWorldSizeView), 800);
        })
        .catch(err => {
          statusEl.className = 'step-status error';
          statusEl.innerHTML = `❌ 初始化失败: ${err.message}`;
          submitBtn.disabled = false;
        });
    }
  }
};
