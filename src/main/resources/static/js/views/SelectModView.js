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
          <div id="modDropZone" class="drop-zone"><i class="fas fa-cloud-upload-alt"></i><p>拖动文件到此处，或点击选择</p></div>
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
      dropZoneId: 'modDropZone', fileInputId: 'modFileInput', fileListId: 'modFileList',
      uploadBtnId: 'uploadAllModsBtn', showUploaderBtnId: 'showModUploaderBtn',
      uploaderAreaId: 'modUploadArea', uploadEndpoint: '/create/uploadmod',
      statusContainerId: 'modUploadStatus',
      onUploadComplete: this.renderModList
    });
  },
  renderModList: function() {
    const container = document.getElementById('modListContainer');
    const statusEl = document.getElementById('workflowStatus'); // 获取状态显示元素

    container.innerHTML = '正在刷新模组列表...';
    // 清空之前的状态信息
    if (statusEl) {
        statusEl.innerHTML = '';
    }

    fetch('/create/modlist')
      .then(response => {
        if (!response.ok) return ['高清修复', '小地图', '物品整理', '血量显示']; // Mock data
        return response.json();
      })
      .then(mods => {
        let listHtml = `
          <h3>可用模组</h3>
          <div class="item-list">
        `;
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `
          </div>
          <br>
          <button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>
          <button id="showModUploaderBtn" style="margin-left: 15px;"><i class="fas fa-upload"></i> 上传新模组</button>
        `;
        container.innerHTML = listHtml;

        const submitBtn = document.getElementById('submitModsBtn');
        const showUploaderBtn = document.getElementById('showModUploaderBtn');
        showUploaderBtn.addEventListener('click', () => {
            document.getElementById('modUploadArea').classList.toggle('visible');
        });

        submitBtn.addEventListener('click', () => {
          const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

          if (currentWorkflow === 'createServer') {
            serverConfig.mods = selectedMods;
            alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
            loadView(SelectWorldView);

          } else if (currentWorkflow === 'createWorld') {
            worldCreatorConfig.mods = selectedMods;

            // --- 开始执行带状态反馈的异步操作 ---

            // 1. 禁用按钮，防止重复点击
            submitBtn.disabled = true;
            showUploaderBtn.disabled = true; // 同时禁用上传按钮

            // 2. 显示初始状态信息，告知用户操作已开始
            statusEl.style.color = 'var(--text-secondary)';
            statusEl.innerHTML = `
              <i class="fas fa-spinner fa-spin"></i> 
              正在提交模组配置并启动世界生成器... 这可能需要一段时间，请耐心等待。
            `;

            console.log('正在启动世界创建流程，发送配置:', { mods: worldCreatorConfig.mods });

            fetch('/create/startworldcreator', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mods: worldCreatorConfig.mods })
            })
            .then(res => {
              if (!res.ok) {
                // 如果服务器返回错误，则抛出异常
                return res.text().then(text => { throw new Error(text || '启动世界创建流程失败'); });
              }
              return res.text();
            })
            .then(text => {
              // 3. 成功收到后端回复
              console.log('服务器响应:', text);

              // 更新状态信息为成功
              statusEl.style.color = 'var(--success-color)';
              statusEl.innerHTML = `✅ 世界生成器已成功启动！正在进入下一步...`;

              // 延迟一小段时间（例如1秒），让用户看到成功信息，然后跳转
              setTimeout(() => {
                loadView(SelectWorldSizeView);
              }, 1000);
            })
            .catch(err => {
              // 4. 捕获到任何错误（网络错误或服务器返回的错误）
              console.error("启动世界创建流程时出错:", err);

              // 更新状态信息为失败
              statusEl.style.color = 'var(--danger-color)';
              statusEl.innerHTML = `❌ 操作失败: ${err.message}`;

              // 重新启用按钮，以便用户可以修正问题后重试
              submitBtn.disabled = false;
              showUploaderBtn.disabled = false;
            });
          }
        });
      })
      .catch(err => { container.innerHTML = '加载模组列表失败: ' + err.message; });
  }
};