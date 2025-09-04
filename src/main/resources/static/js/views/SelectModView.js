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
            // ... (创建服务器的逻辑不变) ...
        } else if (currentWorkflow === 'createWorld') {
            worldCreatorConfig.mods = selectedMods; // 保存模组选择

            // --- 开始执行带等待反馈的初始化流程 ---

            // 1. 禁用按钮，防止重复点击
            submitBtn.disabled = true;

            // 2. 显示明确的等待信息
            statusEl.style.color = 'var(--text-secondary)';
            statusEl.innerHTML = `
                <i class="fas fa-cog fa-spin"></i> 
                正在初始化世界生成器... 这可能需要几十秒，请耐心等待。
            `;

            // 3. 调用后端，启动并等待进程就绪
            fetch('/create/startworldcreator', { method: 'POST' })
            .then(res => {
                if (!res.ok) {
                    // 如果服务器返回错误，则抛出异常
                    return res.text().then(text => { throw new Error(text || '启动世界生成器失败'); });
                }
                return res.text(); // "OK"
            })
            .then(text => {
                // 4. 后端确认就绪后，才进入下一步
                console.log("服务器已准备好接收配置:", text);

                // (可选) 显示一个短暂的成功提示
                statusEl.style.color = 'var(--success-color)';
                statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;

                setTimeout(() => {
                    loadView(SelectWorldSizeView);
                }, 500); // 延迟半秒跳转，让用户看到成功提示

            })
            .catch(err => {
                // 5. 捕获任何错误
                console.error("初始化世界生成器时出错:", err);
                statusEl.style.color = 'var(--danger-color)';
                statusEl.innerHTML = `❌ 初始化失败: ${err.message}`;

                // 重新启用按钮，以便用户可以重试
                submitBtn.disabled = false;
            });
        }
    });
      })
      .catch(err => { container.innerHTML = '加载模组列表失败: ' + err.message; });
  }
};