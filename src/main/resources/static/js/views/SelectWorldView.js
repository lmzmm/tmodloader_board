const SelectWorldView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-globe-americas"></i> 选择世界</h2>
      <p>请选择一个现有的世界或上传新的世界文件。</p>

      <div class="content-wrapper">
        <div class="selection-area">
          <div id="worldListContainer" class="scroll-list">
            <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在加载世界列表...</p></div>
          </div>
        </div>

        <div style="margin-bottom: 20px; width: 100%;">
            <div class="actions-bar" style="margin-top:0;">
                <button id="showWorldUploaderBtn" class="btn-back"><i class="fas fa-upload"></i> 上传新世界</button>
                <button id="refreshWorldListBtn" class="btn-back"><i class="fas fa-sync-alt"></i> 刷新</button>
            </div>

            <div id="worldUploadArea" class="upload-area" style="display: none; margin-top: 14px;">
              <h3><i class="fas fa-cloud-upload-alt"></i> 上传 .wld 文件</h3>
              <div id="worldDropZone" class="drop-zone">
                <i class="fas fa-file-import"></i>
                <p style="font-size:0.9em; color:var(--cream-dim);">点击或拖拽文件</p>
              </div>
              <input type="file" id="worldFileInput" multiple style="display: none;">
              <div id="worldFileList" class="file-list-container" style="margin-top:10px;"></div>
              <div id="worldUploadStatus" style="font-size:0.85em; margin-top:4px;"></div>
              <button id="uploadAllWorldsBtn" class="btn-primary" style="width: 100%; margin-top: 10px;">
                <i class="fas fa-arrow-up"></i> 开始上传
              </button>
            </div>
        </div>

        <button id="submitWorldBtn" class="btn-primary" style="width: 100%;">
          <i class="fas fa-arrow-right"></i> 下一步
        </button>
      </div>
    </div>`,

  init: function() {
    this.renderWorldList();

    setupUploader({
      dropZoneId: 'worldDropZone',
      fileInputId: 'worldFileInput',
      fileListId: 'worldFileList',
      uploadBtnId: 'uploadAllWorldsBtn',
      showUploaderBtnId: 'showWorldUploaderBtn',
      uploaderAreaId: 'worldUploadArea',
      uploadEndpoint: '/resource/uploadworld',
      statusContainerId: 'worldUploadStatus',
      onUploadComplete: () => { this.renderWorldList(); }
    });

    document.getElementById('refreshWorldListBtn').addEventListener('click', () => this.renderWorldList());

    document.getElementById('submitWorldBtn').addEventListener('click', () => {
      const selected = document.querySelector('input[name="world"]:checked');
      if (!selected) { alert('请先选择一个世界！'); return; }
      serverConfig.world = selected.value;
      loadView(ServerSettingsView);
    });
  },

  renderWorldList: function() {
    const container = document.getElementById('worldListContainer');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在刷新世界列表...</p></div>';

    authFetch('/resource/worldlist')
      .then(response => {
        if (!response.ok) throw new Error("无法加载世界列表");
        return response.json();
      })
      .then(worlds => {
        if (!worlds || worlds.length === 0) {
          container.innerHTML = '<div class="empty-state"><i class="fas fa-globe-americas"></i><p>暂无世界文件</p></div>';
          return;
        }
        let listHtml = `<div class="item-list">`;
        worlds.forEach((world, index) => {
          const isChecked = serverConfig.world === world ? 'checked' : (index === 0 && !serverConfig.world ? 'checked' : '');
          listHtml += `
            <label>
              <input type="radio" name="world" value="${world}" ${isChecked}>
              <i class="fas fa-globe" style="color:var(--gold-dim); margin-right:8px;"></i>
              ${world}
            </label>`;
        });
        listHtml += `</div>`;
        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = `<p class="status-fail" style="text-align:center;">加载失败: ${err.message}</p>`;
      });
  }
};